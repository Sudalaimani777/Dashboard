import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  classifyManagerQueue,
  filterManagerRequests,
  isManagerReviewableStatus,
  canManagerAuditRequest,
} from '../src/features/travel/utils/managerQueue';
import type { TravelRequest } from '../src/features/travel/types/travel.types';

async function run() {
  console.log('🧪 Testing Unified Manager Governance & Personal Queue Logic...');

  const clientSrc = path.resolve(import.meta.dirname, '../src');

  // 1. DashboardPage default tab check
  const dashboardSource = fs.readFileSync(
    path.join(clientSrc, 'features/dashboard/DashboardPage.tsx'),
    'utf8'
  );
  assert.ok(
    dashboardSource.includes("'team'") || dashboardSource.includes('"team"'),
    "DashboardPage must set default tab for MANAGER to 'team'"
  );

  // 2. ManagerQueuePortal Unified Workspaces & Segment Checks
  const portalSource = fs.readFileSync(
    path.join(clientSrc, 'features/travel/components/ManagerQueuePortal.tsx'),
    'utf8'
  );

  assert.ok(
    portalSource.includes('tab=team') || portalSource.includes("'team'"),
    'ManagerQueuePortal must support tab=team as primary unified team workspace'
  );

  // Redundant tablist removal assertion
  assert.ok(
    !portalSource.includes('Filter team requests by approval status'),
    'ManagerQueuePortal must NOT have redundant team stage tablist'
  );

  // Active KPI card bindings and toolbar clean checks
  assert.ok(
    portalSource.includes("isActive: teamSegment === 'AUDIT'"),
    'ManagerQueuePortal Card 1 must bind active state for AUDIT'
  );
  assert.ok(
    !portalSource.includes('Reset to All'),
    'ManagerQueuePortal must NOT have redundant Reset to All button'
  );
  assert.ok(
    !portalSource.includes('Filter by trip type'),
    'ManagerQueuePortal must NOT have redundant trip type toggle'
  );

  assert.ok(
    portalSource.includes('/travel/requests/'),
    'ManagerQueuePortal row action must navigate directly to /travel/requests/:id'
  );
  assert.ok(
    !portalSource.includes('TeamPipelineSummaryCard'),
    'ManagerQueuePortal must not render redundant TeamPipelineSummaryCard'
  );
  assert.ok(
    !portalSource.includes('/travel/audit/'),
    'ManagerQueuePortal must not route to deprecated /travel/audit/:id'
  );

  // 3. Personal Travel & Drafts Consolidation Checks
  assert.ok(
    portalSource.includes('Saved Drafts') &&
      portalSource.includes('Action Needed') &&
      portalSource.includes('In Flight'),
    'ManagerQueuePortal must provide personal lifecycle segment pills integrating drafts into personal travel'
  );

  // 4. Mock Queue Partitioning & Self-Review Guard Tests
  const mockTeamRequests: Partial<TravelRequest>[] = [
    {
      id: 'req-1',
      userId: 'emp-1',
      title: 'Direct Report Initial Trip',
      status: 'PENDING_MANAGER_REVIEW',
      totalExpenses: 12000,
      departureDate: '2026-12-01',
      returnDate: '2026-12-05',
    },
    {
      id: 'req-2',
      userId: 'emp-2',
      title: 'Direct Report Resubmitted Trip',
      status: 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
      totalExpenses: 9000,
      departureDate: '2026-12-10',
      returnDate: '2026-12-12',
    },
    {
      id: 'req-3',
      userId: 'emp-3',
      title: 'Forwarded to Admin Clearance',
      status: 'PENDING_ADMIN_APPROVAL',
      totalExpenses: 25000,
      departureDate: '2026-12-15',
      returnDate: '2026-12-18',
    },
    {
      id: 'req-4',
      userId: 'emp-4',
      title: 'Waiting on Employee Corrections',
      status: 'REVISION_REQUESTED_BY_MANAGER',
      totalExpenses: 5000,
      departureDate: '2026-12-20',
      returnDate: '2026-12-24',
    },
    {
      id: 'req-5',
      userId: 'emp-5',
      title: 'Settled Historical Trip',
      status: 'SETTLED',
      totalExpenses: 18000,
      departureDate: '2026-11-01',
      returnDate: '2026-11-05',
    },
    {
      id: 'req-6',
      userId: 'mgr-current',
      title: 'Manager Own Personal Trip',
      status: 'PENDING_MANAGER_REVIEW',
      totalExpenses: 14000,
      departureDate: '2026-12-08',
      returnDate: '2026-12-11',
    },
  ];

  const currentManagerId = 'mgr-current';
  const classified = classifyManagerQueue(
    mockTeamRequests as TravelRequest[],
    currentManagerId
  );

  // Manager's own personal trip must be strictly excluded from the team queue
  assert.ok(
    !classified.teamQueue.some((r) => r.userId === currentManagerId),
    "Manager's own personal request must be excluded from teamQueue"
  );
  assert.equal(classified.initialAudit.length, 1, 'Should have 1 pending initial audit');
  assert.equal(classified.revisions.length, 1, 'Should have 1 in revisions');
  assert.equal(
    classified.teamHistoryAndTracking.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL').length,
    1,
    'Should have 1 awaiting admin clearance'
  );
  assert.equal(
    classified.teamHistoryAndTracking.filter((r) => r.status === 'REVISION_REQUESTED_BY_MANAGER').length,
    1,
    'Should have 1 waiting on employee'
  );
  assert.equal(
    classified.teamHistoryAndTracking.filter((r) => r.status === 'SETTLED').length,
    1,
    'Should have 1 settled'
  );

  console.log('✅ ALL UNIFIED MANAGER GOVERNANCE & QUEUE TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
