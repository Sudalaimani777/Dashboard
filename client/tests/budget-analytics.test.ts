import assert from 'node:assert/strict';
import {
  computeCorporateLedgerStats,
  computeDepartmentDrilldown,
  computeMonthlyBurnSeries,
} from '../src/features/travel/utils/budgetAnalytics';
import type { DepartmentBudget, TravelRequest } from '../src/features/travel/types/travel.types';

async function run() {
  console.log('🧪 Testing Department Budget Analytics helpers...');

  const sampleBudgets: DepartmentBudget[] = [
    {
      id: 'b-1',
      department: 'Engineering',
      fiscalYear: 2026,
      fiscalQuarter: 'Q4',
      totalAllocation: 3500000,
      utilizedAmount: 2534000,
      availableHeadroom: 966000,
      utilizationPercentage: 72.4,
    },
    {
      id: 'b-2',
      department: 'Sales',
      fiscalYear: 2026,
      fiscalQuarter: 'Q4',
      totalAllocation: 2500000,
      utilizedAmount: 2280000,
      availableHeadroom: 220000,
      utilizationPercentage: 91.2,
    },
  ];

  const sampleRequests: TravelRequest[] = [
    {
      id: 'r-1',
      userId: 'u-1',
      travelType: 'UPCOMING',
      title: 'KubeCon EU',
      purpose: 'Conference',
      projectCode: 'ENG-2026',
      origin: 'Bengaluru',
      destination: 'London',
      departureDate: '2026-11-10',
      returnDate: '2026-11-14',
      emergencyContactName: 'A',
      emergencyContactPhone: '9999999999',
      totalExpenses: 245000,
      status: 'APPROVED',
      currency: 'INR',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
      requesterName: 'Kiran Verma',
      requesterDepartment: 'Engineering',
    },
    {
      id: 'r-2',
      userId: 'u-2',
      travelType: 'ALREADY_TRAVELLED',
      title: 'Partner Summit',
      purpose: 'Summit',
      projectCode: 'ENG-2026',
      origin: 'Bengaluru',
      destination: 'Singapore',
      departureDate: '2026-10-15',
      returnDate: '2026-10-18',
      emergencyContactName: 'B',
      emergencyContactPhone: '9999999999',
      totalExpenses: 138500,
      status: 'PENDING_ADMIN_APPROVAL',
      currency: 'INR',
      createdAt: '2026-10-20T00:00:00.000Z',
      updatedAt: '2026-10-20T00:00:00.000Z',
      requesterName: 'Arjun Rao',
      requesterDepartment: 'Engineering',
    },
  ];

  const ledger = computeCorporateLedgerStats(sampleBudgets, sampleRequests, 2026, 'Q4');
  assert.equal(ledger.totalPool, 6000000);
  assert.equal(ledger.totalCommitted, 4814000);
  assert.equal(ledger.totalHeadroom, 1186000);
  assert.equal(ledger.atRiskCount, 1);
  assert.equal(ledger.topAtRiskPool?.department, 'Sales');

  const burn = computeMonthlyBurnSeries(sampleRequests, 'Engineering', new Date('2026-11-12'));
  assert.equal(burn.length, 6);
  const nov = burn.find((m) => m.monthKey === '2026-11');
  const oct = burn.find((m) => m.monthKey === '2026-10');
  assert.equal(nov?.approved, 245000);
  assert.equal(oct?.pending, 138500);

  const drilldown = computeDepartmentDrilldown(sampleRequests, 'Engineering');
  assert.equal(drilldown.upcomingTotal, 245000);
  assert.equal(drilldown.claimsTotal, 138500);
  assert.equal(drilldown.topMembers[0]?.name, 'Kiran Verma');
  assert.equal(drilldown.topTrips[0]?.id, 'r-1');

  console.log('✅ ALL DEPARTMENT BUDGET ANALYTICS TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
