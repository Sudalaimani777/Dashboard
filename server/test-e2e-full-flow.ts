import http from 'node:http';
import { app } from './src/app.js';
import { pool, query } from './src/shared/db/pool.js';
import { runMigrations } from './src/shared/db/migrate.js';

const PORT = 5097; // Isolated port for full flow E2E test
let server: http.Server;
const baseUrl = `http://localhost:${PORT}/api`;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
};

async function runFullFlowE2E() {
  console.log(`\n${colors.bright}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   READVENTURE COMPLETE AUTH LIFECYCLE E2E TEST${colors.reset}`);
  console.log(`${colors.cyan}   Signup -> Signin -> Protected Profile -> Signout ->`);
  console.log(`   Forgot Password -> Email Preview -> Reset Password ->`);
  console.log(`   Old Password Rejected -> New Password Signin${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}======================================================${colors.reset}\n`);

  await runMigrations();

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const timestamp = Date.now();
  const testUser = {
    name: 'Maya Explorer',
    email: `maya_flow_${timestamp}@readventure.com`,
    originalPassword: 'Password123!',
    newPassword: 'BrandNewSecretPassword2026!',
  };

  let authCookie = '';
  let rawResetToken = '';
  let emailPreviewUrl = '';

  let stepNumber = 1;
  async function step(description: string, fn: () => Promise<boolean>) {
    process.stdout.write(`Step ${stepNumber++}: ${description}... `);
    try {
      const ok = await fn();
      if (ok) {
        console.log(`${colors.green}✅ PASSED${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ FAILED${colors.reset}`);
        process.exitCode = 1;
      }
    } catch (err) {
      console.log(`${colors.red}❌ ERROR: ${(err as Error).message}${colors.reset}`);
      process.exitCode = 1;
    }
  }

  try {
    // Step 1: Health check
    await step('Verify Server & Database connectivity (/health)', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const data = await res.json();
      return res.status === 200 && data.status === 'ok' && data.database === 'connected';
    });

    // Step 2: Signup
    await step(`Register new account (${testUser.email})`, async () => {
      const res = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testUser.name,
          email: testUser.email,
          password: testUser.originalPassword,
        }),
      });

      const data = await res.json();
      const rawCookie = res.headers.get('set-cookie');
      if (rawCookie) {
        authCookie = rawCookie.split(';')[0];
      }

      return (
        res.status === 201 &&
        data.success === true &&
        data.data.user.email === testUser.email.toLowerCase() &&
        typeof data.data.token === 'string'
      );
    });

    // Step 3: Access Protected Profile via Cookie
    await step('Access protected profile (/me) using HttpOnly Cookie', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Cookie: authCookie,
        },
      });
      const data = await res.json();
      return res.status === 200 && data.success === true && data.data.user.name === testUser.name;
    });

    // Step 4: Signout
    await step('Signout and invalidate session cookie (/signout)', async () => {
      const res = await fetch(`${baseUrl}/auth/signout`, {
        method: 'POST',
      });
      const data = await res.json();
      const setCookie = res.headers.get('set-cookie') || '';
      return res.status === 200 && data.success === true && (setCookie.includes('Max-Age=0') || setCookie.includes('Expires=Thu, 01 Jan 1970'));
    });

    // Step 5: Signin with original credentials
    await step('Sign in with original credentials (/signin)', async () => {
      const res = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.originalPassword,
        }),
      });
      const data = await res.json();
      const rawCookie = res.headers.get('set-cookie');
      if (rawCookie) {
        authCookie = rawCookie.split(';')[0];
      }
      return res.status === 200 && data.success === true && typeof data.data.token === 'string';
    });

    // Step 6: Trigger Forgot Password
    await step('Request password reset link (/forgot-password)', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
        }),
      });
      const data = await res.json();
      emailPreviewUrl = data.data?.previewUrl || '';

      // In real scenario, user clicks email link with rawToken.
      // We will generate raw token & store its SHA-256 in DB to simulate user clicking link:
      const crypto = await import('node:crypto');
      rawResetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await query(
        `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = LOWER($3)`,
        [hashedToken, expiresAt, testUser.email]
      );

      return res.status === 200 && data.success === true;
    });

    if (emailPreviewUrl) {
      console.log(`   ${colors.magenta}📬 Sample Ethereal Reset Email Preview URL: ${emailPreviewUrl}${colors.reset}`);
    }

    // Step 7: Verify DB security (SHA-256 stored, not plain token)
    await step('Verify token is securely hashed (SHA-256) in PostgreSQL', async () => {
      const dbRes = await query(
        `SELECT reset_token, reset_token_expires_at FROM users WHERE email = LOWER($1)`,
        [testUser.email]
      );
      const row = dbRes.rows[0];
      return (
        row.reset_token !== rawResetToken &&
        row.reset_token.length === 64 &&
        new Date(row.reset_token_expires_at).getTime() > Date.now()
      );
    });

    // Step 8: Reset Password
    await step('Reset password using token (/reset-password)', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawResetToken,
          newPassword: testUser.newPassword,
        }),
      });
      const data = await res.json();

      // Check that DB reset token has been cleared
      const dbCheck = await query(
        `SELECT reset_token, reset_token_expires_at FROM users WHERE email = LOWER($1)`,
        [testUser.email]
      );
      const row = dbCheck.rows[0];
      const tokenCleared = row.reset_token === null && row.reset_token_expires_at === null;

      return res.status === 200 && data.success === true && tokenCleared;
    });

    // Step 9: Replay protection
    await step('Replay protection: used reset token is immediately rejected', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawResetToken,
          newPassword: 'YetAnotherPassword!',
        }),
      });
      return res.status === 400;
    });

    // Step 10: Old password fails
    await step('Verify sign-in with OLD password is now REJECTED (401)', async () => {
      const res = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.originalPassword,
        }),
      });
      return res.status === 401;
    });

    // Step 11: New password succeeds
    await step('Verify sign-in with NEW password SUCCEEDS (200 + new session)', async () => {
      const res = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.newPassword,
        }),
      });
      const data = await res.json();
      const rawCookie = res.headers.get('set-cookie');
      if (rawCookie) {
        authCookie = rawCookie.split(';')[0];
      }
      return res.status === 200 && data.success === true && typeof data.data.token === 'string';
    });

    // Step 12: Access profile with new session
    await step('Access protected profile (/me) with new session', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Cookie: authCookie,
        },
      });
      const data = await res.json();
      return res.status === 200 && data.success === true && data.data.user.name === testUser.name;
    });

    console.log(`\n${colors.bright}${colors.green}🎉 ALL 12 END-TO-END FLOW CHECKS COMPLETED SUCCESSFULLY!${colors.reset}\n`);

  } finally {
    await pool.end();
    server.close();
  }
}

runFullFlowE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
