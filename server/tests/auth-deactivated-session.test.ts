import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import { requireAuth, AuthenticatedRequest } from '../src/shared/middleware/auth.middleware.js';

async function run() {
  console.log('🧪 Running Deactivated Session Middleware Guard Tests (TDD)...');

  const token = jwt.sign(
    {
      userId: 'deactivated-user-uuid',
      email: 'terminated@corp.com',
      role: 'EMPLOYEE',
      department: 'Engineering',
    },
    config.jwt.secret as jwt.Secret,
    { expiresIn: '7d' }
  );

  let nextCalled = false;
  let responseStatus = 0;
  let responseBody: any = null;

  const mockReq: AuthenticatedRequest = {
    cookies: { token },
    headers: {},
  } as any;

  const mockRes: any = {
    status(code: number) {
      responseStatus = code;
      return this;
    },
    json(body: any) {
      responseBody = body;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  // Currently requireAuth only decodes JWT and calls next() without checking DB active status
  await requireAuth(mockReq, mockRes, next);

  // In secure state, next() must NOT be called, and responseStatus must be 401
  assert.equal(
    nextCalled,
    false,
    'requireAuth must NOT call next() for a deactivated user session'
  );
  assert.equal(
    responseStatus,
    401,
    'requireAuth must return 401 status for a deactivated account'
  );

  console.log('✅ ALL DEACTIVATED SESSION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Deactivated session test failed:', err);
  process.exit(1);
});
