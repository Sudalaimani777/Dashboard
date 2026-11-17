import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Helper matching EmployeeTravelPortal segment resolution and classification
export type EmployeeStatusSegment = 'ALL' | 'IN_FLIGHT' | 'REVISIONS' | 'DRAFTS' | 'CONCLUDED';

export function resolveEmployeeSegment(activeTab?: string, explicitSegment?: string): EmployeeStatusSegment {
  if (explicitSegment && ['ALL', 'IN_FLIGHT', 'REVISIONS', 'DRAFTS', 'CONCLUDED'].includes(explicitSegment)) {
    return explicitSegment as EmployeeStatusSegment;
  }
  switch (activeTab) {
    case 'revisions':
      return 'REVISIONS';
    case 'drafts':
      return 'DRAFTS';
    case 'past':
      return 'CONCLUDED';
    case 'present':
      return 'IN_FLIGHT';
    case 'trips':
    default:
      return 'ALL';
  }
}

export function filterEmployeeRequestsBySegment(requests: any[], segment: EmployeeStatusSegment): any[] {
  switch (segment) {
    case 'IN_FLIGHT':
      return requests.filter((r) =>
        ['SUBMITTED', 'PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'].includes(r.status)
      );
    case 'REVISIONS':
      return requests.filter((r) => String(r.status).includes('REVISION_REQUESTED'));
    case 'DRAFTS':
      return requests.filter((r) => r.status === 'DRAFT');
    case 'CONCLUDED':
      return requests.filter((r) =>
        ['APPROVED', 'SETTLED', 'REJECTED', 'CANCELLED'].includes(r.status)
      );
    case 'ALL':
    default:
      return requests;
  }
}

export function getEmployeeRowAction(req: { id: string; status: string }) {
  if (String(req.status).includes('REVISION')) {
    return {
      label: 'Fix & Resubmit',
      url: `/travel/requests/${req.id}/edit?tab=revisions`,
    };
  }
  if (req.status === 'DRAFT') {
    return {
      label: 'Resume Draft',
      url: `/travel/requests/${req.id}/edit?tab=drafts`,
    };
  }
  if (['APPROVED', 'SETTLED', 'REJECTED', 'CANCELLED'].includes(req.status)) {
    return {
      label: 'Inspect',
      url: `/travel/requests/${req.id}?tab=past`,
      cloneUrl: `/travel/new?clone=${req.id}`,
    };
  }
  return {
    label: 'Inspect',
    url: `/travel/requests/${req.id}`,
  };
}

async function run() {
  console.log('🧪 Testing Employee Unified Travel Workspace & Segment Logic...');

  const mockRequests = [
    { id: 'req-1', title: 'Client Meeting Delhi', status: 'DRAFT', totalExpenses: 12000 },
    { id: 'req-2', title: 'Tech Expo Pune', status: 'SUBMITTED', totalExpenses: 18000 },
    { id: 'req-3', title: 'Onsite Hyderabad', status: 'PENDING_MANAGER_REVIEW', totalExpenses: 25000 },
    { id: 'req-4', title: 'Vendor Sync Bangalore', status: 'PENDING_ADMIN_APPROVAL', totalExpenses: 30000 },
    { id: 'req-5', title: 'Sales Pitch Mumbai', status: 'REVISION_REQUESTED_BY_MANAGER', totalExpenses: 15000 },
    { id: 'req-6', title: 'Design Review Chennai', status: 'REVISION_REQUESTED_BY_ADMIN', totalExpenses: 22000 },
    { id: 'req-7', title: 'DevConf Goa', status: 'APPROVED', totalExpenses: 35000 },
    { id: 'req-8', title: 'Ops Audit Kolkata', status: 'SETTLED', totalExpenses: 28000 },
    { id: 'req-9', title: 'Field Research Jaipur', status: 'REJECTED', totalExpenses: 9000 },
    { id: 'req-10', title: 'Cancelled Flight Ahmedabad', status: 'CANCELLED', totalExpenses: 5000 },
  ];

  // 1. Verify Status Segment Filtering
  const allTrips = filterEmployeeRequestsBySegment(mockRequests, 'ALL');
  assert.equal(allTrips.length, 10, 'ALL segment must include all 10 trips');

  const inFlight = filterEmployeeRequestsBySegment(mockRequests, 'IN_FLIGHT');
  assert.equal(inFlight.length, 3, 'IN_FLIGHT must have 3 requests');
  assert.deepEqual(inFlight.map((r) => r.id), ['req-2', 'req-3', 'req-4']);

  const revisions = filterEmployeeRequestsBySegment(mockRequests, 'REVISIONS');
  assert.equal(revisions.length, 2, 'REVISIONS must have 2 requests requiring action');
  assert.deepEqual(revisions.map((r) => r.id), ['req-5', 'req-6']);

  const drafts = filterEmployeeRequestsBySegment(mockRequests, 'DRAFTS');
  assert.equal(drafts.length, 1, 'DRAFTS must have 1 request');
  assert.equal(drafts[0].id, 'req-1');

  const concluded = filterEmployeeRequestsBySegment(mockRequests, 'CONCLUDED');
  assert.equal(concluded.length, 4, 'CONCLUDED must have 4 requests');
  assert.deepEqual(concluded.map((r) => r.id), ['req-7', 'req-8', 'req-9', 'req-10']);

  // 2. Verify Legacy Tab Resolution
  assert.equal(resolveEmployeeSegment('present'), 'IN_FLIGHT');
  assert.equal(resolveEmployeeSegment('revisions'), 'REVISIONS');
  assert.equal(resolveEmployeeSegment('drafts'), 'DRAFTS');
  assert.equal(resolveEmployeeSegment('past'), 'CONCLUDED');
  assert.equal(resolveEmployeeSegment('trips'), 'ALL');
  assert.equal(resolveEmployeeSegment(undefined), 'ALL');
  assert.equal(resolveEmployeeSegment('trips', 'REVISIONS'), 'REVISIONS');

  // 3. Verify Contextual Row Actions
  const draftAction = getEmployeeRowAction(mockRequests[0]);
  assert.equal(draftAction.label, 'Resume Draft');
  assert.equal(draftAction.url, '/travel/requests/req-1/edit?tab=drafts');

  const inFlightAction = getEmployeeRowAction(mockRequests[1]);
  assert.equal(inFlightAction.label, 'Inspect');
  assert.equal(inFlightAction.url, '/travel/requests/req-2');

  const revisionAction = getEmployeeRowAction(mockRequests[4]);
  assert.equal(revisionAction.label, 'Fix & Resubmit');
  assert.equal(revisionAction.url, '/travel/requests/req-5/edit?tab=revisions');

  const concludedAction = getEmployeeRowAction(mockRequests[6]);
  assert.equal(concludedAction.label, 'Inspect');
  assert.equal(concludedAction.url, '/travel/requests/req-7?tab=past');
  assert.equal(concludedAction.cloneUrl, '/travel/new?clone=req-7');

  // 4. Source Code Validation: DashboardPage.tsx
  const dashboardSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/dashboard/DashboardPage.tsx'),
    'utf8'
  );
  assert.ok(
    dashboardSource.includes("'trips'"),
    'DashboardPage must set default tab for EMPLOYEE to trips'
  );

  // 5. Source Code Validation: EmployeeTravelPortal.tsx
  const portalSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/travel/components/EmployeeTravelPortal.tsx'),
    'utf8'
  );
  assert.ok(
    portalSource.includes('EmployeeStatusSegment') || portalSource.includes('statusSegment'),
    'EmployeeTravelPortal must support segmented status pills'
  );
  assert.ok(
    portalSource.includes('exportRequestsToCsv'),
    'EmployeeTravelPortal must include CSV export'
  );

  // 6. Verification of Redundant Segment Pill Removal (Option 1)
  assert.ok(
    !portalSource.includes('Filter my travel by stage') && !portalSource.includes('w-[750px] ml-auto'),
    'EmployeeTravelPortal must NOT have the redundant lower stage tablist (w-[750px] ml-auto)'
  );

  // 7. Verification of Active KPI Card Filter & Reset
  assert.ok(
    portalSource.includes("isActive: statusSegment === 'IN_FLIGHT'") ||
    portalSource.includes('statusSegment === \'IN_FLIGHT\''),
    'KPI Card 1 must bind active state for IN_FLIGHT'
  );
  assert.ok(
    !portalSource.includes('Reset to All'),
    'EmployeeTravelPortal toolbar must NOT contain redundant Reset to All button'
  );

  // 8. Verification of TravelMetricsGrid isActive Support
  const gridSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/travel/components/shared/TravelMetricsGrid.tsx'),
    'utf8'
  );
  assert.ok(
    gridSource.includes('isActive?: boolean'),
    'TravelMetricsGrid must support isActive on MetricItem'
  );

  // 9. Verification of Toolbar De-cluttering (Option 1)
  assert.ok(
    !portalSource.includes('All Concluded'),
    'EmployeeTravelPortal must NOT have redundant All Concluded sub-filter pills'
  );
  assert.ok(
    !portalSource.includes('typeFilter === opt.id'),
    'EmployeeTravelPortal must NOT have redundant typeFilter pill group in toolbar'
  );

  console.log('✅ ALL EMPLOYEE UNIFIED WORKSPACE TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
