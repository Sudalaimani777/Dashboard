import assert from 'node:assert/strict';
import { TravelService } from '../src/features/travel/travel.service.js';
import type { TravelRequest } from '../src/features/travel/travel.types.js';

function makeStubRequest(overrides: Partial<TravelRequest>): TravelRequest {
  return {
    id: overrides.id || 'req-1',
    user_id: overrides.user_id || 'emp-alice',
    userId: overrides.userId || 'emp-alice',
    manager_id: overrides.manager_id !== undefined ? overrides.manager_id : 'mgr-bob',
    managerId: overrides.managerId !== undefined ? overrides.managerId : 'mgr-bob',
    travel_type: 'UPCOMING',
    travelType: 'UPCOMING',
    title: 'Customer Onsite in Mumbai',
    purpose: 'Quarterly review',
    project_code: 'CLIENT-101',
    projectCode: 'CLIENT-101',
    origin: 'Bengaluru',
    destination: 'Mumbai',
    departure_date: '2026-11-25',
    departureDate: '2026-11-25',
    return_date: '2026-11-28',
    returnDate: '2026-11-28',
    emergency_contact_name: 'HR Team',
    emergencyContactName: 'HR Team',
    emergency_contact_phone: '+919876543210',
    emergencyContactPhone: '+919876543210',
    total_expenses: 25000,
    totalExpenses: 25000,
    status: overrides.status || 'PENDING_MANAGER_REVIEW',
    currency: 'INR',
    created_at: '2026-11-10T00:00:00Z',
    updated_at: '2026-11-10T00:00:00Z',
  };
}

async function run() {
  console.log('🧪 Running Line Manager BOLA / IDOR Authorization Tests (TDD)...');

  const aliceRequest = makeStubRequest({
    id: 'req-alice-101',
    userId: 'emp-alice',
    user_id: 'emp-alice',
    managerId: 'mgr-bob',
    manager_id: 'mgr-bob',
    status: 'PENDING_MANAGER_REVIEW',
  });

  const fakeRepo: any = {
    async findById(id: string) {
      if (id === aliceRequest.id) {
        return aliceRequest;
      }
      return null;
    },
    async updateStatusWithTimeline(data: any) {
      return {
        ...aliceRequest,
        status: data.toStatus,
        managerRemarks: data.remarks,
      };
    },
  };

  const service = new TravelService(fakeRepo);

  // --- TEST 1: Manager Charlie (unrelated line manager) CANNOT review Alice's request (BOLA Prevention) ---
  console.log('Testing Test 1: Third-party manager cannot review request...');
  await assert.rejects(
    () =>
      service.managerReview('mgr-charlie', 'req-alice-101', {
        action: 'APPROVE',
        remarks: 'Approved by third-party manager',
      }),
    /authorized|reporting line|assigned manager|forbidden/i,
    'managerReview MUST reject review attempt from a manager who is not the assigned reporting manager'
  );
  console.log('  ✅ PASS: Unrelated manager review blocked.');

  // --- TEST 2: Manager Charlie CANNOT inspect Alice's request details (BOLA Prevention) ---
  console.log('Testing Test 2: Third-party manager cannot inspect request...');
  await assert.rejects(
    () => service.getRequestById('req-alice-101', 'mgr-charlie', 'MANAGER'),
    /access denied|forbidden|authorized/i,
    'getRequestById MUST block third-party manager from inspecting employee request outside their reporting line'
  );
  console.log('  ✅ PASS: Unrelated manager inspection blocked.');

  // --- TEST 3: Designated Line Manager Bob CAN inspect Alice's request ---
  console.log('Testing Test 3: Designated line manager can inspect request...');
  const bobInspect = await service.getRequestById('req-alice-101', 'mgr-bob', 'MANAGER');
  assert.equal(bobInspect.id, 'req-alice-101', 'Assigned manager should be able to inspect direct report request');
  console.log('  ✅ PASS: Assigned manager can inspect.');

  // --- TEST 4: Designated Line Manager Bob CAN review Alice's request ---
  console.log('Testing Test 4: Designated line manager can review request...');
  const bobReview = await service.managerReview('mgr-bob', 'req-alice-101', {
    action: 'APPROVE',
    remarks: 'Approved for client travel',
  });
  assert.equal(bobReview.status, 'PENDING_ADMIN_APPROVAL');
  console.log('  ✅ PASS: Assigned manager can review.');

  // --- TEST 5: Admin CAN review Alice's request (Executive Governance Oversight) ---
  console.log('Testing Test 5: Admin can perform manager-level review if acting in oversight...');
  // Reset status back to PENDING_MANAGER_REVIEW for test
  aliceRequest.status = 'PENDING_MANAGER_REVIEW';
  const adminReview = await service.managerReview('admin-1', 'req-alice-101', {
    action: 'APPROVE',
    remarks: 'Executive override approval',
  }, 'ADMIN');
  assert.equal(adminReview.status, 'PENDING_ADMIN_APPROVAL');
  console.log('  ✅ PASS: Admin executive override permitted.');

  console.log('\n🎉 ALL BOLA AUTHORIZATION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ BOLA authorization test failed:', err);
  process.exit(1);
});
