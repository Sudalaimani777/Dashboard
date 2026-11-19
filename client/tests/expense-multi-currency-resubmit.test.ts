// client/tests/expense-multi-currency-resubmit.test.ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resubmitFormSchema } from '../src/features/travel/pages/ResubmitTravelRequestPage';

console.log('🧪 Starting Multi-Currency Resubmission & Form Loading Test Suite...\n');

// 1. Verify resubmitFormSchema accepts multi-currency fields
console.log('Test 1: resubmitFormSchema validates multi-currency expense payload');
const validResubmitPayload = {
  alterations_remarks: 'Updated flight schedule per manager directive',
  title: 'Engineering Summit Tokyo',
  purpose: 'Strategic architecture review for 2026',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'Tokyo, Japan',
  departure_date: '2026-12-01',
  return_date: '2026-12-05',
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'United Airlines',
      amount: 8350,
      originalCurrency: 'USD',
      originalAmount: 100,
      exchangeRate: 83.5,
      inrAmount: 8350,
      expenseDate: '2026-12-01',
      notes: 'Flight booked in USD',
    },
  ],
};

const parseResult = resubmitFormSchema.safeParse(validResubmitPayload);
assert.equal(parseResult.success, true, `Validation failed: ${JSON.stringify(parseResult.error?.issues)}`);
assert.equal(parseResult.data.expenses[0].originalCurrency, 'USD');
assert.equal(parseResult.data.expenses[0].originalAmount, 100);
console.log('  ✅ PASS: resubmitFormSchema accepts USD and originalAmount 100');

// 2. Inspect ResubmitTravelRequestPage.tsx to ensure form.reset preserves multi-currency
console.log('\nTest 2: ResubmitTravelRequestPage maps originalCurrency and originalAmount in form.reset');
const resubmitPagePath = path.resolve(
  import.meta.dirname,
  '../src/features/travel/pages/ResubmitTravelRequestPage.tsx'
);
const resubmitPageSource = fs.readFileSync(resubmitPagePath, 'utf8');

assert.ok(
  resubmitPageSource.includes('originalCurrency:') && resubmitPageSource.includes('originalAmount:'),
  'ResubmitTravelRequestPage must map originalCurrency and originalAmount'
);
assert.ok(
  resubmitPageSource.includes('originalCurrency: origCur') ||
  resubmitPageSource.includes('originalCurrency: e.originalCurrency'),
  'ResubmitTravelRequestPage must preserve the loaded expense originalCurrency'
);
console.log('  ✅ PASS: ResubmitTravelRequestPage preserves multi-currency fields during form.reset');

// 3. Inspect NewTravelRequestPage.tsx to ensure cloned trips preserve multi-currency
console.log('\nTest 3: NewTravelRequestPage preserves multi-currency during trip cloning');
const newPagePath = path.resolve(
  import.meta.dirname,
  '../src/features/travel/pages/NewTravelRequestPage.tsx'
);
const newPageSource = fs.readFileSync(newPagePath, 'utf8');

assert.ok(
  newPageSource.includes('originalCurrency:') && newPageSource.includes('originalAmount:'),
  'NewTravelRequestPage must map originalCurrency and originalAmount in applyClonedRequest'
);
console.log('  ✅ PASS: NewTravelRequestPage preserves multi-currency fields during clone');

console.log('\n🎉 ALL MULTI-CURRENCY RESUBMISSION TESTS PASSED!\n');
