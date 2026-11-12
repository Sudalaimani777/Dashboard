import assert from 'node:assert/strict';
import { TravelService } from '../src/features/travel/travel.service.js';
import type { TravelRequest } from '../src/features/travel/travel.types.js';

function makeStubRequest(overrides: Partial<TravelRequest>): TravelRequest {
  return {
    id: overrides.id || 'req-1',
    user_id: overrides.user_id || 'mgr-1',
    userId: overrides.userId || 'mgr-1',
    manager_id: null,
    managerId: null,
    travel_type: 'UPCOMING',
    travelType: 'UPCOMING',
    title: 'Manager Personal Trip',
    purpose: 'Leadership offsite',
    project_code: 'ENG-2026',
    projectCode: 'ENG-2026',
    origin: 'Bengaluru',
    destination: 'Mumbai',
    departure_date: '2026-11-20',
    departureDate: '2026-11-20',
    return_date: '2026-11-22',
    returnDate: '2026-11-22',
    emergency_contact_name: 'HR',
    emergencyContactName: 'HR',
    emergency_contact_phone: '+919876543210',
    emergencyContactPhone: '+919876543210',
    total_expenses: 12000,
    totalExpenses: 12000,
    status: overrides.status || 'PENDING_MANAGER_REVIEW',
    currency: 'INR',
    created_at: '2026-11-10T00:00:00Z',
    updated_at: '2026-11-10T00:00:00Z',
  };
}

async function run() {
  console.log('🧪 Running Manager Self-Review & Reject Guard Unit Tests...');

  let capturedUpdate: any = null;
  const fakeRepo: any = {
    async findById(id: string) {
      if (id === 'own-req') {
        return makeStubRequest({ id: 'own-req', userId: 'mgr-1', user_id: 'mgr-1' });
      }
      if (id === 'team-req') {
        return makeStubRequest({ id: 'team-req', userId: 'emp-1', user_id: 'emp-1' });
      }
      return null;
    },
    async updateStatusWithTimeline(data: any) {
      capturedUpdate = data;
      return makeStubRequest({
        id: data.requestId,
        userId: 'emp-1',
        user_id: 'emp-1',
        status: data.toStatus,
        managerRemarks: data.remarks,
      });
    },
  };

  const service = new TravelService(fakeRepo);

  // 1. Manager MUST be blocked from approving/revising/rejecting their own personal request
  await assert.rejects(
    () => service.managerReview('mgr-1', 'own-req', { action: 'APPROVE', remarks: 'Self approved' }),
    /own|self/i,
    'managerReview must reject when managerId matches request.userId'
  );

  // 2. Manager CAN reject a direct report's request with remarks >= 3 chars
  const rejected = await service.managerReview('mgr-1', 'team-req', {
    action: 'REJECT',
    remarks: 'Duplicate travel dates with Q4 freeze',
  });
  assert.equal(rejected.status, 'REJECTED');
  assert.equal(capturedUpdate?.toStatus, 'REJECTED');

  // 3. Manager REJECT fails if remarks < 3 chars
  await assert.rejects(
    () => service.managerReview('mgr-1', 'team-req', { action: 'REJECT', remarks: 'No' }),
    /Remarks are required/i
  );

  console.log('✅ ALL MANAGER GUARD UNIT TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Manager guard unit tests failed:', err);
  process.exit(1);
});
