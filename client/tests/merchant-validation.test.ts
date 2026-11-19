// client/tests/merchant-validation.test.ts
import assert from 'node:assert/strict';
import { travelFormSchema } from '../src/features/travel/hooks/useTravelForm';

console.log('🧪 Starting Merchant / Vendor Name Validation Test Suite (TDD RED Phase)...\n');

const baseForm = {
  travel_type: 'UPCOMING' as const,
  title: 'Client Review',
  purpose: 'Conduct annual client architectural review',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'Singapore',
  departure_date: '2026-12-01',
  return_date: '2026-12-05',
  emergency_contact_name: 'HR Operations',
  emergency_contact_phone: '+91 9876543210',
  supporting_doc_url: 'https://storage.googleapis.com/test.pdf',
  supporting_docs: [{ id: '1', type: 'LINK' as const, name: 'Proof', url: 'https://test.pdf' }],
};

// Test 1: Reject purely numeric merchant names like "20000" (screenshot bug)
console.log('Test 1: Reject purely numeric merchant names like "20000"');
const res1 = travelFormSchema.safeParse({
  ...baseForm,
  expenses: [
    {
      category: 'FLIGHT',
      merchant: '20000', // Pure numbers mistakenly typed as merchant
      amount: 5000,
      expenseDate: '2026-12-01',
    },
  ],
});
assert.equal(res1.success, false, 'Pure numeric string "20000" must fail validation');
if (!res1.success) {
  const merchantErr = res1.error.issues.find(
    (i) => i.path.includes('expenses') && i.path.includes('merchant')
  );
  assert.ok(merchantErr, 'Expected issue on expenses.0.merchant');
  console.log(`  ✅ PASS: Rejected with message: "${merchantErr.message}"`);
}

// Test 2: Reject other purely numeric or symbol strings
console.log('\nTest 2: Reject other invalid merchant formats');
const res2 = travelFormSchema.safeParse({
  ...baseForm,
  expenses: [
    {
      category: 'HOTEL',
      merchant: '12345',
      amount: 5000,
      expenseDate: '2026-12-01',
    },
  ],
});
assert.equal(res2.success, false, '"12345" must fail validation');

const res3 = travelFormSchema.safeParse({
  ...baseForm,
  expenses: [
    {
      category: 'MISC',
      merchant: '$$$###',
      amount: 500,
      expenseDate: '2026-12-01',
    },
  ],
});
assert.equal(res3.success, false, 'Symbols only must fail validation');
console.log('  ✅ PASS: Pure numbers and symbols rejected');

// Test 3: Accept valid merchant names, including legitimate businesses containing digits
console.log('\nTest 3: Accept legitimate merchant names');
const res4 = travelFormSchema.safeParse({
  ...baseForm,
  expenses: [
    { category: 'FLIGHT', merchant: 'Air India', amount: 15000, expenseDate: '2026-12-01' },
    { category: 'HOTEL', merchant: 'Marriott', amount: 20000, expenseDate: '2026-12-02' },
    { category: 'TRANSIT', merchant: 'Uber', amount: 500, expenseDate: '2026-12-03' },
    { category: 'MEALS_PER_DIEM', merchant: '7-Eleven', amount: 350, expenseDate: '2026-12-04' },
    { category: 'MISC', merchant: '3M Global', amount: 1200, expenseDate: '2026-12-05' },
    { category: 'HOTEL', merchant: 'Motel 6', amount: 4500, expenseDate: '2026-12-02' },
  ],
});
assert.equal(res4.success, true, `Legitimate merchant names must pass, errors: ${JSON.stringify(res4.error?.issues)}`);
console.log('  ✅ PASS: Legitimate business names accepted (including 7-Eleven, 3M, Motel 6)');

console.log('\n🎉 ALL MERCHANT VALIDATION TESTS EVALUATED!\n');
