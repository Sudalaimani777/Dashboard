// server/tests/travel-date-boundaries.test.ts
import assert from 'node:assert/strict';
import { validateCreateRequestPayload } from '../src/features/travel/travel.validation.js';

console.log('🧪 Starting Travel Date Boundaries Validation Test (TDD RED Phase)...\n');

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

const farFutureDateObj = new Date(today);
farFutureDateObj.setDate(farFutureDateObj.getDate() + 10);
const farFutureStr = formatDate(farFutureDateObj);

const basePayload = {
  title: 'Global Tech Summit 2026',
  purpose: 'Deliver keynote on system architecture',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'Tokyo, Japan',
  emergency_contact_name: 'HR Operations',
  emergency_contact_phone: '+91 9876543210',
};

// 1. UPCOMING: Past departure date must fail
console.log('Test 1: UPCOMING with past departure date must fail');
const res1 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'UPCOMING',
  departure_date: pastStr,
  return_date: futureStr,
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: pastStr }],
});
assert.equal(res1.valid, false, 'UPCOMING with past departure must be invalid');
assert.ok(
  res1.errors?.some((e) => e.toLowerCase().includes('past') && e.toLowerCase().includes('departure')),
  `Expected error about past departure, got: ${JSON.stringify(res1.errors)}`
);
console.log('  ✅ PASS: Past departure date rejected for UPCOMING');

// 2. UPCOMING: Today departure date and future return date must pass
console.log('\nTest 2: UPCOMING with today departure and future return must pass');
const res2 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'UPCOMING',
  departure_date: todayStr,
  return_date: futureStr,
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: todayStr }],
});
assert.equal(res2.valid, true, `UPCOMING starting today should be valid, errors: ${JSON.stringify(res2.errors)}`);
console.log('  ✅ PASS: Today departure accepted for UPCOMING');

// 3. UPCOMING: Return date earlier than departure must fail
console.log('\nTest 3: UPCOMING with return date earlier than departure must fail');
const res3 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'UPCOMING',
  departure_date: farFutureStr,
  return_date: futureStr,
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: farFutureStr }],
});
assert.equal(res3.valid, false, 'UPCOMING with return < departure must be invalid');
assert.ok(
  res3.errors?.some((e) => e.toLowerCase().includes('earlier than departure')),
  `Expected error about return earlier than departure, got: ${JSON.stringify(res3.errors)}`
);
console.log('  ✅ PASS: Return date earlier than departure rejected');

// 4. ALREADY_TRAVELLED: Future return date must fail
console.log('\nTest 4: ALREADY_TRAVELLED with future return date must fail');
const res4 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'ALREADY_TRAVELLED',
  departure_date: pastStr,
  return_date: futureStr,
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: pastStr }],
});
assert.equal(res4.valid, false, 'ALREADY_TRAVELLED with future return must be invalid');
assert.ok(
  res4.errors?.some((e) => e.toLowerCase().includes('future') && e.toLowerCase().includes('return')),
  `Expected error about future return date, got: ${JSON.stringify(res4.errors)}`
);
console.log('  ✅ PASS: Future return date rejected for ALREADY_TRAVELLED');

// 5. ALREADY_TRAVELLED: Future expense date must fail
console.log('\nTest 5: ALREADY_TRAVELLED with future expense date must fail');
const res5 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'ALREADY_TRAVELLED',
  departure_date: pastStr,
  return_date: todayStr,
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: futureStr }],
});
assert.equal(res5.valid, false, 'ALREADY_TRAVELLED with future expense must be invalid');
assert.ok(
  res5.errors?.some((e) => e.toLowerCase().includes('future') && e.toLowerCase().includes('expense')),
  `Expected error about future expense date, got: ${JSON.stringify(res5.errors)}`
);
console.log('  ✅ PASS: Future expense date rejected for ALREADY_TRAVELLED');

// 6. ALREADY_TRAVELLED: Valid past dates and past expenses must pass
console.log('\nTest 6: ALREADY_TRAVELLED with valid past dates and expenses must pass');
const res6 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'ALREADY_TRAVELLED',
  departure_date: pastStr,
  return_date: todayStr,
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: pastStr }],
});
assert.equal(res6.valid, true, `ALREADY_TRAVELLED with past dates should be valid, errors: ${JSON.stringify(res6.errors)}`);
console.log('  ✅ PASS: Past dates accepted for ALREADY_TRAVELLED');

// 7. Expense date earlier than departure date must fail
console.log('\nTest 7: Expense date earlier than departure date must fail');
const res7 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'UPCOMING',
  departure_date: futureStr,
  return_date: farFutureStr,
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: todayStr }], // today < futureStr (departure)
});
assert.equal(res7.valid, false, 'Expense date earlier than departure date must fail');
assert.ok(
  res7.errors?.some((e) => e.toLowerCase().includes('earlier than departure')),
  `Expected error about expense date earlier than departure, got: ${JSON.stringify(res7.errors)}`
);
console.log('  ✅ PASS: Expense date before departure date rejected');

// 8. Expense date later than return date must fail
console.log('\nTest 8: Expense date later than return date must fail');
const res8 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'UPCOMING',
  departure_date: todayStr,
  return_date: futureStr,
  expenses: [{ category: 'HOTEL', merchant: 'Hotel', amount: 5000, expense_date: farFutureStr }], // farFutureStr > futureStr (return)
});
assert.equal(res8.valid, false, 'Expense date later than return date must fail');
assert.ok(
  res8.errors?.some((e) => e.toLowerCase().includes('later than return')),
  `Expected error about expense date later than return, got: ${JSON.stringify(res8.errors)}`
);
console.log('  ✅ PASS: Expense date after return date rejected');

// 9. Expense dates within trip range must pass
console.log('\nTest 9: Expense dates on or between departure and return must pass');
const res9 = validateCreateRequestPayload({
  ...basePayload,
  travel_type: 'UPCOMING',
  departure_date: todayStr,
  return_date: futureStr,
  expenses: [
    { category: 'FLIGHT', merchant: 'Airline', amount: 5000, expense_date: todayStr },
    { category: 'HOTEL', merchant: 'Hotel', amount: 8000, expense_date: futureStr },
  ],
});
assert.equal(res9.valid, true, `Expenses in trip window should be valid, errors: ${JSON.stringify(res9.errors)}`);
console.log('  ✅ PASS: Expenses within trip boundaries accepted');

console.log('\n🎉 ALL DATE BOUNDARY TEST CASES EVALUATED!\n');
