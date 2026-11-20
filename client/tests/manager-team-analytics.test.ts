import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeManagerTeamOverview,
  computeManagerMonthlyBurnSeries,
  computeManagerCategoryShares,
  computeManagerApprovalHealth,
  computeManagerSpendersAndProjectVelocity,
} from '../src/features/travel/utils/managerAnalytics';
import type { TravelRequest } from '../src/features/travel/types/travel.types';

const mockTeamRequests: Partial<TravelRequest>[] = [
  {
    id: 'req-1',
    userId: 'emp-1',
    requesterName: 'Alice Johnson',
    managerId: 'mgr-1',
    status: 'SETTLED',
    totalExpenses: 50000,
    origin: 'Bangalore',
    destination: 'Mumbai',
    createdAt: '2026-03-01T10:00:00.000Z',
    managerReviewedAt: '2026-03-02T10:00:00.000Z', // 1.0 day
    updatedAt: '2026-03-05T10:00:00.000Z',
    projectCode: 'PROJ-ALPHA',
    expenses: [
      { id: 'exp-1', category: 'FLIGHT', amount: 25000, merchant: 'IndiGo', expenseDate: '2026-03-01' },
      { id: 'exp-2', category: 'HOTEL', amount: 25000, merchant: 'Taj', expenseDate: '2026-03-02' },
    ],
  },
  {
    id: 'req-2',
    userId: 'emp-2',
    requesterName: 'Bob Smith',
    managerId: 'mgr-1',
    status: 'PENDING_ADMIN_APPROVAL',
    totalExpenses: 35000,
    origin: 'Bangalore',
    destination: 'Delhi',
    createdAt: '2026-03-10T09:00:00.000Z',
    managerReviewedAt: '2026-03-12T09:00:00.000Z', // 2.0 days
    updatedAt: '2026-03-12T09:00:00.000Z',
    projectCode: 'PROJ-BETA',
    expenses: [
      { id: 'exp-3', category: 'FLIGHT', amount: 20000, merchant: 'Air India', expenseDate: '2026-03-10' },
      { id: 'exp-4', category: 'MEALS_PER_DIEM', amount: 15000, merchant: 'Per Diem', expenseDate: '2026-03-11' },
    ],
  },
  {
    id: 'req-3',
    userId: 'emp-3',
    requesterName: 'Charlie Brown',
    managerId: 'mgr-1',
    status: 'PENDING_MANAGER_REVIEW',
    totalExpenses: 20000,
    origin: 'Bangalore',
    destination: 'Hyderabad',
    createdAt: '2026-03-15T09:00:00.000Z',
    updatedAt: '2026-03-15T09:00:00.000Z',
    projectCode: 'PROJ-ALPHA',
    expenses: [],
  },
  {
    id: 'req-4',
    userId: 'emp-1',
    requesterName: 'Alice Johnson',
    managerId: 'mgr-1',
    status: 'REVISION_REQUESTED_BY_MANAGER',
    totalExpenses: 15000,
    origin: 'Bangalore',
    destination: 'Chennai',
    createdAt: '2026-03-12T10:00:00.000Z',
    managerReviewedAt: '2026-03-13T10:00:00.000Z',
    updatedAt: '2026-03-13T10:00:00.000Z',
    projectCode: 'PROJ-GAMMA',
    expenses: [],
  },
];

async function run() {
  console.log('🧪 Testing Manager Team Analytics engine & utilities...');

  const requests = mockTeamRequests as TravelRequest[];

  // 1. Overview KPIs
  const overview = computeManagerTeamOverview(requests);
  assert.ok(overview, 'Overview should exist');
  assert.equal(overview.teamTotalClearedSpend, 50000, 'Team cleared spend should equal settled trip amount');
  assert.equal(overview.teamPendingApprovals, 70000, 'Pending team approvals should sum req-2, req-3, req-4 (35k + 20k + 15k = 70k)');
  assert.equal(overview.activeSpendersCount, 3, 'Should count 3 unique team members (Alice, Bob, Charlie)');
  assert.equal(overview.totalTeamTrips, 4, 'Total team trips should be 4');

  // 2. 6-Month Monthly Burn Series
  const burnSeries = computeManagerMonthlyBurnSeries(requests);
  assert.ok(Array.isArray(burnSeries), 'Monthly burn series should be array');
  assert.equal(burnSeries.length, 6, 'Should generate 6 months of historical points');

  // 3. Category Shares
  const categories = computeManagerCategoryShares(requests);
  assert.ok(Array.isArray(categories), 'Categories should return array');
  const flightCat = categories.find((c) => c.categoryKey === 'FLIGHT');
  assert.ok(flightCat, 'FLIGHT category should exist');
  assert.equal(flightCat.amount, 45000, 'Flight amount should be 25000 + 20000 = 45000');

  // 4. Approval Pipeline & Health
  const approvalHealth = computeManagerApprovalHealth(requests);
  assert.ok(approvalHealth, 'Approval health should exist');
  assert.equal(approvalHealth.forwardedCount, 2, 'Forwarded/approved count should be 2 (req-1 settled + req-2 pending admin)');
  assert.equal(approvalHealth.pendingManagerCount, 1, 'Pending manager count should be 1 (req-3)');
  assert.equal(approvalHealth.returnedCount, 1, 'Returned count should be 1 (req-4)');
  assert.ok(typeof approvalHealth.avgReviewDays === 'number', 'Average review days should be numeric');
  // Avg of 1.0 day (req-1) and 2.0 days (req-2) and 1.0 day (req-4) = (1 + 2 + 1) / 3 = 1.33d
  assert.ok(approvalHealth.avgReviewDays > 0, 'Average review days should be positive');

  // 5. Spenders & Project Velocity
  const velocity = computeManagerSpendersAndProjectVelocity(requests);
  assert.ok(velocity.byMember.length > 0, 'Should aggregate by team member');
  assert.ok(velocity.byProject.length > 0, 'Should aggregate by project');
  const topMember = velocity.byMember[0];
  assert.equal(topMember.name, 'Alice Johnson', 'Alice should be top spender (50k + 15k = 65k)');
  assert.equal(topMember.tripCount, 2, 'Alice should have 2 trips');

  // 6. Source File Checks for Components
  const componentsDir = path.resolve(import.meta.dirname, '../src/features/travel/components/manager');
  assert.ok(
    fs.existsSync(path.join(componentsDir, 'ManagerApprovalMeterCard.tsx')),
    'ManagerApprovalMeterCard.tsx must exist'
  );
  assert.ok(
    fs.existsSync(path.join(componentsDir, 'ManagerSpendersVelocityCard.tsx')),
    'ManagerSpendersVelocityCard.tsx must exist'
  );
  assert.ok(
    fs.existsSync(path.join(componentsDir, 'ManagerTeamAuditLedgerCard.tsx')),
    'ManagerTeamAuditLedgerCard.tsx must exist'
  );
  const pageFile = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/ManagerTeamAnalyticsPage.tsx'
  );
  assert.ok(fs.existsSync(pageFile), 'ManagerTeamAnalyticsPage.tsx must exist');

  const pageContent = fs.readFileSync(pageFile, 'utf-8');
  assert.ok(
    !pageContent.includes('New Request'),
    'ManagerTeamAnalyticsPage must not render redundant New Request button'
  );
  assert.ok(
    !pageContent.includes('/travel/new'),
    'ManagerTeamAnalyticsPage must not navigate to /travel/new'
  );

  const employeeSpendPageFile = path.resolve(
    import.meta.dirname,
    '../src/features/travel/pages/EmployeeSpendAnalyticsPage.tsx'
  );
  const employeeSpendContent = fs.readFileSync(employeeSpendPageFile, 'utf-8');
  assert.ok(
    employeeSpendContent.includes('New Request'),
    'EmployeeSpendAnalyticsPage should retain the New Request button for personal spend'
  );

  console.log('✅ ALL MANAGER TEAM ANALYTICS TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
