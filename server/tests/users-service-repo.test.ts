// server/tests/users-service-repo.test.ts
import assert from 'node:assert/strict';
import { pool } from '../src/shared/db/pool.js';
import { runMigrations } from '../src/shared/db/migrate.js';
import { UsersService } from '../src/features/users/users.service.js';
import { usersRepository } from '../src/features/users/users.repository.js';
import { UserValidationError } from '../src/features/users/users.validation.js';

async function run() {
  console.log('🧪 Testing UsersService & UsersRepository for ADMIN creation & Reporting Admin hierarchy (TDD)...');

  await runMigrations();
  const service = new UsersService(usersRepository);

  const timestamp = Date.now();
  const adminEmail = `test.admin.${timestamp}@readventure.com`;
  const managerEmail = `test.mgr.${timestamp}@readventure.com`;
  const empEmail = `test.emp.${timestamp}@readventure.com`;

  // 1. Create an ADMIN via UsersService
  const createdAdmin = await service.createUser({
    name: 'Executive SuperAdmin',
    email: adminEmail,
    password: 'Password123!',
    role: 'ADMIN',
    department: 'Governance',
  });
  assert.equal(createdAdmin.role, 'ADMIN', 'Created user should be ADMIN');
  assert.equal(createdAdmin.manager_id, null, 'ADMIN must have manager_id null');
  assert.equal(createdAdmin.reporting_admin_id, null, 'ADMIN must have reporting_admin_id null');
  console.log('✓ Successfully created ADMIN via UsersService');

  // 2. Reject creating a MANAGER pointing to a non-existent reporting admin
  await assert.rejects(
    async () => {
      await service.createUser({
        name: 'Manager Ghost Admin',
        email: `ghost.${timestamp}@readventure.com`,
        password: 'Password123!',
        role: 'MANAGER',
        department: 'Engineering',
        reportingAdminId: '00000000-0000-0000-0000-000000000000',
      });
    },
    (err: any) => {
      assert(err instanceof UserValidationError);
      assert(err.message.includes('Selected reporting admin does not exist'));
      return true;
    },
    'Should throw UserValidationError when reporting admin does not exist'
  );
  console.log('✓ Rejects MANAGER with non-existent reportingAdminId');

  // 3. Create a MANAGER pointing to the created ADMIN
  const createdManager = await service.createUser({
    name: 'Engineering Manager',
    email: managerEmail,
    password: 'Password123!',
    role: 'MANAGER',
    department: 'Engineering',
    reportingAdminId: createdAdmin.id,
  });
  assert.equal(createdManager.role, 'MANAGER');
  assert.equal(createdManager.reporting_admin_id, createdAdmin.id, 'MANAGER reporting_admin_id must match Admin ID');
  assert.equal(createdManager.reporting_admin_name, 'Executive SuperAdmin', 'Join must populate reporting_admin_name');
  assert.equal(createdManager.manager_id, null, 'MANAGER manager_id must be null');
  console.log('✓ Successfully created MANAGER with reporting_admin_id & reporting_admin_name join');

  // 4. Reject creating a MANAGER pointing to another MANAGER as reporting admin
  await assert.rejects(
    async () => {
      await service.createUser({
        name: 'Manager Nested',
        email: `nested.${timestamp}@readventure.com`,
        password: 'Password123!',
        role: 'MANAGER',
        department: 'Engineering',
        reportingAdminId: createdManager.id,
      });
    },
    (err: any) => {
      assert(err instanceof UserValidationError);
      assert(err.message.includes('must hold the ADMIN role'));
      return true;
    },
    'Should throw UserValidationError when reportingAdmin is not an ADMIN'
  );
  console.log('✓ Rejects MANAGER with non-admin reportingAdminId');

  // 5. Create an EMPLOYEE reporting to the created MANAGER
  const createdEmployee = await service.createUser({
    name: 'Frontend Engineer',
    email: empEmail,
    password: 'Password123!',
    role: 'EMPLOYEE',
    department: 'Engineering',
    managerId: createdManager.id,
  });
  assert.equal(createdEmployee.role, 'EMPLOYEE');
  assert.equal(createdEmployee.manager_id, createdManager.id);
  assert.equal(createdEmployee.manager_name, 'Engineering Manager');
  assert.equal(createdEmployee.reporting_admin_id, null, 'EMPLOYEE must have reporting_admin_id null');
  console.log('✓ Successfully created EMPLOYEE reporting to MANAGER');

  // 6. Update EMPLOYEE: promote to MANAGER and assign reportingAdminId
  const promotedManager = await service.updateUser(createdEmployee.id, createdAdmin.id, {
    role: 'MANAGER',
    reportingAdminId: createdAdmin.id,
  });
  assert.equal(promotedManager.role, 'MANAGER');
  assert.equal(promotedManager.reporting_admin_id, createdAdmin.id);
  assert.equal(promotedManager.reporting_admin_name, 'Executive SuperAdmin');
  assert.equal(promotedManager.manager_id, null, 'Promoted manager must have manager_id cleared to null');
  console.log('✓ Successfully promoted EMPLOYEE to MANAGER with reporting_admin_id');

  // 7. Reject self-assignment as reporting admin
  await assert.rejects(
    async () => {
      await service.updateUser(createdAdmin.id, createdAdmin.id, {
        reportingAdminId: createdAdmin.id,
      });
    },
    (err: any) => {
      assert(err instanceof UserValidationError);
      assert(err.message.includes('own reporting admin'));
      return true;
    },
    'Should throw UserValidationError when user assigns themselves as reporting admin'
  );
  console.log('✓ Rejects assigning self as reporting admin');

  // Clean up test records
  await usersRepository.deleteUser(createdEmployee.id);
  await usersRepository.deleteUser(createdManager.id);
  await usersRepository.deleteUser(createdAdmin.id);

  console.log('🎉 ALL USERS REPOSITORY & SERVICE TESTS PASSED!');
  await pool.end();
}

run().catch(async (err) => {
  console.error('❌ Test failed:', err);
  await pool.end();
  process.exit(1);
});
