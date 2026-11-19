// client/tests/expense-amount-input.test.ts
import assert from 'node:assert/strict';
import { travelFormSchema, parseExpenseAmount } from '../src/features/travel/hooks/useTravelForm';

console.log('🧪 Starting Expense Amount Input & Sanitization Test Suite (TDD)...\n');

// 1. Unit tests for parseExpenseAmount
console.log('Test 1: parseExpenseAmount parses string inputs to numbers correctly');
assert.equal(parseExpenseAmount('15000'), 15000);
assert.equal(parseExpenseAmount('2499.50'), 2499.5);
assert.equal(parseExpenseAmount('0'), 0);
assert.equal(parseExpenseAmount(''), 0);
assert.equal(parseExpenseAmount(null), 0);
assert.equal(parseExpenseAmount(undefined), 0);
assert.equal(parseExpenseAmount('abc'), 0);
assert.equal(parseExpenseAmount(5000), 5000);
console.log('  ✅ PASS: parseExpenseAmount converts all variants cleanly');

const validBase = {
  travel_type: 'UPCOMING' as const,
  title: 'Engineering Architecture Summit',
  purpose: 'Strategic system review for enterprise scale',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'Tokyo, Japan',
  departure_date: new Date().toISOString().split('T')[0],
  return_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  emergency_contact_name: 'HR Operations',
  emergency_contact_phone: '+91 9876543210',
  supporting_docs: [
    {
      id: 'doc-1',
      type: 'LINK' as const,
      name: 'Quotation',
      url: 'https://example.com/quotation.pdf',
    },
  ],
};

// 2. Integration: Value produced by setValueAs parses cleanly through travelFormSchema
console.log('\nTest 2: Valid text amount converted by parseExpenseAmount passes schema validation');
const parsedAmount = parseExpenseAmount('15000');
const res1 = travelFormSchema.safeParse({
  ...validBase,
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'AirIndia',
      amount: parsedAmount,
      expenseDate: new Date().toISOString().split('T')[0],
    },
  ],
});
assert.equal(res1.success, true, `Should parse successfully: ${JSON.stringify(res1.error?.issues)}`);
if (res1.success) {
  assert.equal(res1.data.expenses[0].amount, 15000);
  assert.equal(typeof res1.data.expenses[0].amount, 'number');
}
console.log('  ✅ PASS: Parsed amount passes schema');

// 3. Empty string converted to 0 fails positive number validation
console.log('\nTest 3: Empty string amount converted by parseExpenseAmount fails validation');
const emptyParsed = parseExpenseAmount('');
const res2 = travelFormSchema.safeParse({
  ...validBase,
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'AirIndia',
      amount: emptyParsed,
      expenseDate: new Date().toISOString().split('T')[0],
    },
  ],
});
assert.equal(res2.success, false, 'Amount of 0 must fail positive number validation');
const amountError = res2.error?.issues.find((i) => i.path.includes('amount'));
assert.ok(amountError, 'Expected error on amount field');
console.log('  ✅ PASS: Empty amount properly flagged as non-positive error');

console.log('\n🎉 ALL AMOUNT PARSING & VALIDATION TESTS PASSED!\n');
