// client/tests/admin-queue-scoping.test.ts
import assert from 'node:assert/strict';
import { isAssignedToAdmin } from '../src/features/travel/utils/adminQueue';
import type { TravelRequest } from '../src/features/travel/types/travel.types';

console.log('🧪 Testing client-side Admin Queue Scoping ("Assigned to Me" utility) (TDD)...');

const adminAId = 'admin-uuid-1111';
const adminBId = 'admin-uuid-2222';

const directAssignedTrip: TravelRequest = {
  id: 'req-1',
  userId: 'user-1',
  adminId: adminAId,
  title: 'Direct Assigned Trip',
  status: 'PENDING_ADMIN_APPROVAL',
  totalExpenses: 5000,
  currency: 'INR',
} as any;

const managerReportedTrip: TravelRequest = {
  id: 'req-2',
  userId: 'emp-1',
  managerId: 'mgr-1',
  managerReportingAdminId: adminAId,
  title: 'Employee Trip under Admin A Manager',
  status: 'PENDING_MANAGER_REVIEW',
  totalExpenses: 8000,
  currency: 'INR',
} as any;

const managerPersonalTrip: TravelRequest = {
  id: 'req-3',
  userId: 'mgr-1',
  requesterReportingAdminId: adminAId,
  title: 'Manager Personal Trip',
  status: 'PENDING_ADMIN_APPROVAL',
  totalExpenses: 12000,
  currency: 'INR',
} as any;

const unassignedTrip: TravelRequest = {
  id: 'req-4',
  userId: 'user-2',
  adminId: null,
  title: 'Legacy Unassigned Trip',
  status: 'PENDING_ADMIN_APPROVAL',
  totalExpenses: 3000,
  currency: 'INR',
} as any;

// Test 1: Direct Assignment matches Admin A, rejects Admin B
assert.equal(isAssignedToAdmin(directAssignedTrip, adminAId), true);
assert.equal(isAssignedToAdmin(directAssignedTrip, adminBId), false);
console.log('✓ Test 1: Direct assignment matched correctly');

// Test 2: Manager reporting admin matches Admin A, rejects Admin B
assert.equal(isAssignedToAdmin(managerReportedTrip, adminAId), true);
assert.equal(isAssignedToAdmin(managerReportedTrip, adminBId), false);
console.log('✓ Test 2: Manager reporting admin matched correctly');

// Test 3: Requester manager reporting admin matches Admin A, rejects Admin B
assert.equal(isAssignedToAdmin(managerPersonalTrip, adminAId), true);
assert.equal(isAssignedToAdmin(managerPersonalTrip, adminBId), false);
console.log('✓ Test 3: Requester reporting admin matched correctly');

// Test 4: Unassigned trip is not matched as assigned to Admin B
assert.equal(isAssignedToAdmin(unassignedTrip, adminBId), false);
assert.equal(isAssignedToAdmin(unassignedTrip, null), false);
console.log('✓ Test 4: Unassigned trips safely return false for specific admin');

console.log('🎉 ALL CLIENT ADMIN QUEUE SCOPING TESTS PASSED!');
