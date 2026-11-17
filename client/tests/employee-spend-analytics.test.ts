import assert from 'node:assert/strict';
import {
  computeEmployeeMonthlyBurnSeries,
  computeEmployeeCategoryShares,
  computeEmployeeProjectAndRouteVelocity,
  computeEmployeeSpendOverview,
  computeEmployeeSettlementHealth,
} from '../src/features/travel/utils/employeeAnalytics';
import type { TravelRequest } from '../src/features/travel/types/travel.types';

const mockRequests: Partial<TravelRequest>[] = [
  {
    id: 'req-1',
    status: 'SETTLED',
    totalExpenses: 42000,
    origin: 'Bangalore',
    destination: 'Mumbai',
    departureDate: '2026-03-10T00:00:00.000Z',
    returnDate: '2026-03-14T00:00:00.000Z',
    createdAt: '2026-03-14T10:00:00.000Z',
    updatedAt: '2026-03-16T10:00:00.000Z',
    projectCode: 'PROJ-ALPHA',
    expenses: [
      { id: 'exp-1', category: 'FLIGHT', amount: 20000, merchant: 'IndiGo', expenseDate: '2026-03-10' },
      { id: 'exp-2', category: 'HOTEL', amount: 15000, merchant: 'Marriott', expenseDate: '2026-03-12' },
      { id: 'exp-3', category: 'MEALS_PER_DIEM', amount: 7000, merchant: 'Meals', expenseDate: '2026-03-13' },
    ],
  },
  {
    id: 'req-2',
    status: 'APPROVED',
    totalExpenses: 30000,
    origin: 'Bangalore',
    destination: 'Delhi',
    departureDate: '2026-04-05T00:00:00.000Z',
    returnDate: '2026-04-08T00:00:00.000Z',
    projectCode: 'PROJ-BETA',
    expenses: [],
  },
  {
    id: 'req-3',
    status: 'PENDING_MANAGER_REVIEW',
    totalExpenses: 25000,
    origin: 'Bangalore',
    destination: 'Mumbai',
    departureDate: '2026-04-20T00:00:00.000Z',
    returnDate: '2026-04-22T00:00:00.000Z',
    projectCode: 'PROJ-ALPHA',
    expenses: [],
  },
  {
    id: 'req-4',
    status: 'PENDING_ADMIN_APPROVAL',
    totalExpenses: 48000,
    origin: 'Bangalore',
    destination: 'Hyderabad',
    departureDate: '2026-02-15T00:00:00.000Z',
    returnDate: '2026-02-18T00:00:00.000Z',
    projectCode: 'PROJ-GAMMA',
    expenses: [
      { id: 'exp-4', category: 'FLIGHT', amount: 15000, merchant: 'Air India', expenseDate: '2026-02-15' },
      { id: 'exp-5', category: 'HOTEL', amount: 25000, merchant: 'Hyatt', expenseDate: '2026-02-16' },
      { id: 'exp-6', category: 'TRANSIT', amount: 8000, merchant: 'Cab', expenseDate: '2026-02-17' },
    ],
  },
];

async function run() {
  console.log('🧪 Testing Employee Spend Analytics utility functions...');

  const requests = mockRequests as TravelRequest[];

  // 1. Overview KPIs
  const overview = computeEmployeeSpendOverview(requests);
  assert.ok(overview, 'Overview should return valid data');
  // Cleared spend: settled or closed trips actual expenses (req-1: 42000)
  assert.equal(overview.totalClearedSpend, 42000, 'Total cleared spend should match settled expenses');
  // Pending claims/commitments: approved + claim_submitted + submitted (req-2: 30000, req-3: 25000, req-4: 48000 = 103000)
  assert.equal(overview.pendingCommitments, 103000, 'Pending commitments should include approved & pending claims');
  // Total trips
  assert.equal(overview.totalTrips, 4, 'Total trips should be 4');
  // Unique destinations: Mumbai, Delhi, Hyderabad = 3
  assert.equal(overview.uniqueDestinationsCount, 3, 'Should count 3 unique destination cities');

  // 2. Monthly Burn Series (6 months)
  const burnSeries = computeEmployeeMonthlyBurnSeries(requests);
  assert.ok(Array.isArray(burnSeries), 'Monthly burn series should be an array');
  assert.equal(burnSeries.length, 6, 'Should generate 6 months of data points');
  burnSeries.forEach((pt) => {
    assert.ok(typeof pt.month === 'string', 'Point should have month label');
    assert.ok(typeof pt.approved === 'number', 'Point should have approved number');
    assert.ok(typeof pt.pending === 'number', 'Point should have pending number');
  });

  // 3. Category Shares (For Donut / Pie Chart)
  const categories = computeEmployeeCategoryShares(requests);
  assert.ok(Array.isArray(categories), 'Categories should return array');
  const flightCat = categories.find((c) => c.categoryKey === 'FLIGHT');
  assert.ok(flightCat, 'FLIGHT category should be present');
  // 20000 + 15000 = 35000
  assert.equal(flightCat.amount, 35000, 'Flight category amount should sum all flight expenses');
  categories.forEach((cat) => {
    assert.ok(cat.label && typeof cat.label === 'string', 'Category must have label');
    assert.ok(typeof cat.amount === 'number' && cat.amount > 0, 'Category amount must be positive');
    assert.ok(typeof cat.percentage === 'number', 'Category percentage must be numeric');
    assert.ok(cat.color.startsWith('#'), 'Category color must be valid hex');
  });

  // Source code check for EmployeeCategoryPieChart
  const fs = await import('node:fs');
  const path = await import('node:path');
  const pieChartFile = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/charts/EmployeeCategoryPieChart.tsx'
  );
  assert.ok(fs.existsSync(pieChartFile), 'EmployeeCategoryPieChart.tsx must exist');

  // 4. Project and Route Velocity
  const velocity = computeEmployeeProjectAndRouteVelocity(requests);
  assert.ok(velocity.byProject.length > 0, 'Should aggregate by project');
  assert.ok(velocity.byRoute.length > 0, 'Should aggregate by route');
  const projAlpha = velocity.byProject.find((p) => p.code === 'PROJ-ALPHA');
  assert.ok(projAlpha, 'PROJ-ALPHA should exist');
  assert.equal(projAlpha.tripCount, 2, 'PROJ-ALPHA should have 2 trips');

  // 5. Settlement & Reimbursement Health
  const health = computeEmployeeSettlementHealth(requests);
  assert.ok(health, 'Health summary should exist');
  assert.equal(health.totalSettledAmount, 42000, 'Total settled amount should match req-1');
  assert.equal(health.totalPendingSettlementAmount, 30000, 'Pending settlement should match req-2 (APPROVED)');
  assert.equal(health.totalInReviewAmount, 73000, 'In review amount should sum req-3 & req-4');
  assert.equal(health.settledCount, 1, 'Settled count should be 1');
  assert.equal(health.pendingSettlementCount, 1, 'Pending settlement count should be 1');
  assert.equal(health.inReviewCount, 2, 'In review count should be 2');
  assert.ok(typeof health.settlementRatePct === 'number', 'Settlement rate percentage should be numeric');
  assert.equal(health.avgTurnaroundDays, 2, 'Avg turnaround days should be exactly 2 days from submission to settlement');

  // Verify that if there are no settled requests, avgTurnaroundDays is null (not fake 3.5)
  const noSettledHealth = computeEmployeeSettlementHealth(requests.filter((r) => r.status !== 'SETTLED'));
  assert.equal(noSettledHealth.avgTurnaroundDays, null, 'Avg turnaround days must be null when no settlements exist');

  const meterCardFile = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/employee/EmployeeReimbursementMeterCard.tsx'
  );
  assert.ok(fs.existsSync(meterCardFile), 'EmployeeReimbursementMeterCard.tsx must exist');

  console.log('✅ ALL EMPLOYEE SPEND ANALYTICS TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
