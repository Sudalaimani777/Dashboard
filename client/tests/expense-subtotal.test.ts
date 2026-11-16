import assert from 'node:assert/strict';

// Helper function implementing the subtotal computation logic
export function calculateExpensesSubtotal(
  expenses?: Array<{ amount?: number | string | null }> | null
): number {
  if (!expenses || !Array.isArray(expenses)) return 0;
  return expenses.reduce((sum, item) => {
    const val = typeof item?.amount === 'number' ? item.amount : parseFloat(item?.amount as any);
    return sum + (Number.isFinite(val) && val > 0 ? val : 0);
  }, 0);
}

function runExpenseSubtotalTests() {
  console.log('🧪 Testing Expense Subtotal Live Calculation Logic...\n');

  // Test 1: Empty list or undefined
  assert.equal(calculateExpensesSubtotal([]), 0, 'Empty array should sum to 0');
  assert.equal(calculateExpensesSubtotal(null), 0, 'Null should sum to 0');
  assert.equal(calculateExpensesSubtotal(undefined), 0, 'Undefined should sum to 0');

  // Test 2: Standard valid amounts
  assert.equal(
    calculateExpensesSubtotal([
      { amount: 1500 },
      { amount: 3500 },
      { amount: 250 },
    ]),
    5250,
    'Should sum 1500 + 3500 + 250 to 5250'
  );

  // Test 3: Keystroke in-progress state (user cleared input, producing NaN or empty string)
  assert.equal(
    calculateExpensesSubtotal([
      { amount: 1500 },
      { amount: NaN },
      { amount: '' as any },
    ]),
    1500,
    'NaN and empty string while typing should gracefully yield valid numerical subtotal'
  );

  // Test 4: String input numbers from inputs or copy-paste
  assert.equal(
    calculateExpensesSubtotal([
      { amount: '2400' },
      { amount: '600.50' },
    ]),
    3000.5,
    'Numeric strings should be parsed and added'
  );

  // Test 5: Negative amounts or invalid numbers
  assert.equal(
    calculateExpensesSubtotal([
      { amount: -500 },
      { amount: 'invalid-text' as any },
      { amount: 1000 },
    ]),
    1000,
    'Negative and invalid text amounts should be filtered out'
  );

  console.log('✅ ALL EXPENSE SUBTOTAL TESTS PASSED!\n');
}

runExpenseSubtotalTests();
