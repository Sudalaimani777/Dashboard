import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeCategoryShares,
  type CategoryShareItem,
} from '../src/features/travel/utils/budgetAnalytics';
import { formatINRCompact, formatINR } from '../src/features/travel/utils/currency';

async function run() {
  console.log('🧪 Testing Department Category Pie Chart (TDD)...');

  // 1. Data transformation tests
  const mockBreakdown = [
    { category: 'FLIGHT', total: 51000 },
    { category: 'MEALS_PER_DIEM', total: 50000 },
    { category: 'HOTEL', total: 40000 },
    { category: 'GROUND_TRANSIT', total: 35000 },
  ];
  const shares = computeCategoryShares(mockBreakdown, 176000);
  assert.equal(shares.length, 4, 'Should contain 4 itemized categories');

  const totalDisbursed = shares
    .filter((c) => c.categoryKey !== 'UNSPENT')
    .reduce((sum, c) => sum + c.amount, 0);
  assert.equal(totalDisbursed, 176000, 'Total disbursed should equal 176,000');

  const topCategory = shares[0];
  assert.equal(topCategory.categoryKey, 'FLIGHT');
  assert.equal(topCategory.pct, 29);

  // 2. Formatting verification
  const compactDisplay = formatINRCompact(totalDisbursed);
  assert.ok(compactDisplay.includes('1.8') || compactDisplay.includes('176k') || compactDisplay.includes('1.76L'), 'Compact display matches currency format');

  // 3. Empty data fallback handling
  const emptyShares = computeCategoryShares(undefined, 0);
  assert.equal(emptyShares.length, 1);
  assert.equal(emptyShares[0].categoryKey, 'UNSPENT');
  const emptyTotal = emptyShares
    .filter((c) => c.categoryKey !== 'UNSPENT')
    .reduce((sum, c) => sum + c.amount, 0);
  assert.equal(emptyTotal, 0, 'Empty total should be 0');

  // 4. Source file structural checks
  const chartPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/charts/DepartmentCategoryPieChart.tsx'
  );
  assert.ok(fs.existsSync(chartPath), 'DepartmentCategoryPieChart.tsx must exist');

  const chartSource = fs.readFileSync(chartPath, 'utf8');
  assert.ok(chartSource.includes('PieChart'), 'Must use PieChart');
  assert.ok(chartSource.includes('Pie'), 'Must render Pie');
  assert.ok(chartSource.includes('innerRadius={48}'), 'Must specify innerRadius 48');
  assert.ok(chartSource.includes('outerRadius={70}'), 'Must specify outerRadius 70');
  assert.ok(chartSource.includes('Label'), 'Must render center Label');
  assert.ok(chartSource.includes('ChartContainer'), 'Must use shadcn ChartContainer');

  const cardPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/components/DepartmentCategoryBreakdownCard.tsx'
  );
  const cardSource = fs.readFileSync(cardPath, 'utf8');
  assert.ok(cardSource.includes('DepartmentCategoryPieChart'), 'Card must render DepartmentCategoryPieChart');

  console.log('✅ ALL DEPARTMENT CATEGORY PIE CHART TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
