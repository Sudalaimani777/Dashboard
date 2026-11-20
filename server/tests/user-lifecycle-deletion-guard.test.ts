import assert from 'node:assert/strict';
import { UsersService } from '../src/features/users/users.service.js';

async function run() {
  console.log('🧪 Running User Lifecycle Deletion Guard Tests (TDD)...');

  let deleteUserCalled = false;

  const fakeRepo: any = {
    async findById(id: string) {
      if (id === 'user-with-trips') {
        return {
          id: 'user-with-trips',
          name: 'Jane Traveler',
          email: 'jane@corp.com',
          role: 'EMPLOYEE',
          department: 'Sales',
          manager_id: null,
          is_active: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        };
      }
      return null;
    },
    async countUserTravelRecords(userId: string) {
      if (userId === 'user-with-trips') {
        return 4; // User has 4 travel requests
      }
      return 0;
    },
    async deleteUser(_id: string) {
      deleteUserCalled = true;
      return true;
    },
  };

  const service = new UsersService(fakeRepo);

  // Attempting to delete a user with travel records must be rejected to prevent CASCADE loss of audit history
  await assert.rejects(
    () => service.deleteUser('user-with-trips', 'admin-actor-id'),
    /audit|financial|travel|deactivate/i,
    'deleteUser MUST throw an error when attempting to delete a user with associated travel or expense history'
  );

  assert.equal(
    deleteUserCalled,
    false,
    'Repository deleteUser must NOT be called when travel records exist'
  );

  console.log('✅ ALL USER DELETION GUARD TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ User deletion guard test failed:', err);
  process.exit(1);
});
