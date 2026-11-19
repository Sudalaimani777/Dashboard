// client/src/features/travel/utils/currency.ts

/**
 * Standard Indian Rupee (INR) formatter using the en-IN locale.
 * Adheres to Indian numbering conventions (lakhs and crores).
 * Example: 148000 -> "₹1,48,000.00"
 */
export function formatINR(val: number | string | null | undefined): string {
  const num = typeof val === 'string' ? parseFloat(val) : Number(val ?? 0);
  if (isNaN(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Compact Indian currency formatter for executive dashboards & budget meters.
 * Example: 3500000 -> "₹35L", 150000 -> "₹1.5L"
 */
export function formatINRCompact(val: number | string | null | undefined): string {
  const num = typeof val === 'string' ? parseFloat(val) : Number(val ?? 0);
  if (isNaN(num) || num === 0) return '₹0';

  if (Math.abs(num) >= 10000000) {
    const cr = num / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)}Cr`;
  }
  if (Math.abs(num) >= 100000) {
    const lakh = num / 100000;
    return `₹${lakh % 1 === 0 ? lakh : lakh.toFixed(1)}L`;
  }
  if (Math.abs(num) >= 1000) {
    const k = num / 1000;
    return `₹${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }

  return formatINR(num);
}

/**
 * Strips currency symbols and commas to return a clean floating point number.
 */
export function parseINR(formattedStr: string): number {
  if (!formattedStr) return 0;
  const cleaned = formattedStr.replace(/[₹\s,INR]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Tailwind utility classes for rendering tabular monetary figures cleanly.
 * Prevents layout shift during animated increments and preserves vertical alignment.
 */
export const TABULAR_NUM_CLASS = 'font-mono tabular-nums tracking-tight';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  THB: '฿',
  MYR: 'RM'
};

export function formatForeignCurrency(amount: number | string | null | undefined, currency: string = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return `${currency} 0.00`;
  const code = currency.toUpperCase().trim();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDualCurrency(
  foreignAmount: number | string | null | undefined,
  foreignCurrency: string = 'INR',
  inrAmount?: number | string | null | undefined
): string {
  const cur = (foreignCurrency || 'INR').toUpperCase().trim();
  const fAmt = typeof foreignAmount === 'string' ? parseFloat(foreignAmount) : Number(foreignAmount ?? 0);
  const iAmt = inrAmount !== undefined && inrAmount !== null
    ? (typeof inrAmount === 'string' ? parseFloat(inrAmount) : Number(inrAmount))
    : fAmt;

  if (cur === 'INR') {
    return formatINR(iAmt);
  }

  return `${formatForeignCurrency(fAmt, cur)} (₹${iAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
}
