import type {
  DepartmentBudget,
  FiscalQuarter,
  TravelRequest,
} from '../types/travel.types';

export interface CorporateLedgerStats {
  totalPool: number;
  totalCommitted: number;
  totalHeadroom: number;
  utilizationPct: number;
  approvedSpend: number;
  pendingCommitments: number;
  approvedPct: number;
  pendingPct: number;
  atRiskCount: number;
  configuredCount: number;
  topAtRiskPool: DepartmentBudget | null;
}

export interface MonthlyBurnPoint {
  monthKey: string;
  label: string;
  approved: number;
  pending: number;
}

export interface MemberSpendSummary {
  name: string;
  tripCount: number;
  approvedSpend: number;
  pendingSpend: number;
  totalSpend: number;
}

export interface TopTripSummary {
  id: string;
  title: string;
  destination: string;
  requesterName: string;
  travelType: 'UPCOMING' | 'ALREADY_TRAVELLED';
  status: string;
  totalExpenses: number;
}

export interface DepartmentDrilldown {
  upcomingTotal: number;
  claimsTotal: number;
  upcomingPct: number;
  claimsPct: number;
  topMembers: MemberSpendSummary[];
  topTrips: TopTripSummary[];
}

const APPROVED_STATUSES = new Set(['APPROVED', 'SETTLED']);
const PENDING_STATUSES = new Set([
  'PENDING_MANAGER_REVIEW',
  'PENDING_ADMIN_APPROVAL',
  'REVISION_REQUESTED_BY_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
  'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
]);

export function filterBudgetsForPeriod(
  budgets: DepartmentBudget[],
  year: number,
  quarter: FiscalQuarter
): DepartmentBudget[] {
  const exact = budgets.filter(
    (b) => b.fiscalYear === year && b.fiscalQuarter === quarter
  );
  return exact.length > 0 ? exact : budgets;
}

export function computeCorporateLedgerStats(
  budgets: DepartmentBudget[],
  requests: TravelRequest[],
  year: number,
  quarter: FiscalQuarter
): CorporateLedgerStats {
  const periodBudgets = filterBudgetsForPeriod(budgets, year, quarter);

  let totalPool = 0;
  let totalCommitted = 0;
  let atRiskCount = 0;
  let topAtRiskPool: DepartmentBudget | null = null;

  for (const b of periodBudgets) {
    totalPool += Number(b.totalAllocation || 0);
    totalCommitted += Number(b.utilizedAmount || 0);
    if (b.utilizationPercentage > 85) {
      atRiskCount += 1;
      if (!topAtRiskPool || b.utilizationPercentage > topAtRiskPool.utilizationPercentage) {
        topAtRiskPool = b;
      }
    }
  }

  let approvedSpend = 0;
  let pendingCommitments = 0;
  for (const req of requests) {
    const amt = Number(req.totalExpenses || 0);
    if (APPROVED_STATUSES.has(req.status)) approvedSpend += amt;
    else if (PENDING_STATUSES.has(req.status)) pendingCommitments += amt;
  }

  const totalHeadroom = Math.max(0, totalPool - totalCommitted);
  const utilizationPct = totalPool > 0 ? (totalCommitted / totalPool) * 100 : 0;

  const totalReqActivity = approvedSpend + pendingCommitments;
  const approvedPct =
    totalPool > 0 && totalReqActivity > 0
      ? Math.min(utilizationPct, (approvedSpend / Math.max(totalPool, totalReqActivity)) * 100)
      : utilizationPct;
  const pendingPct = Math.max(0, Math.min(100 - approvedPct, utilizationPct - approvedPct));

  return {
    totalPool,
    totalCommitted,
    totalHeadroom,
    utilizationPct,
    approvedSpend,
    pendingCommitments,
    approvedPct,
    pendingPct,
    atRiskCount,
    configuredCount: periodBudgets.length,
    topAtRiskPool,
  };
}

export function computeMonthlyBurnSeries(
  requests: TravelRequest[],
  department: string,
  referenceDate: Date = new Date()
): MonthlyBurnPoint[] {
  const deptLower = department.trim().toLowerCase();
  const months: MonthlyBurnPoint[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    months.push({ monthKey, label, approved: 0, pending: 0 });
  }

  const map = new Map(months.map((m) => [m.monthKey, m]));

  for (const req of requests) {
    const reqDept = (req.requesterDepartment || '').trim().toLowerCase();
    if (deptLower && reqDept && reqDept !== deptLower) continue;

    const dateStr = req.departureDate || req.createdAt;
    const parsed = dateStr ? new Date(dateStr) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) continue;

    const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const bucket = map.get(key);
    if (!bucket) continue;

    const amt = Number(req.totalExpenses || 0);
    if (APPROVED_STATUSES.has(req.status)) bucket.approved += amt;
    else if (PENDING_STATUSES.has(req.status)) bucket.pending += amt;
  }

  return months;
}

export function computeDepartmentDrilldown(
  requests: TravelRequest[],
  department: string
): DepartmentDrilldown {
  const deptLower = department.trim().toLowerCase();
  const deptRequests = requests.filter((req) => {
    const reqDept = (req.requesterDepartment || '').trim().toLowerCase();
    return !deptLower || !reqDept || reqDept === deptLower;
  });

  let upcomingTotal = 0;
  let claimsTotal = 0;
  const memberMap = new Map<string, MemberSpendSummary>();
  const topTrips: TopTripSummary[] = [];

  for (const req of deptRequests) {
    const isApproved = APPROVED_STATUSES.has(req.status);
    const isPending = PENDING_STATUSES.has(req.status);
    if (!isApproved && !isPending) continue;

    const amt = Number(req.totalExpenses || 0);
    if (req.travelType === 'UPCOMING') upcomingTotal += amt;
    else claimsTotal += amt;

    const name = req.requesterName || 'Team Member';
    const existing = memberMap.get(name) || {
      name,
      tripCount: 0,
      approvedSpend: 0,
      pendingSpend: 0,
      totalSpend: 0,
    };
    existing.tripCount += 1;
    if (isApproved) existing.approvedSpend += amt;
    if (isPending) existing.pendingSpend += amt;
    existing.totalSpend += amt;
    memberMap.set(name, existing);

    topTrips.push({
      id: req.id,
      title: req.title,
      destination: req.destination,
      requesterName: name,
      travelType: req.travelType,
      status: req.status,
      totalExpenses: amt,
    });
  }

  const combined = upcomingTotal + claimsTotal;
  const upcomingPct = combined > 0 ? Math.round((upcomingTotal / combined) * 100) : 0;
  const claimsPct = combined > 0 ? 100 - upcomingPct : 0;

  const topMembers = Array.from(memberMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  topTrips.sort((a, b) => b.totalExpenses - a.totalExpenses);

  return {
    upcomingTotal,
    claimsTotal,
    upcomingPct,
    claimsPct,
    topMembers,
    topTrips: topTrips.slice(0, 8),
  };
}
