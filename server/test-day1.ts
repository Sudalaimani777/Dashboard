import { app } from './src/app.js';
import { pool } from './src/shared/db/pool.js';
import { runMigrations } from './src/shared/db/migrate.js';
import http from 'node:http';

const PORT = 5099; // Isolated test port
let server: http.Server;

const baseUrl = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('\n🧪 ==========================================');
  console.log('   DAY 1 BACKEND VERIFICATION TEST SUITE');
  console.log('==========================================\n');

  // 1. Run migrations
  await runMigrations();

  // Start test server
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      resolve();
    });
  });

  const testEmail = `mentor_test_${Date.now()}@readventure.com`;
  const testPassword = 'Password123!';
  let authToken = '';
  let cookieHeader = '';

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

  // Test 1: Health check
  await assertTest('GET /api/health -> Database connected', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const json = await res.json();
    return res.status === 200 && json.database === 'connected';
  });

  // Test 2: User Signup (Registers user without auto-session)
  await assertTest('POST /api/auth/signup -> Register user account (no auto-session)', async () => {
    const res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mentor Verification User',
        email: testEmail,
        password: testPassword,
      }),
    });
    const setCookie = res.headers.get('set-cookie');
    const json = await res.json();

    return (
      res.status === 201 &&
      json.success === true &&
      json.data.user.email === testEmail &&
      !setCookie // Verifies no session cookie was automatically issued
    );
  });

  // Test 3: Duplicate Signup prevention
  await assertTest('POST /api/auth/signup (Duplicate) -> Returns 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: testEmail,
        password: testPassword,
      }),
    });
    return res.status === 409;
  });

  // Test 4: Validation on invalid email / short password
  await assertTest('POST /api/auth/signup (Invalid input) -> Returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'invalid-email-format',
        password: '123',
      }),
    });
    return res.status === 400;
  });

  // Test 5: Signin with valid credentials & sets HttpOnly cookie
  await assertTest('POST /api/auth/signin -> Signin successfully & returns HttpOnly cookie', async () => {
    const res = await fetch(`${baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const setCookie = res.headers.get('set-cookie') || '';
    const json = await res.json();
    if (
      res.status === 200 &&
      json.success &&
      !!json.data.token &&
      setCookie.includes('token=') &&
      setCookie.toLowerCase().includes('httponly')
    ) {
      authToken = json.data.token;
      cookieHeader = setCookie.split(';')[0];
      return true;
    }
    return false;
  });

  // Test 6: Signin with invalid password
  await assertTest('POST /api/auth/signin (Wrong password) -> Returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    return res.status === 401;
  });

  // Test 7: Protected Route with HttpOnly Cookie
  await assertTest('GET /api/auth/me (With HttpOnly Cookie) -> Authenticates & returns profile', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const json = await res.json();
    return res.status === 200 && json.data.user.email === testEmail;
  });

  // Test 8: Protected Route with Bearer Token fallback
  await assertTest('GET /api/auth/me (With Bearer Token Header) -> Authenticates & returns profile', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const json = await res.json();
    return res.status === 200 && json.data.user.email === testEmail;
  });

  // Test 9: Protected Route without token or cookie
  await assertTest('GET /api/auth/me (No Auth) -> Returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/auth/me`);
    return res.status === 401;
  });

  // Test 10: Signout clears cookie
  await assertTest('POST /api/auth/signout -> Clears HttpOnly cookie', async () => {
    const res = await fetch(`${baseUrl}/auth/signout`, { method: 'POST' });
    const setCookie = res.headers.get('set-cookie') || '';
    const json = await res.json();
    return (
      res.status === 200 &&
      json.success &&
      (setCookie.includes('token=;') || setCookie.includes('Expires=Thu, 01 Jan 1970'))
    );
  });

  console.log('\n==========================================');
  console.log(`📊 Summary: ${passed}/${total} Tests Passed`);
  console.log('==========================================\n');

  // Clean up
  server.close();
  await pool.end();

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
