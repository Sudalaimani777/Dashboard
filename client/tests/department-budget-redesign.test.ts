import assert from 'node:assert/strict';
import {
  computeDepartmentPoolHealth,
  computeCategoryShares,
} from '../src/features/travel/utils/budgetAnalytics';

async function run() {
  console.log('🧪 Testing Department Budget Redesign helpers (TDD)...');

  // Test 1: computeDepartmentPoolHealth
  const critical = computeDepartmentPoolHealth(92.5);
  assert.equal(critical.status, 'CRITICAL');
  assert.equal(critical.clampedPct, 92.5);
  assert.ok(critical.barColor === 'bg-[#FF6118]' || critical.barColor === 'bg-destructive');

  const warning = computeDepartmentPoolHealth(75.0);
  assert.equal(warning.status, 'WARNING');
  assert.equal(warning.clampedPct, 75.0);
  assert.ok(warning.barColor === 'bg-[#533AFD]' || warning.barColor === 'bg-amber-600');

  const healthy = computeDepartmentPoolHealth(45.2);
  assert.equal(healthy.status, 'HEALTHY');
  assert.equal(healthy.clampedPct, 45.2);
  assert.ok(healthy.barColor === 'bg-[#00D66F]' || healthy.barColor === 'bg-[#3F624D]');

  // Test 2: Clamp edge cases
  const over100 = computeDepartmentPoolHealth(130.0);
  assert.equal(over100.status, 'CRITICAL');
  assert.equal(over100.clampedPct, 100);

  const negative = computeDepartmentPoolHealth(-10);
  assert.equal(negative.status, 'HEALTHY');
  assert.equal(negative.clampedPct, 0);

  // Test 3: computeCategoryShares
  const mockBreakdown = [
    { category: 'FLIGHT', total: 60000 },
    { category: 'HOTEL', total: 40000 },
  ];
  const shares = computeCategoryShares(mockBreakdown, 100000);
  assert.equal(shares.length, 2);
  assert.equal(shares[0].categoryKey, 'FLIGHT');
  assert.equal(shares[0].pct, 60);
  assert.equal(shares[1].categoryKey, 'HOTEL');
  assert.equal(shares[1].pct, 40);

  // Test 4: computeCategoryShares fallback when breakdown is empty
  const fallbackShares = computeCategoryShares([], 10000);
  assert.ok(fallbackShares.length > 0);
  const totalFallbackPct = fallbackShares.reduce((acc, s) => acc + s.pct, 0);
  assert.ok(Math.abs(totalFallbackPct - 100) <= 1); // accounts for rounding

  console.log('✅ ALL REDESIGN HELPER TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
