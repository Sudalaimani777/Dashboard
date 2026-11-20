// server/tests/users-reporting-admin.test.ts
import assert from 'node:assert/strict';
import {
  validateCreateUserInput,
  validateUpdateUserInput,
  UserValidationError,
} from '../src/features/users/users.validation.js';

async function run() {
  console.log('🧪 Testing User Validation for ADMIN creation and Reporting Admin hierarchy (TDD)...');

  const validAdminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const validManagerId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  // 1. Creation: Can create an ADMIN role
  const adminInput = {
    name: 'Sarah Connor',
    email: 'sarah.connor@readventure.com',
    password: 'Password123!',
    role: 'ADMIN',
    department: 'Executive Governance',
  };
  const createdAdmin = validateCreateUserInput(adminInput);
  assert.equal(createdAdmin.role, 'ADMIN', 'Must accept ADMIN as a valid managed user role');
  assert.equal(createdAdmin.managerId, null, 'ADMIN must not have managerId assigned');
  assert.equal(createdAdmin.reportingAdminId, null, 'ADMIN must not have reportingAdminId assigned');
  console.log('✓ validateCreateUserInput successfully validates ADMIN role');

  // 2. Creation: Can create a MANAGER with reportingAdminId
  const managerInput = {
    name: 'John Connor',
    email: 'john.connor@readventure.com',
    password: 'Password123!',
    role: 'MANAGER',
    department: 'Engineering',
    reportingAdminId: validAdminId,
    managerId: validManagerId, // Should be wiped because managers report to Admins, not Managers
  };
  const createdManager = validateCreateUserInput(managerInput);
  assert.equal(createdManager.role, 'MANAGER');
  assert.equal(createdManager.reportingAdminId, validAdminId, 'MANAGER must retain valid reportingAdminId');
  assert.equal(createdManager.managerId, null, 'MANAGER must have managerId forced to null');
  console.log('✓ validateCreateUserInput successfully validates MANAGER with reportingAdminId');

  // 3. Creation: EMPLOYEE must have reportingAdminId forced to null
  const employeeInput = {
    name: 'Kyle Reese',
    email: 'kyle.reese@readventure.com',
    password: 'Password123!',
    role: 'EMPLOYEE',
    department: 'Engineering',
    managerId: validManagerId,
    reportingAdminId: validAdminId, // Employees report to Managers, not direct to Admin
  };
  const createdEmployee = validateCreateUserInput(employeeInput);
  assert.equal(createdEmployee.role, 'EMPLOYEE');
  assert.equal(createdEmployee.managerId, validManagerId, 'EMPLOYEE retains managerId');
  assert.equal(createdEmployee.reportingAdminId, null, 'EMPLOYEE reportingAdminId must be forced to null');
  console.log('✓ validateCreateUserInput enforces EMPLOYEE manager hierarchy and null reportingAdminId');

  // 4. Creation: Invalid UUID format for reportingAdminId rejected
  assert.throws(
    () => {
      validateCreateUserInput({
        name: 'John Connor',
        email: 'john.connor@readventure.com',
        password: 'Password123!',
        role: 'MANAGER',
        department: 'Engineering',
        reportingAdminId: 'invalid-not-a-uuid',
      });
    },
    (err: any) => {
      assert(err instanceof UserValidationError);
      assert(err.message.includes('Invalid reporting admin ID format'));
      return true;
    },
    'Should throw UserValidationError for malformed reportingAdminId UUID'
  );
  console.log('✓ validateCreateUserInput rejects malformed reportingAdminId');

  // 5. Update: Can promote/change role to ADMIN
  const updateToAdmin = validateUpdateUserInput({ role: 'ADMIN' });
  assert.equal(updateToAdmin.role, 'ADMIN', 'Must accept role: ADMIN in update');
  console.log('✓ validateUpdateUserInput permits promotion to ADMIN');

  // 6. Update: Can assign and update reportingAdminId for Manager
  const updateReportingAdmin = validateUpdateUserInput({
    reportingAdminId: validAdminId,
  });
  assert.equal(updateReportingAdmin.reportingAdminId, validAdminId, 'Must update reportingAdminId');
  console.log('✓ validateUpdateUserInput permits updating reportingAdminId');

  // 7. Update: Can clear reportingAdminId by passing null or empty string
  const clearReportingAdmin = validateUpdateUserInput({
    reportingAdminId: null,
  });
  assert.equal(clearReportingAdmin.reportingAdminId, null, 'Must clear reportingAdminId to null');
  const clearReportingAdminStr = validateUpdateUserInput({
    reportingAdminId: '',
  });
  assert.equal(clearReportingAdminStr.reportingAdminId, null, 'Must clear reportingAdminId when empty string');
  console.log('✓ validateUpdateUserInput permits clearing reportingAdminId');

  // 8. Update: Invalid reportingAdminId rejected
  assert.throws(
    () => {
      validateUpdateUserInput({ reportingAdminId: 'bad-uuid' });
    },
    (err: any) => {
      assert(err instanceof UserValidationError);
      assert(err.message.includes('Invalid reporting admin ID format'));
      return true;
    }
  );
  console.log('✓ validateUpdateUserInput rejects malformed reportingAdminId');

  // 9. Update: Throws when no fields provided
  assert.throws(() => {
    validateUpdateUserInput({});
  }, /Provide at least one field to update/);
  console.log('✓ validateUpdateUserInput rejects empty update payload');

  console.log('🎉 ALL USER VALIDATION & REPORTING ADMIN TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
