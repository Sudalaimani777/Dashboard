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
