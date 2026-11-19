import assert from 'node:assert/strict';
import { authService } from '../src/features/auth/auth.service.js';

async function run() {
  console.log('🧪 Testing Auth Role & Department Contract Synchronization...');

  const timestamp = Date.now();
  const email = `test-role-${timestamp}@tripflow.internal`;
  
  // 1. Sign up a new user
  const reg = await authService.signup({
    name: 'Ada Lovelace',
    email,
    password: 'Password123!',
  });

  console.log('  Signup result user:', reg.user);
  assert.ok(reg.user.role, 'User role must be defined on signup response');
  assert.equal(reg.user.role, 'EMPLOYEE', 'Default user role must be EMPLOYEE');
  assert.ok(reg.user.department, 'User department must be defined on signup response');
  assert.equal(reg.user.department, 'Engineering', 'Default department must be Engineering');

  // 2. Sign in with the user
  const signinResult = await authService.signin({
    email,
    password: 'Password123!',
  });
  console.log('  Signin result user:', signinResult.user);
  assert.equal(signinResult.user.role, 'EMPLOYEE', 'Signin result must include role');
  assert.equal(signinResult.user.department, 'Engineering', 'Signin result must include department');

  // 3. Get profile (/api/auth/me)
  const profile = await authService.getProfile(reg.user.id);
  console.log('  Profile result:', profile);
  assert.equal(profile.role, 'EMPLOYEE', 'Profile must include role');
  assert.equal(profile.department, 'Engineering', 'Profile must include department');

  console.log('✅ ALL AUTH ROLE & DEPARTMENT CONTRACT TESTS PASSED!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
