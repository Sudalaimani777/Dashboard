// server/tests/travel-phone-validation.test.ts
import assert from 'node:assert/strict';
import { isValidPhoneNumber } from '../src/features/travel/travel.validation.js';

console.log('🧪 Starting Server Phone Validation Test Suite (TDD RED Phase)...\n');

// Test 1: Reject partial Indian numbers
console.log('Test 1: Reject partial Indian numbers (+91)');
assert.equal(isValidPhoneNumber('+91 89401'), false, '5-digit partial Indian phone must fail');
assert.equal(isValidPhoneNumber('+91 894019'), false, '6-digit partial Indian phone must fail');
assert.equal(isValidPhoneNumber('+91 1234567890'), false, 'Indian phone starting with 1 must fail');
assert.equal(isValidPhoneNumber('+91 9876543210'), true, 'Valid 10-digit Indian phone must pass');
console.log('  ✅ PASS: India (+91) format constraints enforced on server');

// Test 2: Reject partial US/Canada numbers
console.log('\nTest 2: Reject partial US/Canada numbers (+1)');
assert.equal(isValidPhoneNumber('+1 5551234'), false, '7-digit US phone must fail');
assert.equal(isValidPhoneNumber('+1 4155552671'), true, 'Valid 10-digit US phone must pass');
console.log('  ✅ PASS: US/Canada (+1) constraints enforced on server');

// Test 3: Other countries
console.log('\nTest 3: Singapore (+65) and UK (+44) constraints');
assert.equal(isValidPhoneNumber('+65 812345'), false, '6-digit Singapore phone must fail');
assert.equal(isValidPhoneNumber('+65 81234567'), true, '8-digit Singapore phone must pass');
assert.equal(isValidPhoneNumber('+44 7911123456'), true, 'Valid UK phone must pass');
console.log('  ✅ PASS: Singapore & UK constraints enforced on server');

// Test 4: Reject uniform dummy digits
console.log('\nTest 4: Reject uniform dummy digits');
assert.equal(isValidPhoneNumber('+91 9999999999'), false, 'Repeated 9s must fail');
assert.equal(isValidPhoneNumber('+91 0000000000'), false, 'Repeated 0s must fail');
console.log('  ✅ PASS: Uniform dummy numbers rejected on server');

console.log('\n🎉 ALL SERVER PHONE VALIDATION TESTS EVALUATED!\n');
