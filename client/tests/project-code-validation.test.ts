// client/tests/project-code-validation.test.ts
import assert from 'node:assert/strict';
import { travelFormSchema, PROJECT_CODE_REGEX } from '../src/features/travel/hooks/useTravelForm';

console.log('🧪 Starting Project Code Validation Test Suite (TDD RED Phase)...\n');

const validBase = {
  travel_type: 'UPCOMING' as const,
  title: 'Engineering Summit Tokyo',
  purpose: 'Strategic architecture review for 2026',
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

// Test 1: Empty project code must fail validation
console.log('Test 1: Empty or whitespace-only project code must fail');
const emptyRes = travelFormSchema.safeParse({
  ...validBase,
  project_code: '',
});
assert.equal(emptyRes.success, false, 'Expected validation to fail for empty project code');
assert.ok(
  emptyRes.error?.issues.some((i) => i.path[0] === 'project_code'),
  'Expected error on project_code field when empty'
);

const whitespaceRes = travelFormSchema.safeParse({
  ...validBase,
  project_code: '   ',
});
assert.equal(whitespaceRes.success, false, 'Expected validation to fail for whitespace project code');
console.log('  ✅ PASS: Empty and whitespace project codes are rejected');

// Test 2: Valid project codes with numbers must pass
console.log('\nTest 2: Valid uppercase project codes with hyphen and numbers must pass');
for (const code of ['ENG-2026', 'PROJ-APAC-01', 'PRJ-ENG-2026', 'FIN-02', 'A-1']) {
  const res = travelFormSchema.safeParse({
    ...validBase,
    project_code: code,
  });
  assert.equal(res.success, true, `Expected ${code} to be valid, but got: ${JSON.stringify(res.error?.issues)}`);
}
console.log('  ✅ PASS: Valid project codes with numbers pass');

// Test 3: Valid project codes WITHOUT numbers must pass (numbers are optional)
console.log('\nTest 3: Valid project codes WITHOUT numbers must pass (numbers optional)');
for (const code of ['PROJ-APAC', 'ENG-GLOBAL', 'ALPHA-BETA', 'A-B', 'DESIGN-SYSTEM']) {
  const res = travelFormSchema.safeParse({
    ...validBase,
    project_code: code,
  });
  assert.equal(res.success, true, `Expected ${code} without numbers to be valid, but got: ${JSON.stringify(res.error?.issues)}`);
}
console.log('  ✅ PASS: Valid project codes without numbers pass');

// Test 4: Lowercase letters must fail validation
console.log('\nTest 4: Lowercase or mixed-case project codes must fail');
for (const code of ['eng-2026', 'Proj-APAC', 'eng-apac', 'ENG-apac']) {
  const res = travelFormSchema.safeParse({
    ...validBase,
    project_code: code,
  });
  assert.equal(res.success, false, `Expected lowercase/mixed-case ${code} to fail`);
  assert.ok(
    res.error?.issues.some((i) => i.path[0] === 'project_code'),
    `Expected project_code error for ${code}`
  );
}
console.log('  ✅ PASS: Lowercase and mixed-case project codes are rejected');

// Test 5: Missing hyphen must fail validation
console.log('\nTest 5: Project codes without a hyphen must fail');
for (const code of ['ENG2026', 'PROJ', 'ALPHA', 'PROJECT123']) {
  const res = travelFormSchema.safeParse({
    ...validBase,
    project_code: code,
  });
  assert.equal(res.success, false, `Expected missing hyphen ${code} to fail`);
  assert.ok(
    res.error?.issues.some((i) => i.path[0] === 'project_code'),
    `Expected project_code error for ${code}`
  );
}
console.log('  ✅ PASS: Project codes without hyphen are rejected');

// Test 6: Invalid format (leading/trailing/consecutive hyphens, special chars) must fail
console.log('\nTest 6: Malformed hyphens or invalid characters must fail');
for (const code of ['-ENG-2026', 'ENG-2026-', 'ENG--2026', 'ENG_2026', 'ENG@2026', '123-456']) {
  const res = travelFormSchema.safeParse({
    ...validBase,
    project_code: code,
  });
  assert.equal(res.success, false, `Expected malformed ${code} to fail`);
  assert.ok(
    res.error?.issues.some((i) => i.path[0] === 'project_code'),
    `Expected project_code error for ${code}`
  );
}
console.log('  ✅ PASS: Malformed project codes are rejected');

// Test 7: Exported PROJECT_CODE_REGEX utility matches expected pattern
console.log('\nTest 7: Direct regex validation');
assert.equal(PROJECT_CODE_REGEX.test('ENG-2026'), true);
assert.equal(PROJECT_CODE_REGEX.test('PROJ-GLOBAL'), true);
assert.equal(PROJECT_CODE_REGEX.test('eng-2026'), false);
assert.equal(PROJECT_CODE_REGEX.test('ENG2026'), false);
console.log('  ✅ PASS: Regex test verifies expected behavior');

console.log('\n🎉 ALL PROJECT CODE VALIDATION TESTS PASSED!\n');
