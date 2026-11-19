// client/tests/whitespace-validation.test.ts
import assert from 'node:assert/strict';
import { travelFormSchema } from '../src/features/travel/hooks/useTravelForm';
import { resubmitFormSchema } from '../src/features/travel/pages/ResubmitTravelRequestPage';

console.log('🧪 Starting Whitespace Rejection Validation Test Suite...\n');

const validPayload = {
  travel_type: 'UPCOMING' as const,
  title: 'Engineering Summit Tokyo',
  purpose: 'Strategic architecture review for 2026',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'Tokyo, Japan',
  departure_date: '2026-12-01',
  return_date: '2026-12-05',
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
  expenses: [
    {
      category: 'FLIGHT' as const,
      merchant: 'Air India',
      amount: 12000,
      expenseDate: '2026-12-01',
    },
  ],
};

// Test 1: Title with only spaces must fail validation
console.log('Test 1: Blank whitespace title must fail travelFormSchema');
const spaceTitle = travelFormSchema.safeParse({
  ...validPayload,
  title: '     ', // 5 spaces
});
assert.equal(spaceTitle.success, false, 'Expected 5 spaces title to fail validation');
assert.ok(
  spaceTitle.error?.issues.some((i) => i.path[0] === 'title'),
  'Expected error on title when filled with only spaces'
);
console.log('  ✅ PASS: 5-space title rejected');

// Test 2: Purpose with only spaces must fail validation
console.log('\nTest 2: Blank whitespace purpose must fail travelFormSchema');
const spacePurpose = travelFormSchema.safeParse({
  ...validPayload,
  purpose: '          ', // 10 spaces
});
assert.equal(spacePurpose.success, false, 'Expected 10 spaces purpose to fail validation');
assert.ok(
  spacePurpose.error?.issues.some((i) => i.path[0] === 'purpose'),
  'Expected error on purpose when filled with only spaces'
);
console.log('  ✅ PASS: 10-space purpose rejected');

// Test 3: Origin and Destination with only spaces must fail validation
console.log('\nTest 3: Blank whitespace origin & destination must fail travelFormSchema');
const spaceOrigin = travelFormSchema.safeParse({
  ...validPayload,
  origin: '  ', // 2 spaces
});
assert.equal(spaceOrigin.success, false, 'Expected 2 spaces origin to fail validation');
assert.ok(
  spaceOrigin.error?.issues.some((i) => i.path[0] === 'origin'),
  'Expected error on origin when filled with only spaces'
);

const spaceDest = travelFormSchema.safeParse({
  ...validPayload,
  destination: '   ', // 3 spaces
});
assert.equal(spaceDest.success, false, 'Expected 3 spaces destination to fail validation');
assert.ok(
  spaceDest.error?.issues.some((i) => i.path[0] === 'destination'),
  'Expected error on destination when filled with only spaces'
);
console.log('  ✅ PASS: Space-only origin and destination rejected');

// Test 4: Emergency contact name with only spaces must fail validation
console.log('\nTest 4: Blank whitespace emergency_contact_name must fail travelFormSchema');
const spaceContact = travelFormSchema.safeParse({
  ...validPayload,
  emergency_contact_name: '    ', // 4 spaces
});
assert.equal(spaceContact.success, false, 'Expected space-only emergency_contact_name to fail validation');
assert.ok(
  spaceContact.error?.issues.some((i) => i.path[0] === 'emergency_contact_name'),
  'Expected error on emergency_contact_name when filled with only spaces'
);
console.log('  ✅ PASS: Space-only emergency contact name rejected');

// Test 5: Resubmit form schema rejects whitespace-only inputs
console.log('\nTest 5: Blank whitespace fields must fail resubmitFormSchema');
const resubmitSpaces = resubmitFormSchema.safeParse({
  ...validPayload,
  title: '   ', // 3 spaces
  purpose: '     ', // 5 spaces
  origin: '  ',
  destination: '  ',
});
assert.equal(resubmitSpaces.success, false, 'Expected resubmitFormSchema to fail with whitespace fields');
assert.ok(resubmitSpaces.error?.issues.some((i) => i.path[0] === 'title'), 'Expected title error in resubmit');
assert.ok(resubmitSpaces.error?.issues.some((i) => i.path[0] === 'purpose'), 'Expected purpose error in resubmit');
assert.ok(resubmitSpaces.error?.issues.some((i) => i.path[0] === 'origin'), 'Expected origin error in resubmit');
assert.ok(resubmitSpaces.error?.issues.some((i) => i.path[0] === 'destination'), 'Expected destination error in resubmit');
console.log('  ✅ PASS: Resubmit form rejects whitespace-only fields');

console.log('\n🎉 ALL WHITESPACE REJECTION TESTS EVALUATED!\n');
