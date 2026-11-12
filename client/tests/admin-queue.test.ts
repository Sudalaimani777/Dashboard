import assert from 'node:assert/strict';
import {
  classifyAdminQueue,
  filterAdminRequests,
  validateAdminDecisionRemarks,
  isManagerPersonalTrip,
} from '../src/features/travel/utils/adminQueue';
import { getFiscalQuarterFromDate } from '../src/features/travel/utils/travelAnalytics';
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
    status: overrides.status || 'PENDING_ADMIN_APPROVAL',
    currency: 'INR',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
    requesterName: overrides.requesterName || 'Asha Rao',
    requesterEmail: overrides.requesterEmail || 'asha@corp.com',
    requesterDepartment: overrides.requesterDepartment || 'Engineering',
    requesterRole: overrides.requesterRole || 'EMPLOYEE',
    timeline: overrides.timeline || [],
    ...overrides,
  };
}

async function run() {
  console.log('🧪 Running Admin Queue & Decision Validation Test Suite...');

  const queue: TravelRequest[] = [
    makeRequest({ id: 'exec-1', status: 'PENDING_ADMIN_APPROVAL', requesterDepartment: 'Engineering' }),
    makeRequest({
      id: 'tier1-mgr',
      userId: 'mgr-1',
      status: 'PENDING_MANAGER_REVIEW',
      requesterRole: 'MANAGER',
      requesterName: 'Maya (Manager)',
      requesterDepartment: 'Product',
    }),
    makeRequest({
      id: 'tier1-emp',
      userId: 'emp-2',
      status: 'PENDING_MANAGER_REVIEW',
      requesterRole: 'EMPLOYEE',
      requesterDepartment: 'Engineering',
    }),
    makeRequest({ id: 'rev-mgr', status: 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' }),
    makeRequest({ id: 'rev-emp', status: 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE' }),
    makeRequest({ id: 'arch-approved', status: 'APPROVED' }),
    makeRequest({ id: 'arch-settled', status: 'SETTLED', travelType: 'ALREADY_TRAVELLED' }),
    makeRequest({ id: 'arch-rejected', status: 'REJECTED' }),
    makeRequest({ id: 'arch-cancelled', status: 'CANCELLED' }),
  ];

  const classified = classifyAdminQueue(queue);

  assert.equal(classified.awaitingExecutive.length, 1);
  assert.equal(classified.tier1Oversight.length, 2);
  // Manager personal trips must sort first in Tier 1 oversight
  assert.equal(classified.tier1Oversight[0].id, 'tier1-mgr');
  assert.equal(isManagerPersonalTrip(classified.tier1Oversight[0]), true);
  assert.equal(isManagerPersonalTrip(classified.tier1Oversight[1]), false);
  assert.equal(classified.dispatchedRevisions.length, 2);
  // Cancelled must be included in ledgerArchive
  assert.equal(classified.ledgerArchive.length, 4);
  assert.ok(classified.ledgerArchive.some((r) => r.status === 'CANCELLED'));

  // Filtering checks
  const filteredDept = filterAdminRequests(classified.tier1Oversight, {
    query: '',
    typeFilter: 'ALL',
    departmentFilter: 'Product',
  });
  assert.deepEqual(
    filteredDept.map((r) => r.id),
    ['tier1-mgr']
  );

  const filteredCancelled = filterAdminRequests(classified.ledgerArchive, {
    query: '',
    typeFilter: 'ALL',
    statusFilter: 'CANCELLED',
  });
  assert.deepEqual(
    filteredCancelled.map((r) => r.id),
    ['arch-cancelled']
  );

  // Remarks & budget override validation
  assert.equal(validateAdminDecisionRemarks('REJECT', 'no').valid, false);
  assert.equal(validateAdminDecisionRemarks('REJECT', 'Out of policy window').valid, true);
  assert.equal(validateAdminDecisionRemarks('REQUEST_REVISION', '  ').valid, false);
  assert.equal(validateAdminDecisionRemarks('APPROVE', '', { isOverflow: true, forceOverride: false }).valid, false);
  assert.equal(validateAdminDecisionRemarks('APPROVE', '', { isOverflow: true, forceOverride: true }).valid, true);
  assert.equal(validateAdminDecisionRemarks('SETTLE', '', { isOverflow: false }).valid, true);

  // Fiscal quarter extraction
  assert.deepEqual(getFiscalQuarterFromDate('2026-02-14'), { year: 2026, quarter: 'Q1' });
  assert.deepEqual(getFiscalQuarterFromDate('2026-05-01'), { year: 2026, quarter: 'Q2' });
  assert.deepEqual(getFiscalQuarterFromDate('2026-08-30'), { year: 2026, quarter: 'Q3' });
  assert.deepEqual(getFiscalQuarterFromDate('2026-11-20'), { year: 2026, quarter: 'Q4' });

  console.log('✅ All Admin queue, fiscal quarter & decision validation tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
