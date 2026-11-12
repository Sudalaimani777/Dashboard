import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  Search,
  Download,
  Plane,
  Receipt,
  FolderKanban,
} from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { CategorySpendBreakdownCard } from './employee/CategorySpendBreakdownCard';
import {
  DraftReadinessSummaryCard,
  PolicyChecklistCard,
  RecentActivityFeedCard,
  RecentTripsSnapshotCard,
  ResolvedRevisionsCard,
  RevisionWorkflowGuideCard,
} from './employee/EmployeeSidebarPanels';
import { formatINR } from '../utils/currency';
import {
  aggregateRequestsCategorySpend,
  computeDraftReadiness,
  exportRequestsToCsv,
} from '../utils/travelAnalytics';
import type { TravelRequest } from '../types/travel.types';

export interface EmployeeTravelPortalProps {
  activeTab?: string;
}

type TypeFilter = 'ALL' | 'UPCOMING' | 'ALREADY_TRAVELLED';
type PastStatusFilter = 'ALL' | 'APPROVED' | 'SETTLED' | 'OTHER';

export const EmployeeTravelPortal: React.FC<EmployeeTravelPortalProps> = ({
  activeTab = 'present',
}) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { requests, loadRequests } = useTravel();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [pastStatusFilter, setPastStatusFilter] = useState<PastStatusFilter>('ALL');

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      if (typeFilter !== 'ALL' && r.travelType !== typeFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery, typeFilter]);

  const presentRequests = useMemo(
    () =>
      filteredRequests.filter((r) =>
        ['SUBMITTED', 'PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'].includes(r.status)
      ),
    [filteredRequests]
  );

  const revisionRequests = useMemo(
    () => filteredRequests.filter((r) => r.status.includes('REVISION_REQUESTED')),
    [filteredRequests]
  );

  const draftRequests = useMemo(
    () => filteredRequests.filter((r) => r.status === 'DRAFT'),
    [filteredRequests]
  );

  const pastRequests = useMemo(
    () =>
      filteredRequests.filter((r) =>
        ['SETTLED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(r.status)
      ),
    [filteredRequests]
  );

  const displayedPastRequests = useMemo(() => {
    if (pastStatusFilter === 'ALL') return pastRequests;
    if (pastStatusFilter === 'APPROVED') return pastRequests.filter((r) => r.status === 'APPROVED');
    if (pastStatusFilter === 'SETTLED') return pastRequests.filter((r) => r.status === 'SETTLED');
    return pastRequests.filter((r) => ['REJECTED', 'CANCELLED'].includes(r.status));
  }, [pastRequests, pastStatusFilter]);

  // All-requests metrics (unfiltered by search for accurate KPI summary)
  const allActive = useMemo(
    () =>
      requests.filter((r) =>
        ['SUBMITTED', 'PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'].includes(r.status)
      ),
    [requests]
  );
  const allRevisions = useMemo(
    () => requests.filter((r) => r.status.includes('REVISION_REQUESTED')),
    [requests]
  );
  const allDrafts = useMemo(() => requests.filter((r) => r.status === 'DRAFT'), [requests]);
  const allPast = useMemo(
    () =>
      requests.filter((r) =>
        ['SETTLED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(r.status)
      ),
    [requests]
  );

  const nonDraftRequests = useMemo(() => requests.filter((r) => r.status !== 'DRAFT'), [requests]);
  const totalSpent = useMemo(
    () => nonDraftRequests.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [nonDraftRequests]
  );
  const categoryBreakdown = useMemo(
    () => aggregateRequestsCategorySpend(nonDraftRequests),
    [nonDraftRequests]
  );

  const hasActiveFilter = Boolean(searchQuery.trim() || typeFilter !== 'ALL');

  const recentNonActive = useMemo(
    () =>
      filteredRequests
        .filter((r) => !['SUBMITTED', 'PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'].includes(r.status))
        .slice(0, 4),
    [filteredRequests]
  );

  const pastCategoryBreakdown = useMemo(
    () => aggregateRequestsCategorySpend(allPast),
    [allPast]
  );

  const projectSummaries = useMemo(() => {
    const map = new Map<string, { code: string; trips: number; total: number; routes: Set<string> }>();
    for (const req of allPast) {
      const code = req.projectCode || 'GENERAL';
      const entry = map.get(code) || { code, trips: 0, total: 0, routes: new Set<string>() };
      entry.trips += 1;
      entry.total += Number(req.totalExpenses) || 0;
      if (req.destination && req.destination !== 'TBD') {
        entry.routes.add(req.destination);
      }
      map.set(code, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [allPast]);

  const approvedTrips = allPast.filter((r) => r.status === 'APPROVED');
  const settledTrips = allPast.filter((r) => r.status === 'SETTLED');
  const clearedCount = approvedTrips.length + settledTrips.length;
  const avgTripSpend = clearedCount > 0 ? totalSpent / clearedCount : 0;

  const managerReviewCount = allActive.filter((r) => r.status === 'PENDING_MANAGER_REVIEW').length;
  const adminApprovalCount = allActive.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL').length;

  const managerReturnedCount = allRevisions.filter(
    (r) => r.status === 'REVISION_REQUESTED_BY_MANAGER'
  ).length;
  const adminReturnedCount = allRevisions.filter((r) => r.status.includes('ADMIN')).length;
  const resubmittedCount = allActive.filter((r) =>
    Boolean(r.timeline?.some((ev) => String(ev.toStatus || ev.to_status || '').includes('REVISION')))
  ).length;
  const firstPassRate = useMemo(() => {
    if (allPast.length === 0) return '100%';
    const clean = allPast.filter(
      (r) => !r.timeline?.some((ev) => String(ev.toStatus || ev.to_status || '').includes('REVISION'))
    ).length;
    return `${Math.round((clean / allPast.length) * 100)}%`;
  }, [allPast]);

  const draftTotalValue = useMemo(
    () => allDrafts.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [allDrafts]
  );
  const readyDraftsCount = useMemo(
    () => allDrafts.filter((r) => computeDraftReadiness(r).isReady).length,
    [allDrafts]
  );

  const settledAmount = settledTrips.reduce((s, r) => s + (Number(r.totalExpenses) || 0), 0);
  const approvedPendingSettlement = approvedTrips.reduce(
    (s, r) => s + (Number(r.totalExpenses) || 0),
    0
  );

  const handleCloneTrip = (req: TravelRequest) => {
    navigate(`/travel/new?clone=${req.id}`);
  };

  const quickLaunchActions = (
    <>
      <button
        type="button"
        onClick={() => navigate('/travel/new?type=UPCOMING')}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Plane className="size-3.5" /> Plan Upcoming Trip
      </button>
      <button
        type="button"
        onClick={() => navigate('/travel/new?type=ALREADY_TRAVELLED')}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Receipt className="size-3.5 text-primary" /> Claim Past Travel
      </button>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Page Header + Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {activeTab === 'revisions'
              ? 'Action Required: Revisions'
              : activeTab === 'drafts'
              ? 'Travel Drafts'
              : activeTab === 'past'
              ? 'Past Travel History'
              : 'My Travel Dashboard'}
          </h1>
          <p className="text-xs text-muted">
            {activeTab === 'revisions'
              ? 'Trips requiring updated quotes or receipts before returning to your Line Manager.'
              : activeTab === 'drafts'
              ? 'Saved unsubmitted travel requests and cloneable past trips.'
              : activeTab === 'past'
              ? 'Concluded company travel, category analytics, and reimbursement settlement status.'
              : 'Track active travel requests, attention items, and spend insights.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, city, project..."
              aria-label="Search travel requests"
              className="pl-8 pr-3 py-2 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint w-48 sm:w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>

          <div className="inline-flex rounded-lg border border-border-warm bg-surface p-0.5 text-[11px]">
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'UPCOMING', label: 'Upcoming' },
                { id: 'ALREADY_TRAVELLED', label: 'Claims' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={typeFilter === opt.id}
                onClick={() => setTypeFilter(opt.id)}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  typeFilter === opt.id
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-5"
      >

      {/* TAB 1: PRESENT / DASHBOARD */}
      {activeTab === 'present' && (
        <>
          <TravelMetricsGrid
            metrics={[
              {
                label: 'Active / In Review',
                value: allActive.length,
                subtext: 'Currently in approval pipeline',
                pills: [
                  { label: 'Manager', value: managerReviewCount },
                  { label: 'Admin', value: adminApprovalCount },
                ],
              },
              {
                label: 'Needs Attention',
                value: allRevisions.length + allDrafts.length,
                subtext:
                  allRevisions.length > 0
                    ? 'Revisions awaiting your update'
                    : 'Saved drafts & action items',
                tone: allRevisions.length > 0 ? 'amber' : 'default',
                badge: allRevisions.length > 0 ? 'Fix Required' : undefined,
                pills: [
                  { label: 'Revisions', value: allRevisions.length },
                  { label: 'Drafts', value: allDrafts.length },
                ],
                onClick: () =>
                  navigate(allRevisions.length > 0 ? '/dashboard?tab=revisions' : '/dashboard?tab=drafts'),
              },
              {
                label: 'Settled / Approved',
                value: clearedCount,
                subtext:
                  clearedCount > 0
                    ? `Avg ${formatINR(avgTripSpend)} per trip`
                    : 'No completed trips yet',
                pills: [
                  { label: 'Approved', value: approvedTrips.length },
                  { label: 'Settled', value: settledTrips.length },
                ],
                onClick: () => navigate('/dashboard?tab=past'),
              },
              {
                label: 'Total Expenditure',
                value: formatINR(totalSpent),
                isCurrency: true,
                subtext: `${nonDraftRequests.length} submitted request(s) · INR`,
                progressSegments: categoryBreakdown.categories.map((c) => ({
                  label: c.shortLabel,
                  percentage: c.percentage,
                  color: c.color,
                })),
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-5">
              <TravelRequestsTable
                title="Active Travel Requests"
                requests={presentRequests}
                onAction={(req) => navigate(`/travel/requests/${req.id}`)}
                compactEmpty
                emptyMessage="No active travel requests in review."
                emptyDescription="Start a new pre-trip authorization or submit a post-trip reimbursement claim below."
                emptyAction={quickLaunchActions}
              />

              <RecentTripsSnapshotCard
                title="Recent Trips & Saved Work"
                subtitle="Latest completed trips, drafts, and returned requests for quick access"
                requests={recentNonActive}
                actionLabel="Inspect"
                emptyMessage={
                  hasActiveFilter
                    ? 'No recent trips match your current search or filter.'
                    : undefined
                }
                onAction={(req) =>
                  navigate(
                    req.status === 'DRAFT' || req.status.includes('REVISION')
                      ? `/travel/requests/${req.id}/edit`
                      : `/travel/requests/${req.id}?tab=past`
                  )
                }
                onFooterClick={() => navigate('/dashboard?tab=past')}
                footerLabel="View Past History"
              />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-5">
              <CategorySpendBreakdownCard
                title="My Expense Mix"
                subtitle="Breakdown across submitted & cleared trips"
                totalSpend={categoryBreakdown.totalSpend}
                categories={categoryBreakdown.categories}
              />
              <RecentActivityFeedCard
                requests={requests}
                onInspect={(req) => navigate(`/travel/requests/${req.id}`)}
              />
              <PolicyChecklistCard />
            </div>
          </div>
        </>
      )}

      {/* TAB 2: REVISIONS */}
      {activeTab === 'revisions' && (
        <>
          <TravelMetricsGrid
            metrics={[
              {
                label: 'Pending Your Fix',
                value: allRevisions.length,
                subtext: 'Requires updated quotes or receipts',
                tone: allRevisions.length > 0 ? 'amber' : 'default',
                pills: [
                  { label: 'Manager', value: managerReturnedCount },
                  { label: 'Admin', value: adminReturnedCount },
                ],
              },
              {
                label: 'Resubmitted / In Re-Review',
                value: resubmittedCount,
                subtext: 'Previously revised, awaiting sign-off',
              },
              {
                label: 'First-Pass Approval Rate',
                value: firstPassRate,
                subtext: `${allPast.length} concluded request(s) evaluated`,
              },
            ]}
          />

          {revisionRequests.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-700 shrink-0" />
                <div className="text-xs text-ink">
                  <strong>{revisionRequests.length} request(s) require your revisions.</strong>{' '}
                  Resubmissions strictly return to your Line Manager for verification.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-5">
              <TravelRequestsTable
                title="Requests Awaiting Revision"
                requests={revisionRequests}
                actionLabel="Fix & Resubmit"
                showRemarksPreview
                compactEmpty
                onAction={(req) => navigate(`/travel/requests/${req.id}/edit?tab=revisions`)}
                emptyMessage="All clear. No requests currently require revisions."
                emptyDescription="When a Line Manager or Corporate Admin returns a trip for corrections, their exact remarks and a Fix & Resubmit button will appear here."
                emptyAction={
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard?tab=present')}
                    className="px-3.5 py-2 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-xs font-semibold text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
                  >
                    Back to Active Dashboard
                  </button>
                }
              />

              <ResolvedRevisionsCard
                requests={filteredRequests}
                onInspect={(req) => navigate(`/travel/requests/${req.id}?tab=revisions`)}
              />
            </div>

            <div className="lg:col-span-4">
              <RevisionWorkflowGuideCard />
            </div>
          </div>
        </>
      )}

      {/* TAB 3: DRAFTS */}
      {activeTab === 'drafts' && (
        <>
          <TravelMetricsGrid
            metrics={[
              {
                label: 'Saved Drafts',
                value: allDrafts.length,
                subtext: 'Unsubmitted requests saved locally',
                pills: [
                  {
                    label: 'Upcoming',
                    value: allDrafts.filter((d) => d.travelType === 'UPCOMING').length,
                  },
                  {
                    label: 'Claims',
                    value: allDrafts.filter((d) => d.travelType === 'ALREADY_TRAVELLED').length,
                  },
                ],
              },
              {
                label: 'Unsubmitted Claim Value',
                value: formatINR(draftTotalValue),
                isCurrency: true,
                subtext: 'Estimated total across saved drafts',
              },
              {
                label: 'Submission Readiness',
                value: `${readyDraftsCount} / ${allDrafts.length}`,
                subtext:
                  allDrafts.length === 0
                    ? 'Save a draft anytime while creating a trip'
                    : 'Drafts passing all pre-submit checks',
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 flex flex-col gap-5">
              <TravelRequestsTable
                title="Saved Travel Drafts"
                requests={draftRequests}
                actionLabel="Resume Draft"
                compactEmpty
                onAction={(req) => navigate(`/travel/requests/${req.id}/edit?tab=drafts`)}
                emptyMessage="You have no saved travel drafts."
                emptyDescription="Start a new upcoming trip or post-trip reimbursement and click Save as Draft at any point to finish later."
                emptyAction={quickLaunchActions}
              />

              <RecentTripsSnapshotCard
                title="Clone from Past Trips"
                subtitle="Duplicate route, project code, and emergency contact into a fresh request"
                requests={pastRequests.slice(0, 4)}
                actionLabel="Clone as Draft"
                emptyMessage={
                  hasActiveFilter ? 'No past trips match your current search or filter.' : undefined
                }
                onAction={handleCloneTrip}
              />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-5">
              <DraftReadinessSummaryCard
                drafts={allDrafts}
                onResume={(req) => navigate(`/travel/requests/${req.id}/edit?tab=drafts`)}
              />
              <PolicyChecklistCard
                title="Before Submitting a Draft"
                items={[
                  'Confirm origin, destination, and departure/return dates.',
                  'Include at least one itemized expense greater than ₹0.',
                  'Verify your supporting quotation or receipt link opens cleanly.',
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* TAB 4: PAST HISTORY */}
      {activeTab === 'past' && (
        <>
          <TravelMetricsGrid
            metrics={[
              {
                label: 'Concluded Trips',
                value: allPast.length,
                subtext: 'Completed, approved, or closed',
                pills: [
                  { label: 'Approved', value: approvedTrips.length },
                  { label: 'Settled', value: settledTrips.length },
                  {
                    label: 'Closed',
                    value: allPast.filter((r) => ['REJECTED', 'CANCELLED'].includes(r.status)).length,
                  },
                ],
              },
              {
                label: 'Total Archive Spend',
                value: formatINR(allPast.reduce((s, r) => s + (Number(r.totalExpenses) || 0), 0)),
                isCurrency: true,
                subtext:
                  allPast.length > 0
                    ? `Avg ${formatINR(
                        allPast.reduce((s, r) => s + (Number(r.totalExpenses) || 0), 0) / allPast.length
                      )} / trip`
                    : 'No concluded spend',
              },
              {
                label: 'Settlement Tracker',
                value: formatINR(settledAmount),
                subtext: `Pending settlement: ${formatINR(approvedPendingSettlement)}`,
              },
              {
                label: 'Top Project Code',
                value: projectSummaries[0]?.code || 'None',
                subtext: projectSummaries[0]
                  ? `${projectSummaries[0].trips} trip(s) · ${formatINR(projectSummaries[0].total)}`
                  : 'No project trips yet',
              },
            ]}
          />

          <TravelRequestsTable
            title="Concluded & Settled Trips"
            requests={displayedPastRequests}
            onAction={(req) => navigate(`/travel/requests/${req.id}?tab=past`)}
            secondaryAction={{
              label: 'Clone',
              onClick: handleCloneTrip,
            }}
            compactEmpty
            emptyMessage="No completed or settled trips match this filter."
            emptyDescription="Try clearing your search or status filter to view all archived company travel."
            headerActions={
              <>
                <div className="inline-flex rounded-lg border border-border-warm bg-surface p-0.5 text-[11px]">
                  {(
                    [
                      { id: 'ALL', label: 'All' },
                      { id: 'APPROVED', label: 'Approved' },
                      { id: 'SETTLED', label: 'Settled' },
                      { id: 'OTHER', label: 'Closed' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={pastStatusFilter === tab.id}
                      onClick={() => setPastStatusFilter(tab.id)}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                        pastStatusFilter === tab.id
                          ? 'bg-primary text-white'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={displayedPastRequests.length === 0}
                  onClick={() => exportRequestsToCsv(displayedPastRequests, 'my-travel-history.csv')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-xs font-semibold text-ink disabled:opacity-40 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Download className="size-3.5 text-primary" /> Export CSV
                </button>
              </>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-6">
              <CategorySpendBreakdownCard
                title="Archive Spend by Category"
                subtitle="Real itemized distribution across your concluded trips"
                totalSpend={pastCategoryBreakdown.totalSpend}
                categories={pastCategoryBreakdown.categories}
                emptyMessage="No itemized expense rows found on concluded trips."
              />
            </div>

            <div className="lg:col-span-6">
              <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3.5">
                <div className="flex items-center justify-between border-b border-border-warm pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                      <FolderKanban className="size-4 text-primary" /> Project & Destination Summary
                    </h3>
                    <p className="text-[11px] text-muted mt-0.5">
                      Spend allocation grouped by project code
                    </p>
                  </div>
                </div>

                {projectSummaries.length === 0 ? (
                  <p className="text-xs text-muted py-4 text-center">
                    Project-wise summaries will appear once trips are concluded.
                  </p>
                ) : (
                  <div className="divide-y divide-border-warm/80">
                    {projectSummaries.map((proj) => (
                      <div
                        key={proj.code}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-ink">{proj.code}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-subtle border border-border-warm text-muted font-semibold">
                              {proj.trips} trip{proj.trips > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted truncate mt-1">
                            Destinations: {Array.from(proj.routes).join(', ') || 'None'}
                          </p>
                        </div>
                        <span className="text-sm font-mono font-bold tabular-nums text-primary shrink-0">
                          {formatINR(proj.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      </motion.div>
    </div>
  );
};
