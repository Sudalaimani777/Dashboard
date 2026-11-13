import type {
  ExpenseCategory,
  FiscalQuarter,
  TravelExpenseItem,
  TravelRequest,
} from '../types/travel.types';

export interface CategorySummary {
  category: ExpenseCategory;
  label: string;
  shortLabel: string;
  color: string;
  total: number;
  percentage: number;
}

export const EXPENSE_CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; shortLabel: string; color: string }
> = {
  FLIGHT: { label: 'Airfare & Flights', shortLabel: 'Flights', color: '#8A582B' },
  HOTEL: { label: 'Accommodations', shortLabel: 'Hotel', color: '#2D6A74' },
  MEALS_PER_DIEM: { label: 'Meals & Per Diem', shortLabel: 'Meals', color: '#C2782D' },
  TRANSIT: { label: 'Ground Transit', shortLabel: 'Transit', color: '#3F624D' },
  MISC: { label: 'Incidental / Misc', shortLabel: 'Misc', color: '#645C54' },
};

/**
 * Aggregates expense line items by category with percentages.
 */
export function aggregateExpenseItems(items: TravelExpenseItem[] = []): {
  totalSpend: number;
  categories: CategorySummary[];
} {
  const totals = new Map<ExpenseCategory, number>();

  for (const item of items) {
    const cat = (item.category || 'MISC') as ExpenseCategory;
    const amt = Number(item.amount) || 0;
    if (amt > 0) {
      totals.set(cat, (totals.get(cat) || 0) + amt);
    }
  }

  const totalSpend = Array.from(totals.values()).reduce((sum, v) => sum + v, 0);
  const categories: CategorySummary[] = Array.from(totals.entries())
    .map(([category, total]) => {
      const meta = EXPENSE_CATEGORY_META[category] || EXPENSE_CATEGORY_META.MISC;
      return {
        category,
        label: meta.label,
        shortLabel: meta.shortLabel,
        color: meta.color,
        total,
        percentage: totalSpend > 0 ? Math.round((total / totalSpend) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return { totalSpend, categories };
}

/**
 * Aggregates expense items across multiple travel requests.
 */
export function aggregateRequestsCategorySpend(requests: TravelRequest[]): {
  totalSpend: number;
  categories: CategorySummary[];
} {
  const allItems: TravelExpenseItem[] = [];
  for (const req of requests) {
    if (req.expenses && req.expenses.length > 0) {
      allItems.push(...req.expenses);
    }
  }
  return aggregateExpenseItems(allItems);
}

/**
 * Computes inclusive trip days and nights between departure and return dates.
 */
export function computeTripDuration(departureDate?: string, returnDate?: string): {
  days: number;
  nights: number;
  label: string;
} {
  if (!departureDate || !returnDate) {
    return { days: 1, nights: 0, label: '1 day' };
  }
  const start = new Date(departureDate);
  const end = new Date(returnDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return { days: 1, nights: 0, label: '1 day' };
  }
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
  const nights = Math.max(0, diffDays);
  const days = nights + 1;
  return {
    days,
    nights,
    label: nights === 0 ? 'Same-day trip' : `${nights} night${nights > 1 ? 's' : ''} · ${days} days`,
  };
}

export interface DraftReadiness {
  readyCount: number;
  totalChecks: number;
  isReady: boolean;
  missing: string[];
}

/**
 * Evaluates whether a saved travel draft has all fields required for submission.
 */
export function computeDraftReadiness(req: TravelRequest): DraftReadiness {
  const missing: string[] = [];
  const hasTitle = Boolean(req.title && req.title.trim().length >= 5 && req.title !== 'Untitled Travel Draft');
  const hasPurpose = Boolean(req.purpose && req.purpose.trim().length >= 10 && req.purpose !== 'Travel draft');
  const hasRoute = Boolean(
    req.origin && req.origin !== 'TBD' && req.destination && req.destination !== 'TBD'
  );
  const hasProof = Boolean(req.supportingDocUrl && /^https?:\/\/.+/i.test(req.supportingDocUrl));
  const hasExpenses = Boolean(
    req.expenses && req.expenses.length > 0 && req.expenses.some((e) => Number(e.amount) > 0)
  ) || Number(req.totalExpenses) > 0;

  if (!hasTitle) missing.push('Trip title');
  if (!hasPurpose) missing.push('Business purpose');
  if (!hasRoute) missing.push('Origin / destination');
  if (!hasProof) missing.push('Proof document URL');
  if (!hasExpenses) missing.push('Itemized expense > ₹0');

  const totalChecks = 5;
  const readyCount = totalChecks - missing.length;
  return {
    readyCount,
    totalChecks,
    isReady: missing.length === 0,
    missing,
  };
}

/**
 * Exports a list of travel requests as a downloadable CSV file.
 */
export function exportRequestsToCsv(requests: TravelRequest[], filename = 'travel-history.csv'): void {
  const headers = [
    'ID',
    'Title',
    'Project Code',
    'Type',
    'Origin',
    'Destination',
    'Departure Date',
    'Return Date',
    'Total Amount (INR)',
    'Status',
  ];

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = requests.map((r) => [
    r.id.slice(0, 8),
    r.title,
    r.projectCode,
    r.travelType === 'UPCOMING' ? 'Upcoming' : 'Reimbursement',
    r.origin,
    r.destination,
    r.departureDate,
    r.returnDate,
    Number(r.totalExpenses || 0).toFixed(2),
    r.status,
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Derives fiscal year and quarter (Q1-Q4) from an ISO date string, falling back to current date.
 */
export function getFiscalQuarterFromDate(dateStr?: string): {
  year: number;
  quarter: FiscalQuarter;
} {
  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        let quarter: FiscalQuarter = 'Q4';
        if (month >= 1 && month <= 3) quarter = 'Q1';
        else if (month >= 4 && month <= 6) quarter = 'Q2';
        else if (month >= 7 && month <= 9) quarter = 'Q3';
        return { year, quarter };
      }
    }
  }
  const parsed = dateStr ? new Date(dateStr) : new Date();
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = safeDate.getFullYear();
  const month = safeDate.getMonth() + 1;
  let quarter: FiscalQuarter = 'Q4';
  if (month >= 1 && month <= 3) quarter = 'Q1';
  else if (month >= 4 && month <= 6) quarter = 'Q2';
  else if (month >= 7 && month <= 9) quarter = 'Q3';
  return { year, quarter };
}
