import { signUpSchema } from '../src/features/auth/schemas/auth.schema';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runAuthValidationTests() {
  console.log('🧪 Running Client Auth Validation Tests (signUpSchema)...\n');

  const validBase = {
    email: 'valid@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  // 1. Should REJECT special characters like '@@@@@@@@@@'
  const specialCharsResult = signUpSchema.safeParse({
    ...validBase,
    name: '@@@@@@@@@@',
  });
  assert(
    !specialCharsResult.success,
    'Expected signUpSchema to REJECT special characters like @@@@@@@@@@'
  );
  if (!specialCharsResult.success) {
    const errorMsg = specialCharsResult.error.issues.find((i) => i.path.includes('name'))?.message;
    console.log('  Rejection for @@@@@@@@@@ message:', errorMsg);
    assert(
      errorMsg === 'Name can only contain letters, spaces, hyphens, and apostrophes',
      `Expected specific error message, got: ${errorMsg}`
    );
  }

  // 2. Should REJECT HTML / XSS payloads like '<script>alert(1)</script>'
  const xssResult = signUpSchema.safeParse({
    ...validBase,
    name: '<script>alert(1)</script>',
  });
  assert(!xssResult.success, 'Expected signUpSchema to REJECT script/HTML tags');

  // 3. Should REJECT numeric-only names
  const numbersResult = signUpSchema.safeParse({
    ...validBase,
    name: '12345678',
  });
  assert(!numbersResult.success, 'Expected signUpSchema to REJECT numeric-only names');

  // 4. Should REJECT single character names
  const singleCharResult = signUpSchema.safeParse({
    ...validBase,
    name: 'A',
  });
  assert(!singleCharResult.success, 'Expected signUpSchema to REJECT single-character name');

  // 5. Should ACCEPT valid standard names
  const standardResult = signUpSchema.safeParse({
    ...validBase,
    name: 'John Doe',
  });
  assert(standardResult.success, 'Expected signUpSchema to ACCEPT standard name "John Doe"');

  // 6. Should ACCEPT names with hyphens, apostrophes, and dots
  const punctuationNameResult = signUpSchema.safeParse({
    ...validBase,
    name: "Mary-Jane O'Connor",
  });
  assert(
    punctuationNameResult.success,
    'Expected signUpSchema to ACCEPT hyphens and apostrophes'
  );

  // 7. Should ACCEPT international Unicode names
  const unicodeNameResult = signUpSchema.safeParse({
    ...validBase,
    name: 'Renée Müller',
  });
  assert(
    unicodeNameResult.success,
    'Expected signUpSchema to ACCEPT Unicode accented names like "Renée Müller"'
  );

  console.log('\n✅ ALL CLIENT AUTH VALIDATION TESTS PASSED!\n');
}

runAuthValidationTests();
