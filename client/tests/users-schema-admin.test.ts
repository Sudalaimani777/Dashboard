// client/tests/users-schema-admin.test.ts
import assert from 'node:assert/strict';
import {
  createUserSchema,
  updateUserSchema,
} from '../src/features/users/schemas/users.schema';

async function run() {
  console.log('🧪 Testing Client User Schemas for ADMIN creation & Reporting Admin (TDD)...');

  const validAdminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const validManagerId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  // 1. createUserSchema accepts role: 'ADMIN'
  const adminData = {
    name: 'Executive Director',
    email: 'executive@readventure.com',
    password: 'SecurePassword123!',
    role: 'ADMIN',
    department: 'Executive Governance',
  };
  const parsedAdmin = createUserSchema.parse(adminData);
  assert.equal(parsedAdmin.role, 'ADMIN', 'createUserSchema must accept role: ADMIN');
  console.log('✓ createUserSchema successfully accepts role: ADMIN');

  // 2. createUserSchema accepts role: 'MANAGER' with reportingAdminId
  const managerData = {
    name: 'Engineering Lead',
    email: 'eng.lead@readventure.com',
    password: 'SecurePassword123!',
    role: 'MANAGER',
    department: 'Engineering',
    reportingAdminId: validAdminId,
  };
  const parsedManager = createUserSchema.parse(managerData);
  assert.equal(parsedManager.role, 'MANAGER');
  assert.equal(parsedManager.reportingAdminId, validAdminId, 'createUserSchema must accept reportingAdminId');
  console.log('✓ createUserSchema successfully accepts MANAGER with reportingAdminId');

  // 3. createUserSchema accepts role: 'EMPLOYEE' with managerId
  const employeeData = {
    name: 'Staff Engineer',
    email: 'staff.eng@readventure.com',
    password: 'SecurePassword123!',
    role: 'EMPLOYEE',
    department: 'Engineering',
    managerId: validManagerId,
  };
  const parsedEmployee = createUserSchema.parse(employeeData);
  assert.equal(parsedEmployee.role, 'EMPLOYEE');
  assert.equal(parsedEmployee.managerId, validManagerId);
  console.log('✓ createUserSchema successfully accepts EMPLOYEE with managerId');

  // 4. updateUserSchema accepts role: 'ADMIN' and reportingAdminId
  const updateData = {
    role: 'ADMIN',
    department: 'Executive Governance',
    reportingAdminId: validAdminId,
  };
  const parsedUpdate = updateUserSchema.parse(updateData);
  assert.equal(parsedUpdate.role, 'ADMIN');
  assert.equal(parsedUpdate.department, 'Executive Governance');
  assert.equal(parsedUpdate.reportingAdminId, validAdminId);
  console.log('✓ updateUserSchema successfully accepts role: ADMIN and reportingAdminId');

  // 5. Negative validation checks
  assert.throws(
    () => {
      createUserSchema.parse({
        name: 'A', // Too short (min 2)
        email: 'bad-email',
        password: 'short',
        role: 'EMPLOYEE',
        department: 'Eng',
      });
    },
    /Name must be 2–100 characters/,
    'Should reject invalid short name'
  );
  console.log('✓ Validation rules reject invalid inputs correctly');

  console.log('🎉 ALL CLIENT USER SCHEMA TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
