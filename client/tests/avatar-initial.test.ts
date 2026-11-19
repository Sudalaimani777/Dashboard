import { getSafeInitial } from '../src/features/dashboard/utils/avatar';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runAvatarInitialTests() {
  console.log('🧪 Running Avatar Safe Initial Tests...\n');

  // Test 1: Standard valid name
  assert(getSafeInitial('John Doe', 'john@example.com') === 'J', 'Should return J for John');

  // Test 2: Name with special characters @@@@@@@@@@ should NOT return @
  // It should fallback to email's first letter 'S'
  const initialWithSymbols = getSafeInitial('@@@@@@@@@@', 'sudalaimani@gmail.com');
  console.log('  Initial for @@@@@@@@@@ with sudalaimani@gmail.com:', initialWithSymbols);
  assert(
    initialWithSymbols === 'S',
    `Expected safe initial 'S' from email fallback, but got '${initialWithSymbols}'`
  );

  // Test 3: Unicode accented name
  assert(getSafeInitial('Éléonore', 'eleo@test.com') === 'É', 'Should return É for Éléonore');

  // Test 4: Completely empty or symbol-only inputs fallback to 'R'
  assert(getSafeInitial('$$$$', '****') === 'R', "Should fallback to 'R'");
  assert(getSafeInitial('', '') === 'R', "Should fallback to 'R' on empty string");
  assert(getSafeInitial(undefined, undefined) === 'R', "Should fallback to 'R' on undefined");

  console.log('\n✅ ALL AVATAR INITIAL TESTS PASSED!\n');
}

runAvatarInitialTests();
