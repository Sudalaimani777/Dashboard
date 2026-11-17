// client/tests/travel-form-date-validation.test.ts
import assert from 'node:assert/strict';
import { travelFormSchema } from '../src/features/travel/hooks/useTravelForm';

console.log('🧪 Starting Client Travel Form Date Validation Test Suite (TDD RED Phase)...\n');

const today = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const todayStr = formatDate(today);

const pastDateObj = new Date(today);
pastDateObj.setDate(pastDateObj.getDate() - 5);
const pastStr = formatDate(pastDateObj);

const futureDateObj = new Date(today);
futureDateObj.setDate(futureDateObj.getDate() + 5);
const futureStr = formatDate(futureDateObj);

const validBase = {
  title: 'Engineering Summit Tokyo',
  purpose: 'Strategic architecture review for 2026',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'Tokyo, Japan',
  emergency_contact_name: 'HR Operations',
  emergency_contact_phone: '+91 9876543210',
  supporting_docs: [
    {
      id: 'doc-1',
      type: 'LINK' as const,
      name: 'Itinerary Quotation',
      url: 'https://example.com/quotation.pdf',
    },
  ],
};

// 1. UPCOMING: Past departure date must fail
console.log('Test 1: UPCOMING with past departure date must fail Zod validation');
const res1 = travelFormSchema.safeParse({
  ...validBase,
  travel_type: 'UPCOMING',
  departure_date: pastStr,
  return_date: futureStr,
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'AirIndia',
      amount: 12000,
      expenseDate: pastStr,
    },
  ],
});
assert.equal(res1.success, false, 'UPCOMING with past departure date must fail');
const depError = res1.error?.issues.find((i) => i.path.includes('departure_date'));
assert.ok(
  depError && depError.message.toLowerCase().includes('past'),
  `Expected departure_date error about past date, got: ${JSON.stringify(res1.error?.issues)}`
);
console.log('  ✅ PASS: Past departure date rejected for UPCOMING in Zod schema');

// 2. UPCOMING: Today departure and future return must pass
console.log('\nTest 2: UPCOMING with today departure and future return must pass');
const res2 = travelFormSchema.safeParse({
  ...validBase,
  travel_type: 'UPCOMING',
  departure_date: todayStr,
  return_date: futureStr,
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'AirIndia',
      amount: 12000,
      expenseDate: todayStr,
    },
  ],
});
assert.equal(res2.success, true, `UPCOMING starting today should be valid, errors: ${JSON.stringify(res2.error?.issues)}`);
console.log('  ✅ PASS: Today departure accepted for UPCOMING');

// 3. ALREADY_TRAVELLED: Future return date must fail
console.log('\nTest 3: ALREADY_TRAVELLED with future return date must fail');
const res3 = travelFormSchema.safeParse({
  ...validBase,
  travel_type: 'ALREADY_TRAVELLED',
  departure_date: pastStr,
  return_date: futureStr,
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'AirIndia',
      amount: 12000,
      expenseDate: pastStr,
    },
  ],
});
assert.equal(res3.success, false, 'ALREADY_TRAVELLED with future return date must fail');
const retError = res3.error?.issues.find((i) => i.path.includes('return_date'));
assert.ok(
  retError && retError.message.toLowerCase().includes('future'),
  `Expected return_date error about future date, got: ${JSON.stringify(res3.error?.issues)}`
);
console.log('  ✅ PASS: Future return date rejected for ALREADY_TRAVELLED');

// 4. ALREADY_TRAVELLED: Future expense date must fail
console.log('\nTest 4: ALREADY_TRAVELLED with future expense date must fail');
const res4 = travelFormSchema.safeParse({
  ...validBase,
  travel_type: 'ALREADY_TRAVELLED',
  departure_date: pastStr,
  return_date: todayStr,
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'AirIndia',
      amount: 12000,
      expenseDate: futureStr,
    },
  ],
});
assert.equal(res4.success, false, 'ALREADY_TRAVELLED with future expense date must fail');
const hasFutureError = res4.error?.issues.some(
  (i) => i.path.includes('expenses') && i.path.includes('expenseDate') && i.message.toLowerCase().includes('future')
);
assert.ok(
  hasFutureError,
  `Expected expenseDate error about future date, got: ${JSON.stringify(res4.error?.issues)}`
);
console.log('  ✅ PASS: Future expense date rejected for ALREADY_TRAVELLED');

// 5. ALREADY_TRAVELLED: Valid past dates and past expenses must pass
console.log('\nTest 5: ALREADY_TRAVELLED with valid past dates and past expenses must pass');
const res5 = travelFormSchema.safeParse({
  ...validBase,
  travel_type: 'ALREADY_TRAVELLED',
  departure_date: pastStr,
  return_date: todayStr,
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'AirIndia',
      amount: 12000,
      expenseDate: pastStr,
    },
  ],
});
assert.equal(res5.success, true, `ALREADY_TRAVELLED with past dates should be valid, errors: ${JSON.stringify(res5.error?.issues)}`);
console.log('  ✅ PASS: Past dates accepted for ALREADY_TRAVELLED');

console.log('\n🎉 ALL CLIENT FORM DATE VALIDATION TESTS EVALUATED!\n');
