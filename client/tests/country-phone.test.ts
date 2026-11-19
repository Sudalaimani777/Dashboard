// client/tests/country-phone.test.ts
import assert from 'node:assert/strict';
import {
  COUNTRIES,
  findCountryByDialCode,
  splitPhoneNumber,
  filterCountries,
  isValidEmergencyPhone,
} from '../src/features/travel/utils/countryDialCodes';

console.log('🧪 Starting Country Dial Codes & Phone Parsing Test Suite (TDD RED Phase)...\n');

// Test 1: Country list contains at least 30 countries and has India as first/default
console.log('Test 1: Country list size and default');
assert.ok(COUNTRIES.length >= 30, `Expected at least 30 countries, got ${COUNTRIES.length}`);
assert.equal(COUNTRIES[0].code, 'IN', 'Default country should be India (IN)');
assert.equal(COUNTRIES[0].dialCode, '+91', 'Default country dial code should be +91');
console.log('  ✅ PASS: 30 countries configured with India (+91) default');

// Test 2: filterCountries search matching
console.log('\nTest 2: Search filter matching by name, dial code, and ISO code');
assert.equal(filterCountries('india')[0]?.code, 'IN');
assert.equal(filterCountries('+91')[0]?.code, 'IN');
assert.equal(filterCountries('91')[0]?.code, 'IN');
assert.equal(filterCountries('united states')[0]?.code, 'US');
assert.equal(filterCountries('GB')[0]?.code, 'GB');
assert.equal(filterCountries('japan')[0]?.code, 'JP');
assert.equal(filterCountries('nonexistentxyz').length, 0);
console.log('  ✅ PASS: Multi-field search works accurately');

// Test 3: findCountryByDialCode
console.log('\nTest 3: Find country by dial code');
const jp = findCountryByDialCode('+81');
assert.equal(jp?.name, 'Japan');
const de = findCountryByDialCode('+49');
assert.equal(de?.name, 'Germany');
console.log('  ✅ PASS: Find country by dial code works');

// Test 4: splitPhoneNumber parsing
console.log('\nTest 4: Split phone number into country and national digits');
const s1 = splitPhoneNumber('+91 9876543210');
assert.equal(s1.country.code, 'IN');
assert.equal(s1.nationalNumber, '9876543210');

const s2 = splitPhoneNumber('+81 9012345678');
assert.equal(s2.country.code, 'JP');
assert.equal(s2.nationalNumber, '9012345678');

const s3 = splitPhoneNumber('9876543210'); // Missing dial code falls back to India
assert.equal(s3.country.code, 'IN');
assert.equal(s3.nationalNumber, '9876543210');

const s4 = splitPhoneNumber('+91'); // Bare dial code leaves national number empty for placeholder display
assert.equal(s4.country.code, 'IN');
assert.equal(s4.nationalNumber, '');
console.log('  ✅ PASS: splitPhoneNumber parses international and local formats');

// Test 5: isValidEmergencyPhone validation
console.log('\nTest 5: isValidEmergencyPhone validation');
assert.equal(isValidEmergencyPhone('+91 9876543210'), true, 'Valid Indian 10-digit mobile passes');
assert.equal(isValidEmergencyPhone('+1 4155552671'), true, 'Valid US 10-digit mobile passes');
assert.equal(isValidEmergencyPhone('+44 7911123456'), true, 'Valid UK mobile passes');
assert.equal(isValidEmergencyPhone('+91 123'), false, 'Too short number fails');
assert.equal(isValidEmergencyPhone('+91 0000000000'), false, 'Dummy number fails');
assert.equal(isValidEmergencyPhone('abcde'), false, 'Text fails');
assert.equal(isValidEmergencyPhone(''), false, 'Empty fails');
console.log('  ✅ PASS: isValidEmergencyPhone accurately verifies phone numbers');

console.log('\n🎉 ALL COUNTRY DIAL CODE & PHONE TESTS EVALUATED!\n');
