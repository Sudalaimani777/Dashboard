// client/tests/form-blur-validation.test.ts
import assert from 'node:assert/strict';
import { travelFormSchema, TRAVEL_FORM_CONFIG } from '../src/features/travel/hooks/useTravelForm';
import { resubmitFormSchema, RESUBMIT_FORM_CONFIG } from '../src/features/travel/pages/ResubmitTravelRequestPage';

console.log('🧪 Starting Form Blur & OnTouched Validation Test Suite (TDD RED Phase)...\n');

// Test 1: Config exports mode: 'onTouched'
console.log('Test 1: Form configurations must specify mode: onTouched');
assert.equal(
  TRAVEL_FORM_CONFIG.mode,
  'onTouched',
  `Expected TRAVEL_FORM_CONFIG.mode to be 'onTouched', got: ${TRAVEL_FORM_CONFIG.mode}`
);
assert.equal(
  RESUBMIT_FORM_CONFIG.mode,
  'onTouched',
  `Expected RESUBMIT_FORM_CONFIG.mode to be 'onTouched', got: ${RESUBMIT_FORM_CONFIG.mode}`
);
console.log('  ✅ PASS: Form configurations export mode: onTouched');

// Test 2: Field level schema error triggers on invalid values for individual fields
console.log('\nTest 2: Schema validation detects invalid individual fields on blur/trigger');

// Title < 3 chars
const titleCheck = travelFormSchema.safeParse({
  travel_type: 'UPCOMING',
  title: 'AB', // < 3 chars
  purpose: 'Strategic partner review',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'London',
  departure_date: '2026-12-01',
  return_date: '2026-12-05',
  emergency_contact_name: 'HR Ops',
  emergency_contact_phone: '+91 9876543210',
  supporting_doc_url: 'https://storage.googleapis.com/test.pdf',
  supporting_docs: [{ id: '1', type: 'LINK', name: 'Doc', url: 'https://test.pdf' }],
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expenseDate: '2026-12-01' }],
});
assert.equal(titleCheck.success, false);
assert.ok(
  titleCheck.error?.issues.some((i) => i.path[0] === 'title'),
  'Expected error on title when length < 3'
);
console.log('  ✅ PASS: Short title detected on blur');

// Invalid Emergency Contact Phone on blur
const phoneCheck = travelFormSchema.safeParse({
  travel_type: 'UPCOMING',
  title: 'London Planning',
  purpose: 'Strategic partner review',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'London',
  departure_date: '2026-12-01',
  return_date: '2026-12-05',
  emergency_contact_name: 'HR Ops',
  emergency_contact_phone: '+91 1234', // Incomplete phone
  supporting_doc_url: 'https://storage.googleapis.com/test.pdf',
  supporting_docs: [{ id: '1', type: 'LINK', name: 'Doc', url: 'https://test.pdf' }],
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expenseDate: '2026-12-01' }],
});
assert.equal(phoneCheck.success, false);
assert.ok(
  phoneCheck.error?.issues.some((i) => i.path[0] === 'emergency_contact_phone'),
  'Expected error on emergency_contact_phone when incomplete phone is entered'
);
console.log('  ✅ PASS: Incomplete phone detected on blur');

// In-between expense date violation detected on blur
const expenseDateCheck = travelFormSchema.safeParse({
  travel_type: 'UPCOMING',
  title: 'London Planning',
  purpose: 'Strategic partner review',
  project_code: 'ENG-2026',
  origin: 'Bengaluru',
  destination: 'London',
  departure_date: '2026-12-01',
  return_date: '2026-12-05',
  emergency_contact_name: 'HR Ops',
  emergency_contact_phone: '+91 9876543210',
  supporting_doc_url: 'https://storage.googleapis.com/test.pdf',
  supporting_docs: [{ id: '1', type: 'LINK', name: 'Doc', url: 'https://test.pdf' }],
  expenses: [{ category: 'FLIGHT', merchant: 'Airline', amount: 5000, expenseDate: '2026-11-20' }],
});
assert.equal(expenseDateCheck.success, false);
assert.ok(
  expenseDateCheck.error?.issues.some((i) => i.path.includes('expenses') && i.path.includes('expenseDate')),
  'Expected error on expenses.expenseDate when before departure'
);
console.log('  ✅ PASS: Out-of-bounds expense date detected on blur');

console.log('\n🎉 ALL FORM BLUR VALIDATION TESTS EVALUATED!\n');
