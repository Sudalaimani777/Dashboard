import http from 'node:http';
import { app } from './src/app.js';
import { pool, query } from './src/shared/db/pool.js';
import { runMigrations } from './src/shared/db/migrate.js';

const PORT = 5098; // Dedicated port for Day 2 tests
let server: http.Server;
const baseUrl = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('\n🧪 ==========================================');
  console.log('   DAY 2 BACKEND VERIFICATION TEST SUITE');
  console.log('==========================================\n');

  await runMigrations();

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => resolve());
  });

  const testEmail = `day2_user_${Date.now()}@readventure.com`;
  const originalPassword = 'InitialPassword123!';
  const updatedPassword = 'NewSecretPassword456!';
  let receivedResetToken = '';

  let passed = 0;
  let total = 0;

  async function assertTest(name: string, fn: () => Promise<boolean>) {
    total++;
    try {
      const ok = await fn();
      if (ok) {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: ${name}`);
      }
    } catch (err) {
      console.log(`  ❌ FAIL: ${name} -> ${(err as Error).message}`);
    }
  }

  try {
    // 0. Setup: Register a user for test
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Day2 Tester',
        email: testEmail,
        password: originalPassword,
      }),
    });
    const signupData = await signupRes.json();
    if (!signupData.success) {
      throw new Error(`Initial test signup failed: ${JSON.stringify(signupData)}`);
    }

    // Test 1: Forgot password with registered email
    await assertTest('POST /api/auth/forgot-password with valid email returns 200 & preview URL', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const body = await res.json();
      return res.status === 200 && body.success === true && typeof body.message === 'string';
    });

    // Test 2: Forgot password with unregistered email (Anti-enumeration)
    await assertTest('POST /api/auth/forgot-password with non-existent email returns 200 (anti-enumeration)', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ghost_nonexistent@readventure.com' }),
      });
      const body = await res.json();
      return res.status === 200 && body.success === true;
    });

    // Test 3: Invalid email format rejected
    await assertTest('POST /api/auth/forgot-password with invalid email rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 4: Verify SHA-256 token hash & expiry in PostgreSQL
    await assertTest('PostgreSQL holds SHA-256 hash (64 hex chars) and future expiration', async () => {
      const dbRes = await query(
        `SELECT reset_token, reset_token_expires_at FROM users WHERE email = LOWER($1)`,
        [testEmail]
      );
      const row = dbRes.rows[0];
      const has64HexToken = typeof row?.reset_token === 'string' && row.reset_token.length === 64;
      const isFutureExpiry = new Date(row?.reset_token_expires_at).getTime() > Date.now();
      return has64HexToken && isFutureExpiry;
    });

    // Test 5: Bogus/invalid token rejected
    await assertTest('POST /api/auth/reset-password with invalid token rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid_bogus_token_12345',
          newPassword: updatedPassword,
        }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 6: Short password rejected
    await assertTest('POST /api/auth/reset-password with short password (<6 chars) rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'some_token',
          newPassword: '123',
        }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 7: Successful password reset with valid token
    await assertTest('POST /api/auth/reset-password successfully resets password & clears token in DB', async () => {
      const crypto = await import('node:crypto');
      const testRawToken = 'a'.repeat(64); // 32-byte hex string
      const testHashedToken = crypto.createHash('sha256').update(testRawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await query(
        `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = LOWER($3)`,
        [testHashedToken, expiresAt, testEmail]
      );

      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: testRawToken,
          newPassword: updatedPassword,
        }),
      });

      const body = await res.json();
      const isSuccess = res.status === 200 && body.success === true;

      // Verify DB cleared
      const dbCheck = await query(
        `SELECT reset_token, reset_token_expires_at FROM users WHERE email = LOWER($1)`,
        [testEmail]
      );
      const isCleared = dbCheck.rows[0].reset_token === null && dbCheck.rows[0].reset_token_expires_at === null;

      receivedResetToken = testRawToken;
      return isSuccess && isCleared;
    });

    // Test 8: Replay attack prevention (consumed token cannot be used again)
    await assertTest('Replay protection: re-using the consumed token fails with 400', async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: receivedResetToken,
          newPassword: 'AnotherPassword789!',
        }),
      });
      const body = await res.json();
      return res.status === 400 && body.success === false;
    });

    // Test 9: Old password fails, new password succeeds
    await assertTest('End-to-End Auth: Old password fails (401), New password succeeds (200 + token)', async () => {
      const oldLoginRes = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: originalPassword,
        }),
      });

      const newLoginRes = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: updatedPassword,
        }),
      });
      const newLoginBody = await newLoginRes.json();

      return oldLoginRes.status === 401 && newLoginRes.status === 200 && newLoginBody.success === true;
    });

  } finally {
    await pool.end();
    server.close();
  }

  console.log('\n==========================================');
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log('==========================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
