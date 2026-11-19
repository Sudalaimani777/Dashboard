import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EXPENSE_CATEGORY_META } from '../src/features/travel/utils/travelAnalytics';
import { computeCategoryShares } from '../src/features/travel/utils/budgetAnalytics';

async function run() {
  console.log('🧪 Testing Stripe Chart Colors & Visualizations...');

  // 1. Verify category metadata uses contrasting Stripe tokens
  assert.equal(EXPENSE_CATEGORY_META.FLIGHT.color, '#533AFD', 'Flight should be Stripe Blurple #533AFD');
  assert.equal(EXPENSE_CATEGORY_META.HOTEL.color, '#635BFF', 'Hotel should be Stripe Indigo #635BFF');
  assert.equal(EXPENSE_CATEGORY_META.MEALS_PER_DIEM.color, '#FF6118', 'Meals should be Stripe Vivid Orange #FF6118');
  assert.equal(EXPENSE_CATEGORY_META.TRANSIT.color, '#00D66F', 'Transit should be Stripe Mint #00D66F');
  assert.equal(EXPENSE_CATEGORY_META.MISC.color, '#839BC8', 'Misc should be Periwinkle Slate #839BC8');

  // 2. Verify unspent headroom uses Ice Slate
  const emptyShares = computeCategoryShares(undefined, 0);
  assert.equal(emptyShares[0].color, '#E5EDF5', 'Unspent headroom must be Ice Slate #E5EDF5');

  // 3. Verify chart container styling uses Stripe neutrals
  const chartPath = path.resolve(import.meta.dirname, '../src/shared/components/ui/chart.tsx');
  const chartSource = fs.readFileSync(chartPath, 'utf8');
  assert.ok(chartSource.includes('#50617A'), 'Chart tick text must use Slate #50617A');
  assert.ok(chartSource.includes('#E5EDF5'), 'Chart grid line must use Ice Slate #E5EDF5');
  assert.ok(chartSource.includes('#533AFD'), 'Chart tooltip cursor must use Blurple #533AFD');
  assert.ok(!chartSource.includes('#8A582B'), 'Chart must not contain brown #8A582B');

  // 4. Verify 6-Month Burn Charts use Stripe series colors
  const burnCharts = [
    '../src/features/travel/components/charts/MonthlyBurnChart.tsx',
    '../src/features/travel/components/charts/ManagerMonthlyBurnChart.tsx',
    '../src/features/travel/components/charts/EmployeeMonthlyBurnChart.tsx',
  ];

  for (const rel of burnCharts) {
    const fullPath = path.resolve(import.meta.dirname, rel);
    const source = fs.readFileSync(fullPath, 'utf8');
    assert.ok(source.includes('#533AFD'), `${rel} approved series must be #533AFD`);
    assert.ok(source.includes('#7389FF'), `${rel} pending series must be #7389FF`);
    assert.ok(!source.includes('#8A582B'), `${rel} must not contain #8A582B`);
    assert.ok(!source.includes('#D4A373'), `${rel} must not contain #D4A373`);
  }

  // 5. Verify Department Comparison Chart bar colors
  const compChartPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/charts/DepartmentComparisonChart.tsx'
  );
  const compSource = fs.readFileSync(compChartPath, 'utf8');
  assert.ok(compSource.includes('#00D66F'), 'Must use Stripe Mint #00D66F for safe utilization');
  assert.ok(compSource.includes('#533AFD'), 'Must use Stripe Blurple #533AFD for alert utilization');
  assert.ok(compSource.includes('#FF6118'), 'Must use Stripe Vivid Orange #FF6118 for critical utilization');

  console.log('✅ ALL STRIPE CHART COLOR TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Chart test failed:', err);
  process.exit(1);
});
