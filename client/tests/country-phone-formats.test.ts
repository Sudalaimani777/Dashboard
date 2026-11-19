// client/tests/country-phone-formats.test.ts
import assert from 'node:assert/strict';
import {
  isValidEmergencyPhone,
  getPhoneValidationError,
} from '../src/features/travel/utils/countryDialCodes';

console.log('🧪 Starting 30-Country Mobile Format Validation Test Suite (TDD RED Phase)...\n');

// Test 1: India (+91) format constraints
console.log('Test 1: India (+91) mobile format validation');
assert.equal(isValidEmergencyPhone('+91 89401'), false, '5-digit partial Indian number must fail');
assert.equal(isValidEmergencyPhone('+91 894019'), false, '6-digit partial Indian number (screenshot case) must fail');
assert.equal(isValidEmergencyPhone('+91 1234567890'), false, 'Indian number starting with 1 must fail');
assert.equal(isValidEmergencyPhone('+91 9876543210'), true, 'Valid 10-digit Indian mobile must pass');
assert.equal(isValidEmergencyPhone('+91 8940192837'), true, 'Valid 10-digit Indian mobile starting with 8 must pass');
console.log('  ✅ PASS: India (+91) validation rules enforced');

// Test 2: US & Canada (+1) format constraints
console.log('\nTest 2: North America (+1) format validation');
assert.equal(isValidEmergencyPhone('+1 5551234'), false, '7-digit US number must fail');
assert.equal(isValidEmergencyPhone('+1 0123456789'), false, 'US number starting with 0 area code must fail');
assert.equal(isValidEmergencyPhone('+1 4155552671'), true, 'Valid 10-digit US number must pass');
console.log('  ✅ PASS: North America (+1) validation rules enforced');

// Test 3: Singapore (+65) format constraints
console.log('\nTest 3: Singapore (+65) format validation');
assert.equal(isValidEmergencyPhone('+65 812345'), false, '6-digit Singapore number must fail');
assert.equal(isValidEmergencyPhone('+65 81234567'), true, 'Valid 8-digit Singapore number must pass');
assert.equal(isValidEmergencyPhone('+65 91234567'), true, 'Valid 8-digit Singapore number starting with 9 must pass');
console.log('  ✅ PASS: Singapore (+65) validation rules enforced');

// Test 4: United Kingdom (+44) format constraints
console.log('\nTest 4: United Kingdom (+44) format validation');
assert.equal(isValidEmergencyPhone('+44 79111'), false, '5-digit UK number must fail');
assert.equal(isValidEmergencyPhone('+44 7911123456'), true, 'Valid 10-digit UK mobile must pass');
console.log('  ✅ PASS: UK (+44) validation rules enforced');

// Test 5: UAE (+971) & Saudi Arabia (+966)
console.log('\nTest 5: UAE (+971) & Saudi Arabia (+966) format validation');
assert.equal(isValidEmergencyPhone('+971 50123'), false, '5-digit UAE number must fail');
assert.equal(isValidEmergencyPhone('+971 501234567'), true, 'Valid 9-digit UAE mobile must pass');
assert.equal(isValidEmergencyPhone('+966 50123'), false, '5-digit Saudi number must fail');
assert.equal(isValidEmergencyPhone('+966 501234567'), true, 'Valid 9-digit Saudi mobile must pass');
console.log('  ✅ PASS: UAE & Saudi Arabia validation rules enforced');

// Test 6: China (+86), Japan (+81), Australia (+61), France (+33), Germany (+49)
console.log('\nTest 6: Major APAC & European country rules');
assert.equal(isValidEmergencyPhone('+86 138000000'), false, '9-digit China number must fail');
assert.equal(isValidEmergencyPhone('+86 13800000000'), true, 'Valid 11-digit China mobile must pass');
assert.equal(isValidEmergencyPhone('+81 9012345678'), true, 'Valid Japan mobile must pass');
assert.equal(isValidEmergencyPhone('+61 412345678'), true, 'Valid Australia mobile must pass');
assert.equal(isValidEmergencyPhone('+33 612345678'), true, 'Valid France mobile must pass');
assert.equal(isValidEmergencyPhone('+49 15112345678'), true, 'Valid Germany mobile must pass');
console.log('  ✅ PASS: APAC & European validation rules enforced');

// Test 7: Block repeated dummy numbers across all countries
console.log('\nTest 7: Reject repeated dummy numbers');
assert.equal(isValidEmergencyPhone('+91 9999999999'), false, 'Uniform 9s must fail');
assert.equal(isValidEmergencyPhone('+91 0000000000'), false, 'Uniform 0s must fail');
assert.equal(isValidEmergencyPhone('+1 4444444444'), false, 'Uniform 4s in US must fail');
console.log('  ✅ PASS: Dummy uniform numbers blocked');

// Test 8: getPhoneValidationError provides contextual guidance
console.log('\nTest 8: getPhoneValidationError returns helpful message');
const errIndia = getPhoneValidationError('+91 894019');
assert.ok(errIndia !== null, 'Expected error message for partial Indian phone');
assert.ok(
  errIndia.toLowerCase().includes('10 digits') || errIndia.toLowerCase().includes('india'),
  `Expected message mentioning 10 digits or India, got: "${errIndia}"`
);
const errValid = getPhoneValidationError('+91 9876543210');
assert.equal(errValid, null, 'Valid phone should return null error');
console.log('  ✅ PASS: Dynamic contextual guidance returned');

console.log('\n🎉 ALL 30-COUNTRY PHONE VALIDATION TESTS EVALUATED!\n');
