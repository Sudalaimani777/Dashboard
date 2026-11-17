// client/tests/expense-date-boundaries.test.ts
import assert from 'node:assert/strict';
import { travelFormSchema } from '../src/features/travel/hooks/useTravelForm';

console.log('🧪 Starting Expense Item Date Range Validation Test Suite (TDD RED Phase)...\n');

const baseFormData = {
  travel_type: 'UPCOMING' as const,
  title: 'Client Architecture Review',
  purpose: 'Conduct deep-dive client technical workshop',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'Singapore',
  departure_date: '2026-12-01',
  return_date: '2026-12-05',
  emergency_contact_name: 'HR Operations',
  emergency_contact_phone: '+91 9876543210',
  supporting_doc_url: 'https://storage.googleapis.com/test-itinerary.pdf',
  supporting_docs: [
    { id: 'doc-1', type: 'LINK', name: 'Itinerary Proof', url: 'https://storage.googleapis.com/test-itinerary.pdf' },
  ],
};

// Test 1: Expense date earlier than departure_date must fail
console.log('Test 1: Expense date before departure date must fail validation');
const res1 = travelFormSchema.safeParse({
  ...baseFormData,
  expenses: [
    {
      category: 'FLIGHT',
      merchant: 'Singapore Airlines',
      amount: 15000,
      expenseDate: '2026-11-30', // Before Dec 1 departure
      notes: '',
    },
  ],
});
assert.equal(res1.success, false, 'Expense before departure date must fail');
if (!res1.success) {
  const expenseError = res1.error.issues.find(
    (i) => i.path[0] === 'expenses' && i.path[2] === 'expenseDate'
  );
  assert.ok(expenseError, 'Expected issue on expenses.0.expenseDate');
  assert.ok(
    expenseError.message.toLowerCase().includes('earlier than departure'),
    `Expected message mentioning earlier than departure, got: ${expenseError.message}`
  );
  console.log(`  ✅ PASS: Rejected with message: "${expenseError.message}"`);
}

// Test 2: Expense date later than return_date must fail
console.log('\nTest 2: Expense date after return date must fail validation');
const res2 = travelFormSchema.safeParse({
  ...baseFormData,
  expenses: [
    {
      category: 'HOTEL',
      merchant: 'Marina Bay Sands',
      amount: 25000,
      expenseDate: '2026-12-06', // After Dec 5 return
      notes: '',
    },
  ],
});
assert.equal(res2.success, false, 'Expense after return date must fail');
if (!res2.success) {
  const expenseError = res2.error.issues.find(
    (i) => i.path[0] === 'expenses' && i.path[2] === 'expenseDate'
  );
  assert.ok(expenseError, 'Expected issue on expenses.0.expenseDate');
  assert.ok(
    expenseError.message.toLowerCase().includes('later than return'),
    `Expected message mentioning later than return, got: ${expenseError.message}`
  );
  console.log(`  ✅ PASS: Rejected with message: "${expenseError.message}"`);
}

// Test 3: Expense date exactly on departure date or return date must pass
console.log('\nTest 3: Expenses on boundary dates (departure and return) must pass');
const res3 = travelFormSchema.safeParse({
  ...baseFormData,
  expenses: [
    {
      category: 'FLIGHT',
      merchant: 'Singapore Airlines',
      amount: 15000,
      expenseDate: '2026-12-01', // On departure
      notes: '',
    },
    {
      category: 'FLIGHT',
      merchant: 'Singapore Airlines',
      amount: 15000,
      expenseDate: '2026-12-05', // On return
      notes: '',
    },
  ],
});
assert.equal(res3.success, true, `Expenses on boundary dates should pass, errors: ${JSON.stringify(res3.error?.issues)}`);
console.log('  ✅ PASS: Boundary dates accepted');

// Test 4: Expense date between departure and return must pass
console.log('\nTest 4: Expense date between departure and return must pass');
const res4 = travelFormSchema.safeParse({
  ...baseFormData,
  expenses: [
    {
      category: 'MEALS_PER_DIEM',
      merchant: 'Bistro',
      amount: 2500,
      expenseDate: '2026-12-03', // Middle of trip
      notes: '',
    },
  ],
});
assert.equal(res4.success, true, `In-between expense date should pass, errors: ${JSON.stringify(res4.error?.issues)}`);
console.log('  ✅ PASS: In-between date accepted');

console.log('\n🎉 ALL CLIENT EXPENSE DATE BOUNDARY TESTS EVALUATED!\n');
