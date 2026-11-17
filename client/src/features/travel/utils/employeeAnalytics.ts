import type { ExpenseCategory, TravelRequest } from '../types/travel.types';
import { EXPENSE_CATEGORY_META } from './travelAnalytics';

export interface EmployeeMonthlyBurnPoint {
  monthKey: string;
  label: string;
  month: string;
  approved: number;
  pending: number;
}

export interface EmployeeSpendOverview {
  totalClearedSpend: number;
  pendingCommitments: number;
  avgSpendPerTrip: number;
  totalTrips: number;
  uniqueDestinationsCount: number;
}

export interface EmployeeCategoryShare {
  categoryKey: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface ProjectSpendItem {
  code: string;
  tripCount: number;
  totalSpend: number;
}

export interface RouteSpendItem {
  destination: string;
  departure: string;
  tripCount: number;
  totalSpend: number;
}

export interface EmployeeProjectAndRouteVelocity {
  byProject: ProjectSpendItem[];
  byRoute: RouteSpendItem[];
}

export interface EmployeeSettlementHealth {
  totalSettledAmount: number;
  totalPendingSettlementAmount: number;
  totalInReviewAmount: number;
  settledCount: number;
  pendingSettlementCount: number;
  inReviewCount: number;
  settlementRatePct: number;
  avgTurnaroundDays: number | null;
}

const CLEARED_STATUSES = new Set(['SETTLED', 'CLOSED', 'ARCHIVED']);
const PENDING_COMMITMENT_STATUSES = new Set([
  'SUBMITTED',
  'PENDING_MANAGER_REVIEW',
  'PENDING_ADMIN_APPROVAL',
  'APPROVED',
  'CLAIM_SUBMITTED',
  'REVISION_REQUESTED_BY_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
]);

export const getEffectiveSpend = (req: TravelRequest): number => {
  if (req.totalExpenses && Number(req.totalExpenses) > 0) {
    return Number(req.totalExpenses);
  }
  if (req.expenses && req.expenses.length > 0) {
    return req.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }
  return 0;
};

export function computeEmployeeSpendOverview(requests: TravelRequest[]): EmployeeSpendOverview {
  let totalClearedSpend = 0;
  let pendingCommitments = 0;
  let clearedTripCount = 0;
  const destinations = new Set<string>();

  for (const req of requests) {
    const spend = getEffectiveSpend(req);
    const dest = (req.destination || (req as unknown as { destinationCity?: string }).destinationCity)?.trim();
    if (dest && dest !== 'TBD') {
      destinations.add(dest.toLowerCase());
    }

    if (CLEARED_STATUSES.has(req.status)) {
      totalClearedSpend += spend;
      clearedTripCount += 1;
    } else if (PENDING_COMMITMENT_STATUSES.has(req.status)) {
      pendingCommitments += spend;
    }
  }

  const avgSpendPerTrip = clearedTripCount > 0
    ? Math.round(totalClearedSpend / clearedTripCount)
    : requests.length > 0
      ? Math.round((totalClearedSpend + pendingCommitments) / requests.length)
      : 0;

  return {
    totalClearedSpend,
    pendingCommitments,
    avgSpendPerTrip,
    totalTrips: requests.length,
    uniqueDestinationsCount: destinations.size,
  };
}

export function computeEmployeeMonthlyBurnSeries(
  requests: TravelRequest[],
  referenceDate: Date = new Date()
): EmployeeMonthlyBurnPoint[] {
  const months: EmployeeMonthlyBurnPoint[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    months.push({
      monthKey,
      label,
      month: label,
      approved: 0,
      pending: 0,
    });
  }

  const map = new Map(months.map((m) => [m.monthKey, m]));

  for (const req of requests) {
    const dateStr = req.departureDate || req.createdAt;
    const parsed = dateStr ? new Date(dateStr) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) continue;

    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const bucket = map.get(key);
    if (!bucket) continue;

    const amt = getEffectiveSpend(req);
    if (CLEARED_STATUSES.has(req.status) || req.status === 'APPROVED') {
      bucket.approved += amt;
    } else if (PENDING_COMMITMENT_STATUSES.has(req.status)) {
      bucket.pending += amt;
    }
  }

  return months;
}

const normalizeCategory = (cat: string): ExpenseCategory => {
  const upper = cat.toUpperCase();
  if (upper === 'MEALS' || upper === 'MEALS_PER_DIEM') return 'MEALS_PER_DIEM';
  if (upper === 'LOCAL_TRANSPORT' || upper === 'TRANSIT') return 'TRANSIT';
  if (upper === 'INCIDENTAL' || upper === 'MISC' || upper === 'OTHER') return 'MISC';
  if (upper === 'FLIGHT') return 'FLIGHT';
  if (upper === 'HOTEL') return 'HOTEL';
  return 'MISC';
};

export function computeEmployeeCategoryShares(requests: TravelRequest[]): EmployeeCategoryShare[] {
  const catTotals: Record<ExpenseCategory, number> = {
    FLIGHT: 0,
    HOTEL: 0,
    MEALS_PER_DIEM: 0,
    TRANSIT: 0,
    MISC: 0,
  };

  let totalExpenses = 0;

  for (const req of requests) {
    if (req.expenses && req.expenses.length > 0) {
      for (const exp of req.expenses) {
        const cat = normalizeCategory(exp.category || 'MISC');
        const amt = Number(exp.amount || 0);
        catTotals[cat] += amt;
        totalExpenses += amt;
      }
    }
  }

  const results: EmployeeCategoryShare[] = [];

  for (const [key, amount] of Object.entries(catTotals)) {
    if (amount > 0) {
      const meta = EXPENSE_CATEGORY_META[key as ExpenseCategory] || EXPENSE_CATEGORY_META.MISC;
      const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
      results.push({
        categoryKey: key,
        label: meta.label,
        amount,
        percentage,
        color: meta.color,
      });
    }
  }

  return results.sort((a, b) => b.amount - a.amount);
}

export function computeEmployeeProjectAndRouteVelocity(
  requests: TravelRequest[]
): EmployeeProjectAndRouteVelocity {
  const projectMap = new Map<string, ProjectSpendItem>();
  const routeMap = new Map<string, RouteSpendItem>();

  for (const req of requests) {
    const spend = getEffectiveSpend(req);
    const code = req.projectCode?.trim() || 'General / Unassigned';

    const pExisting = projectMap.get(code) || { code, tripCount: 0, totalSpend: 0 };
    pExisting.tripCount += 1;
    pExisting.totalSpend += spend;
    projectMap.set(code, pExisting);

    const dest = (req.destination || (req as unknown as { destinationCity?: string }).destinationCity)?.trim() || 'Unspecified';
    const dept = (req.origin || (req as unknown as { departureCity?: string }).departureCity)?.trim() || 'Office Base';
    const routeKey = `${dept} -> ${dest}`;

    const rExisting = routeMap.get(routeKey) || {
      destination: dest,
      departure: dept,
      tripCount: 0,
      totalSpend: 0,
    };
    rExisting.tripCount += 1;
    rExisting.totalSpend += spend;
    routeMap.set(routeKey, rExisting);
  }

  const byProject = Array.from(projectMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  const byRoute = Array.from(routeMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);

  return { byProject, byRoute };
}

export function computeEmployeeSettlementHealth(
  requests: TravelRequest[]
): EmployeeSettlementHealth {
  let totalSettledAmount = 0;
  let totalPendingSettlementAmount = 0;
  let totalInReviewAmount = 0;
  let settledCount = 0;
  let pendingSettlementCount = 0;
  let inReviewCount = 0;
  let totalTurnaroundDays = 0;
  let turnaroundCount = 0;

  for (const req of requests) {
    const amt = getEffectiveSpend(req);

    if (CLEARED_STATUSES.has(req.status)) {
      totalSettledAmount += amt;
      settledCount += 1;

      // Real turnaround from claim creation/submission to settlement
      const start = req.createdAt;
      const settlementEvent = req.timeline?.find(
        (e) =>
          e.toStatus === 'SETTLED' ||
          e.to_status === 'SETTLED' ||
          e.eventType === 'SETTLED' ||
          e.event_type === 'SETTLED'
      );
      const end =
        settlementEvent?.createdAt ||
        settlementEvent?.created_at ||
        req.updatedAt ||
        req.createdAt;

      if (start && end) {
        const sTime = new Date(start).getTime();
        const eTime = new Date(end).getTime();
        if (!Number.isNaN(sTime) && !Number.isNaN(eTime)) {
          const diffMs = Math.max(0, eTime - sTime);
          const days = Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10;
          totalTurnaroundDays += Math.max(0.1, days);
          turnaroundCount += 1;
        }
      }
    } else if (req.status === 'APPROVED') {
      totalPendingSettlementAmount += amt;
      pendingSettlementCount += 1;
    } else if (PENDING_COMMITMENT_STATUSES.has(req.status)) {
      totalInReviewAmount += amt;
      inReviewCount += 1;
    }
  }

  const approvedTotal = totalSettledAmount + totalPendingSettlementAmount;
  const settlementRatePct = approvedTotal > 0
    ? Math.round((totalSettledAmount / approvedTotal) * 100)
    : 100;

  const avgTurnaroundDays = turnaroundCount > 0
    ? Math.round((totalTurnaroundDays / turnaroundCount) * 10) / 10
    : null;

  return {
    totalSettledAmount,
    totalPendingSettlementAmount,
    totalInReviewAmount,
    settledCount,
    pendingSettlementCount,
    inReviewCount,
    settlementRatePct,
    avgTurnaroundDays,
  };
}
