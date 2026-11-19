import type { ExpenseCategory, TravelRequest } from '../types/travel.types';
import { EXPENSE_CATEGORY_META } from './travelAnalytics';

export interface ManagerMonthlyBurnPoint {
  monthKey: string;
  label: string;
  month: string;
  approved: number;
  pending: number;
}

export interface ManagerTeamOverview {
  teamTotalClearedSpend: number;
  teamPendingApprovals: number;
  avgReviewDays: number | null;
  activeSpendersCount: number;
  totalTeamTrips: number;
}

export interface ManagerCategoryShare {
  categoryKey: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MemberSpendItem {
  name: string;
  tripCount: number;
  totalSpend: number;
  approvedSpend: number;
}

export interface ProjectSpendItem {
  code: string;
  tripCount: number;
  totalSpend: number;
}

export interface ManagerSpendersAndProjectVelocity {
  byMember: MemberSpendItem[];
  byProject: ProjectSpendItem[];
}

export interface ManagerApprovalHealth {
  forwardedCount: number;
  pendingManagerCount: number;
  returnedCount: number;
  avgReviewDays: number | null;
  approvalRatePct: number;
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

export function computeManagerTeamOverview(requests: TravelRequest[]): ManagerTeamOverview {
  let teamTotalClearedSpend = 0;
  let teamPendingApprovals = 0;
  const spenders = new Set<string>();

  for (const req of requests) {
    const spend = getEffectiveSpend(req);
    const spender = (req.requesterName || req.userId)?.trim();
    if (spender) {
      spenders.add(spender.toLowerCase());
    }

    if (CLEARED_STATUSES.has(req.status)) {
      teamTotalClearedSpend += spend;
    } else if (PENDING_COMMITMENT_STATUSES.has(req.status)) {
      teamPendingApprovals += spend;
    }
  }

  const health = computeManagerApprovalHealth(requests);

  return {
    teamTotalClearedSpend,
    teamPendingApprovals,
    avgReviewDays: health.avgReviewDays,
    activeSpendersCount: spenders.size,
    totalTeamTrips: requests.length,
  };
}

export function computeManagerMonthlyBurnSeries(
  requests: TravelRequest[],
  referenceDate: Date = new Date()
): ManagerMonthlyBurnPoint[] {
  const months: ManagerMonthlyBurnPoint[] = [];

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
    if (CLEARED_STATUSES.has(req.status) || req.status === 'APPROVED' || req.status === 'PENDING_ADMIN_APPROVAL') {
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

export function computeManagerCategoryShares(requests: TravelRequest[]): ManagerCategoryShare[] {
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

  const results: ManagerCategoryShare[] = [];

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

export function computeManagerApprovalHealth(
  requests: TravelRequest[]
): ManagerApprovalHealth {
  let forwardedCount = 0;
  let pendingManagerCount = 0;
  let returnedCount = 0;
  let totalReviewDays = 0;
  let reviewCount = 0;

  for (const req of requests) {
    if (
      req.status === 'PENDING_ADMIN_APPROVAL' ||
      req.status === 'APPROVED' ||
      req.status === 'SETTLED'
    ) {
      forwardedCount += 1;
    } else if (req.status === 'PENDING_MANAGER_REVIEW') {
      pendingManagerCount += 1;
    } else if (
      req.status === 'REVISION_REQUESTED_BY_MANAGER' ||
      req.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' ||
      req.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
    ) {
      returnedCount += 1;
    }

    // Measure review duration from creation to managerReview/updatedAt
    const reviewDate = req.managerReviewedAt || (req.status !== 'PENDING_MANAGER_REVIEW' ? req.updatedAt : null);
    if (reviewDate && req.createdAt) {
      const start = new Date(req.createdAt).getTime();
      const end = new Date(reviewDate).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        const days = Math.round(((end - start) / (1000 * 60 * 60 * 24)) * 10) / 10;
        totalReviewDays += Math.max(0.1, days);
        reviewCount += 1;
      }
    }
  }

  const totalActioned = forwardedCount + returnedCount;
  const totalRelevant = totalActioned + pendingManagerCount;
  const approvalRatePct = totalRelevant > 0
    ? Math.round((forwardedCount / totalRelevant) * 100)
    : 100;

  const avgReviewDays = reviewCount > 0
    ? Math.round((totalReviewDays / reviewCount) * 10) / 10
    : null;

  return {
    forwardedCount,
    pendingManagerCount,
    returnedCount,
    avgReviewDays,
    approvalRatePct,
  };
}

export function computeManagerSpendersAndProjectVelocity(
  requests: TravelRequest[]
): ManagerSpendersAndProjectVelocity {
  const memberMap = new Map<string, MemberSpendItem>();
  const projectMap = new Map<string, ProjectSpendItem>();

  for (const req of requests) {
    const spend = getEffectiveSpend(req);
    const isApproved =
      req.status === 'APPROVED' ||
      req.status === 'SETTLED' ||
      req.status === 'PENDING_ADMIN_APPROVAL';

    // Group by Member
    const memberName = req.requesterName?.trim() || req.userId || 'Team Member';
    const mExisting = memberMap.get(memberName) || {
      name: memberName,
      tripCount: 0,
      totalSpend: 0,
      approvedSpend: 0,
    };
    mExisting.tripCount += 1;
    mExisting.totalSpend += spend;
    if (isApproved) {
      mExisting.approvedSpend += spend;
    }
    memberMap.set(memberName, mExisting);

    // Group by Project
    const projectCode = req.projectCode?.trim() || 'General / Unassigned';
    const pExisting = projectMap.get(projectCode) || {
      code: projectCode,
      tripCount: 0,
      totalSpend: 0,
    };
    pExisting.tripCount += 1;
    pExisting.totalSpend += spend;
    projectMap.set(projectCode, pExisting);
  }

  const byMember = Array.from(memberMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  const byProject = Array.from(projectMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);

  return { byMember, byProject };
}
