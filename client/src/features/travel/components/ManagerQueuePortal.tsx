import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, Search, Download, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { CategorySpendBreakdownCard } from './employee/CategorySpendBreakdownCard';
import {
  DraftReadinessSummaryCard,
  PolicyChecklistCard,
  RecentActivityFeedCard,
} from './employee/EmployeeSidebarPanels';
import {
  TeamDecisionBreakdownCard,
  TeamPipelineSummaryCard,
  WaitingOnEmployeeCard,
} from './manager/ManagerSidebarPanels';
import { formatINR } from '../utils/currency';
import { aggregateRequestsCategorySpend, exportRequestsToCsv } from '../utils/travelAnalytics';
import {
  classifyManagerQueue,
  filterManagerRequests,
  type ManagerHistoryBucket,
  type ManagerTypeFilter,
} from '../utils/managerQueue';

export interface ManagerQueuePortalProps {
  activeTab?: string;
}

const HISTORY_BUCKET_OPTIONS: Array<{ id: ManagerHistoryBucket; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'AWAITING_ADMIN', label: 'Awaiting Admin' },
  { id: 'WAITING_EMPLOYEE', label: 'Waiting on Employee' },
  { id: 'APPROVED_SETTLED', label: 'Approved & Settled' },
  { id: 'REJECTED_CANCELLED', label: 'Rejected & Cancelled' },
];

export const ManagerQueuePortal: React.FC<ManagerQueuePortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { managerQueue, requests, loadManagerQueue, loadRequests } = useTravel();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ManagerTypeFilter>('ALL');
  const [historyBucket, setHistoryBucket] = useState<ManagerHistoryBucket>('ALL');

  useEffect(() => {
    loadManagerQueue();
    loadRequests();
  }, [loadManagerQueue, loadRequests]);

  const classified = useMemo(
    () => classifyManagerQueue(managerQueue, user?.id),
    [managerQueue, user?.id]
  );

  const pendingRequests = useMemo(
    () => filterManagerRequests(classified.initialAudit, { query: searchQuery, typeFilter }),
    [classified.initialAudit, searchQuery, typeFilter]
  );

  const resubmittedRequests = useMemo(
    () => filterManagerRequests(classified.revisions, { query: searchQuery, typeFilter }),
    [classified.revisions, searchQuery, typeFilter]
  );

  const historyRequests = useMemo(
    () =>
      filterManagerRequests(classified.teamHistoryAndTracking, {
        query: searchQuery,
        typeFilter,
        statusBucket: historyBucket,
      }),
    [classified.teamHistoryAndTracking, searchQuery, typeFilter, historyBucket]
  );

  const awaitingAdminCount = useMemo(
    () =>
      classified.teamHistoryAndTracking.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL').length,
    [classified.teamHistoryAndTracking]
  );

  const personalRevisionRequests = useMemo(
    () =>
      filterManagerRequests(
        requests.filter((r) => r.status.includes('REVISION_REQUESTED')),
        { query: searchQuery, typeFilter }
      ),
    [requests, searchQuery, typeFilter]
  );

  const personalSubmittedRequests = useMemo(
    () =>
      filterManagerRequests(
        requests.filter((r) => r.status !== 'DRAFT' && !r.status.includes('REVISION_REQUESTED')),
        { query: searchQuery, typeFilter }
      ),
    [requests, searchQuery, typeFilter]
  );

  const personalDraftRequests = useMemo(
    () =>
      filterManagerRequests(
        requests.filter((r) => r.status === 'DRAFT'),
        { query: searchQuery, typeFilter }
      ),
    [requests, searchQuery, typeFilter]
  );

  const queueTotal = useMemo(
    () => classified.initialAudit.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [classified.initialAudit]
  );

  const teamCategorySpend = useMemo(
    () => aggregateRequestsCategorySpend(classified.teamQueue),
    [classified.teamQueue]
  );

  const historyCategorySpend = useMemo(
    () => aggregateRequestsCategorySpend(classified.teamHistoryAndTracking),
    [classified.teamHistoryAndTracking]
  );

  const personalCategorySpend = useMemo(
    () => aggregateRequestsCategorySpend(requests.filter((r) => r.status !== 'DRAFT')),
    [requests]
  );

  const allPersonalDrafts = useMemo(
    () => requests.filter((r) => r.status === 'DRAFT'),
    [requests]
  );

  const hasActiveFilter = Boolean(
    searchQuery.trim() || typeFilter !== 'ALL' || (activeTab === 'past' && historyBucket !== 'ALL')
  );

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setHistoryBucket('ALL');
  };

  const handleNavigatePipeline = (tabId: string, bucket?: ManagerHistoryBucket) => {
    if (bucket) {
      setHistoryBucket(bucket);
    } else if (tabId === 'past') {
      setHistoryBucket('ALL');
    }
    navigate(`/dashboard?tab=${tabId}`);
  };

  const isPersonalTab = activeTab === 'personal' || activeTab === 'drafts';
  const departmentLabel = user?.department || 'your department';

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Header + Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {activeTab === 'personal'
              ? 'My Personal Travel'
              : activeTab === 'drafts'
              ? 'Travel Drafts'
              : activeTab === 'revisions'
              ? 'Resubmitted Team Requests'
              : activeTab === 'past'
              ? 'Team Tracking & Approvals History'
              : 'Line Manager Audit Queue'}
          </h1>
          <p className="text-xs text-muted">
            {activeTab === 'personal'
              ? `Manage your own corporate trips for ${departmentLabel}.`
              : activeTab === 'drafts'
              ? 'Saved unsubmitted personal travel requests.'
              : activeTab === 'revisions'
              ? 'Team resubmissions and Admin directives awaiting your verification.'
              : activeTab === 'past'
              ? 'Track requests forwarded to Admin, pending employee edits, and final decisions.'
              : 'Tier 1 operational necessity and expense review of direct reports.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isPersonalTab
                  ? 'Search title, city, project...'
                  : 'Search requester, title, city...'
              }
              aria-label="Search travel requests"
              className="pl-8 pr-3 py-2 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint w-48 sm:w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>

          <div
            role="group"
            aria-label="Filter by trip type"
            className="inline-flex rounded-lg border border-border-warm bg-surface p-0.5 text-[11px]"
          >
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
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  typeFilter === opt.id
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Reset
            </button>
          )}

          {activeTab === 'past' && historyRequests.length > 0 && (
            <button
              type="button"
              onClick={() => exportRequestsToCsv(historyRequests, 'team-travel-history.csv')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Download className="size-3.5 text-primary" /> Export CSV
            </button>
          )}

          {isPersonalTab && (
            <button
              type="button"
              onClick={() => navigate('/travel/new?tab=personal')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Plus className="size-4" /> Submit My Travel
            </button>
          )}
        </div>
      </div>

      {/* Animated Tab Body */}
      <motion.div
        key={activeTab}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-5"
      >
        {activeTab === 'present' && (
          <>
            <TravelMetricsGrid
              metrics={[
                {
                  label: 'Pending Audit',
                  value: classified.initialAudit.length,
                  subtext: 'Direct reports awaiting review',
                },
                {
                  label: 'Team Revisions',
                  value: classified.revisions.length,
                  subtext: 'Admin directives & resubmissions',
                  tone: classified.revisions.length > 0 ? 'amber' : 'default',
                  onClick: () => navigate('/dashboard?tab=revisions'),
                },
                {
                  label: 'Awaiting Admin',
                  value: awaitingAdminCount,
                  subtext: 'Forwarded for Tier 2 clearance',
                  onClick: () => handleNavigatePipeline('past', 'AWAITING_ADMIN'),
                },
                {
                  label: 'Total Queue Value',
                  value: formatINR(queueTotal),
                  isCurrency: true,
                  subtext: 'Initial audit commitments',
                },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <TravelRequestsTable
                  title="Direct Reports Awaiting Initial Audit"
                  requests={pendingRequests}
                  showRequester
                  actionLabel="Audit Proofs"
                  onAction={(req) => navigate(`/travel/audit/${req.id}`)}
                  compactEmpty={classified.teamQueue.length > 0}
                  emptyMessage={
                    hasActiveFilter
                      ? 'No pending direct report audits match your current filters.'
                      : 'All direct report submissions are up to date.'
                  }
                  emptyDescription={
                    hasActiveFilter
                      ? 'Try clearing the search term or trip filter to view all queued requests.'
                      : 'Use Refresh to check for newly submitted direct report requests.'
                  }
                  emptyAction={
                    hasActiveFilter ? (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="px-3 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        Reset filters
                      </button>
                    ) : undefined
                  }
                />
              </div>

              <aside className="lg:col-span-4 flex flex-col gap-4">
                <TeamPipelineSummaryCard
                  classified={classified}
                  onNavigateTab={handleNavigatePipeline}
                />
                <CategorySpendBreakdownCard
                  title="Team Spend Mix"
                  subtitle="Across submitted team requests"
                  totalSpend={teamCategorySpend.totalSpend}
                  categories={teamCategorySpend.categories}
                  emptyMessage="Category mix appears once team members submit expenses."
                />
              </aside>
            </div>
          </>
        )}

        {activeTab === 'revisions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <TravelRequestsTable
                title="Team Revisions & Admin Directives"
                requests={resubmittedRequests}
                showRequester
                showRemarksPreview
                actionLabel="Audit & Action"
                onAction={(req) => navigate(`/travel/audit/${req.id}?tab=revisions`)}
                compactEmpty
                emptyMessage={
                  hasActiveFilter
                    ? 'No resubmitted requests match your current filters.'
                    : 'No resubmitted requests or Admin directives awaiting your review.'
                }
                emptyDescription="Admin revision directives routed to Manager and employee resubmissions appear here."
              />
            </div>

            <aside className="lg:col-span-4 flex flex-col gap-4">
              <WaitingOnEmployeeCard
                requests={classified.teamHistoryAndTracking}
                onInspect={(req) => navigate(`/travel/requests/${req.id}?tab=revisions`)}
              />
              <PolicyChecklistCard
                title="Revision Routing Guide"
                items={[
                  'Admin directives can be justified directly back to Admin or routed down to the employee.',
                  'Employee resubmissions always require fresh Tier 1 Manager sign-off before returning to Admin.',
                  'Rejection requires at least 3 characters explaining policy or budget rationale.',
                ]}
              />
            </aside>
          </div>
        )}

        {activeTab === 'past' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <TravelRequestsTable
                title="Team Tracking & History Archive"
                requests={historyRequests}
                showRequester
                showRemarksPreview
                actionLabel="Inspect"
                onAction={(req) => navigate(`/travel/requests/${req.id}?tab=past`)}
                compactEmpty
                headerActions={
                  <div
                    role="group"
                    aria-label="Filter history by workflow status"
                    className="flex flex-wrap items-center gap-1"
                  >
                    {HISTORY_BUCKET_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={historyBucket === opt.id}
                        onClick={() => setHistoryBucket(opt.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                          historyBucket === opt.id
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface border-border-warm text-muted hover:text-ink'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                }
                emptyMessage={
                  hasActiveFilter
                    ? 'No team records match your current search or status filter.'
                    : 'No forwarded, pending-employee, or historical team requests recorded yet.'
                }
                emptyDescription="Trips forwarded to Admin, returned to employees, or settled appear here."
              />
            </div>

            <aside className="lg:col-span-4 flex flex-col gap-4">
              <TeamDecisionBreakdownCard requests={classified.teamHistoryAndTracking} />
              <CategorySpendBreakdownCard
                title="Historical Category Allocation"
                subtitle="Forwarded and concluded team spend"
                totalSpend={historyCategorySpend.totalSpend}
                categories={historyCategorySpend.categories}
                emptyMessage="Spend allocation updates once team requests advance."
              />
            </aside>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-5">
              {personalRevisionRequests.length > 0 && (
                <>
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-amber-900">
                    <AlertCircle className="size-4 text-amber-700 shrink-0" />
                    <span>
                      You have <strong>{personalRevisionRequests.length}</strong> personal request
                      {personalRevisionRequests.length > 1 ? 's' : ''} requiring revision &amp; resubmission.
                    </span>
                  </div>

                  <TravelRequestsTable
                    title="Personal Revisions Needed"
                    requests={personalRevisionRequests}
                    showRemarksPreview
                    actionLabel="Revise & Resubmit"
                    onAction={(req) => navigate(`/travel/requests/${req.id}/edit?tab=personal`)}
                    secondaryAction={{
                      label: 'Inspect',
                      onClick: (req) => navigate(`/travel/requests/${req.id}?tab=personal`),
                    }}
                  />
                </>
              )}

              <TravelRequestsTable
                title="My Personal Travel Requests"
                requests={personalSubmittedRequests}
                showRemarksPreview
                actionLabel="Inspect"
                onAction={(req) => navigate(`/travel/requests/${req.id}?tab=personal`)}
                compactEmpty
                emptyMessage={
                  hasActiveFilter
                    ? 'No personal travel requests match your current filters.'
                    : 'You have not submitted any personal travel requests.'
                }
                emptyDescription="Use Submit My Travel above to log a new personal authorization or claim."
              />
            </div>

            <aside className="lg:col-span-4 flex flex-col gap-4">
              <CategorySpendBreakdownCard
                title="Personal Spend Mix"
                subtitle="Your submitted requests by category"
                totalSpend={personalCategorySpend.totalSpend}
                categories={personalCategorySpend.categories}
                emptyMessage="Your personal expense breakdown will appear once you submit a trip."
              />
              <RecentActivityFeedCard
                requests={requests.filter((r) => r.status !== 'DRAFT')}
                onInspect={(req) => navigate(`/travel/requests/${req.id}?tab=personal`)}
              />
            </aside>
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <TravelRequestsTable
                title="Saved Personal Drafts"
                requests={personalDraftRequests}
                actionLabel="Resume Draft"
                onAction={(req) => navigate(`/travel/requests/${req.id}/edit?tab=drafts`)}
                compactEmpty
                emptyMessage={
                  hasActiveFilter
                    ? 'No saved personal drafts match your current filters.'
                    : 'You have no saved travel drafts.'
                }
                emptyDescription="Drafts let you stage routes and expense quotes before submitting for approval."
              />
            </div>

            <aside className="lg:col-span-4 flex flex-col gap-4">
              <DraftReadinessSummaryCard
                drafts={allPersonalDrafts}
                onResume={(req) => navigate(`/travel/requests/${req.id}/edit?tab=drafts`)}
              />
              <PolicyChecklistCard title="Draft Submission Checklist" />
            </aside>
          </div>
        )}
      </motion.div>
    </div>
  );
};
