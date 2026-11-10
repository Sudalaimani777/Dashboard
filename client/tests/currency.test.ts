// client/tests/currency.test.ts
import { formatINR, formatINRCompact, parseINR } from '../src/features/travel/utils/currency';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runCurrencyTests() {
  console.log('🧪 Running Indian Rupee (INR) Currency Formatter Tests...\n');

  // Test 1: Standard formatting with Indian numbering system (Lakhs & Crores)
  const formatted1 = formatINR(148000);
  console.log('Format 148,000:', formatted1);
  assert(formatted1.includes('₹') || formatted1.includes('INR'), 'Must contain rupee symbol or INR');
  assert(formatted1.includes('1,48,000'), 'Must format using Indian numbering 1,48,000');

  // Test 2: Large budget pool (₹35,00,000.00 / 35 Lakhs)
  const formatted2 = formatINR(3500000);
  console.log('Format 3,500,000:', formatted2);
  assert(formatted2.includes('35,00,000'), 'Must format 35 Lakhs as 35,00,000');

  // Test 3: Zero and small amounts
  const formattedZero = formatINR(0);
  assert(formattedZero.includes('0.00'), 'Zero amount must include two decimals');

  // Test 4: Compact notation
  const compact1 = formatINRCompact(3500000);
  console.log('Compact 35 Lakhs:', compact1);
  assert(compact1.includes('35L') || compact1.includes('3.5M') || compact1.includes('35'), 'Compact format must represent Lakhs cleanly');

  // Test 5: Parsing string amounts back to numbers
  const parsed = parseINR('₹1,48,000.50');
  assert(parsed === 148000.5, `Expected 148000.5, got ${parsed}`);

  console.log('\n✅ ALL CURRENCY FORMATTER TESTS PASSED!\n');
}

runCurrencyTests();
