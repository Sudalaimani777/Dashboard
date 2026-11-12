import assert from 'node:assert/strict';
import {
  classifyManagerQueue,
  filterManagerRequests,
  validateManagerDecisionRemarks,
  isManagerReviewableStatus,
  canManagerAuditRequest,
} from '../src/features/travel/utils/managerQueue';
import type { TravelRequest } from '../src/features/travel/types/travel.types';

function makeRequest(overrides: Partial<TravelRequest>): TravelRequest {
  return {
    id: overrides.id || 'req-1',
    userId: overrides.userId || 'emp-1',
    travelType: overrides.travelType || 'UPCOMING',
    title: overrides.title || 'Delhi Client Visit',
    purpose: overrides.purpose || 'Architecture planning',
    projectCode: overrides.projectCode || 'ENG-2026',
    origin: overrides.origin || 'Bengaluru',
    destination: overrides.destination || 'Delhi',
    departureDate: overrides.departureDate || '2026-11-20',
    returnDate: overrides.returnDate || '2026-11-22',
    emergencyContactName: 'HR',
    emergencyContactPhone: '+919876543210',
    totalExpenses: overrides.totalExpenses ?? 15000,
    status: overrides.status || 'PENDING_MANAGER_REVIEW',
    currency: 'INR',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    requesterName: overrides.requesterName || 'Asha Rao',
    requesterEmail: overrides.requesterEmail || 'asha@corp.com',
    timeline: overrides.timeline || [],
    ...overrides,
  };
}

async function run() {
  console.log('🧪 Running Manager Queue & Audit Helpers Test Suite...');

  const managerId = 'mgr-100';

  const queue: TravelRequest[] = [
    // Own personal request must NEVER appear in manager's team queues
    makeRequest({
      id: 'own-req',
      userId: managerId,
      title: 'My Own Summit',
      status: 'PENDING_MANAGER_REVIEW',
    }),
    // Initial submission (should be ONLY in initialAudit, even with 2 non-revision events)
    makeRequest({
      id: 'initial-1',
      userId: 'emp-1',
      title: 'Mumbai Audit',
      status: 'PENDING_MANAGER_REVIEW',
      timeline: [
        { id: 't1', eventType: 'SUBMITTED', toStatus: 'DRAFT' },
        { id: 't2', eventType: 'SUBMITTED', fromStatus: 'DRAFT', toStatus: 'PENDING_MANAGER_REVIEW' },
      ],
    }),
    // Admin directive -> Revised Requests
    makeRequest({
      id: 'rev-admin',
      userId: 'emp-2',
      title: 'Tokyo Summit',
      status: 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
    }),
    // Employee resubmitted after manager/admin revision -> Revised Requests ONLY (not initialAudit)
    makeRequest({
      id: 'rev-emp',
      userId: 'emp-3',
      title: 'Pune Workshop',
      status: 'PENDING_MANAGER_REVIEW',
      timeline: [
        { id: 't1', eventType: 'SUBMITTED', toStatus: 'PENDING_MANAGER_REVIEW' },
        { id: 't2', eventType: 'REVISION_REQUESTED_BY_MANAGER', toStatus: 'REVISION_REQUESTED_BY_MANAGER' },
        { id: 't3', eventType: 'RESUBMITTED', toStatus: 'PENDING_MANAGER_REVIEW' },
      ],
    }),
    // Awaiting Admin Clearance -> Past / Tracking
    makeRequest({
      id: 'awaiting-admin',
      userId: 'emp-1',
      status: 'PENDING_ADMIN_APPROVAL',
    }),
    // Waiting on Employee -> Past / Tracking
    makeRequest({
      id: 'waiting-emp-1',
      userId: 'emp-1',
      status: 'REVISION_REQUESTED_BY_MANAGER',
    }),
    makeRequest({
      id: 'waiting-emp-2',
      userId: 'emp-2',
      status: 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
    }),
    // Concluded & Cancelled -> Past / Tracking
    makeRequest({ id: 'approved-1', userId: 'emp-1', status: 'APPROVED' }),
    makeRequest({ id: 'settled-1', userId: 'emp-2', status: 'SETTLED', travelType: 'ALREADY_TRAVELLED' }),
    makeRequest({ id: 'rejected-1', userId: 'emp-3', status: 'REJECTED' }),
    makeRequest({ id: 'cancelled-1', userId: 'emp-4', status: 'CANCELLED' }),
  ];

  // 1. Self-request exclusion & disjoint queue partitioning
  const classified = classifyManagerQueue(queue, managerId);

  assert.deepEqual(
    classified.initialAudit.map((r) => r.id),
    ['initial-1'],
    'initialAudit must exclude own requests and resubmitted revisions'
  );

  assert.deepEqual(
    classified.revisions.map((r) => r.id),
    ['rev-admin', 'rev-emp'],
    'revisions must include Admin directives and Employee resubmissions after revision'
  );

  assert.deepEqual(
    classified.teamHistoryAndTracking.map((r) => r.id),
    [
      'awaiting-admin',
      'waiting-emp-1',
      'waiting-emp-2',
      'approved-1',
      'settled-1',
      'rejected-1',
      'cancelled-1',
    ],
    'teamHistoryAndTracking must include Awaiting Admin, Waiting on Employee, Approved/Settled, Rejected, and Cancelled'
  );

  // 2. Search, Type, and Status Bucket filters
  const awaitingAdminOnly = filterManagerRequests(classified.teamHistoryAndTracking, {
    statusBucket: 'AWAITING_ADMIN',
  });
  assert.deepEqual(awaitingAdminOnly.map((r) => r.id), ['awaiting-admin']);

  const waitingEmployeeOnly = filterManagerRequests(classified.teamHistoryAndTracking, {
    statusBucket: 'WAITING_EMPLOYEE',
  });
  assert.deepEqual(waitingEmployeeOnly.map((r) => r.id), ['waiting-emp-1', 'waiting-emp-2']);

  const rejectedOrCancelled = filterManagerRequests(classified.teamHistoryAndTracking, {
    statusBucket: 'REJECTED_CANCELLED',
  });
  assert.deepEqual(rejectedOrCancelled.map((r) => r.id), ['rejected-1', 'cancelled-1']);

  const claimsOnly = filterManagerRequests(classified.teamHistoryAndTracking, {
    typeFilter: 'ALREADY_TRAVELLED',
  });
  assert.deepEqual(claimsOnly.map((r) => r.id), ['settled-1']);

  const searchByRequester = filterManagerRequests(queue, { query: 'Asha' });
  assert.ok(searchByRequester.length >= 1, 'Search should match requesterName');

  // 3. Decision remarks validation (>= 3 chars required for REJECT & REQUEST_REVISION)
  assert.equal(validateManagerDecisionRemarks('APPROVE', '').valid, true);
  assert.equal(validateManagerDecisionRemarks('REQUEST_REVISION', 'no').valid, false);
  assert.equal(validateManagerDecisionRemarks('REQUEST_REVISION', 'Attach hotel quote').valid, true);
  assert.equal(validateManagerDecisionRemarks('REJECT', '  ').valid, false);
  assert.equal(validateManagerDecisionRemarks('REJECT', 'ab').valid, false);
  assert.equal(validateManagerDecisionRemarks('REJECT', 'Duplicate claim').valid, true);

  // 4. Audit workstation access guards
  assert.equal(isManagerReviewableStatus('PENDING_MANAGER_REVIEW'), true);
  assert.equal(isManagerReviewableStatus('REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'), true);
  assert.equal(isManagerReviewableStatus('PENDING_ADMIN_APPROVAL'), false);
  assert.equal(isManagerReviewableStatus('CANCELLED'), false);

  assert.equal(
    canManagerAuditRequest(makeRequest({ userId: managerId, status: 'PENDING_MANAGER_REVIEW' }), managerId),
    false,
    'Manager cannot audit their own personal request'
  );
  assert.equal(
    canManagerAuditRequest(makeRequest({ userId: 'emp-1', status: 'PENDING_MANAGER_REVIEW' }), managerId),
    true,
    'Manager can audit team member pending request'
  );

  console.log('✅ ALL MANAGER QUEUE & AUDIT HELPER TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Manager queue tests failed:', err);
  process.exit(1);
});
