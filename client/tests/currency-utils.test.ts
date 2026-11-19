// client/tests/currency-utils.test.ts
import { formatForeignCurrency, formatDualCurrency } from '../src/features/travel/utils/currency.js';

function testCurrencyUtils() {
  // 1. Format foreign currencies with symbols
  const usd = formatForeignCurrency(150, 'USD');
  if (!usd.includes('150.00') || !usd.includes('$')) {
    throw new Error(`USD format mismatch: ${usd}`);
  }

  // 2. Format dual currency badge string
  const dual = formatDualCurrency(150, 'USD', 12622.50);
  if (!dual.includes('$150.00') || !dual.includes('₹12,622.50')) {
    throw new Error(`Dual currency format mismatch: ${dual}`);
  }

  // 3. Dual currency for INR should return standard INR
  const inrDual = formatDualCurrency(5000, 'INR', 5000);
  if (!inrDual.includes('₹5,000.00')) {
    throw new Error(`INR dual format mismatch: ${inrDual}`);
  }

  console.log('PASS: Currency utility tests passed');
}

testCurrencyUtils();
