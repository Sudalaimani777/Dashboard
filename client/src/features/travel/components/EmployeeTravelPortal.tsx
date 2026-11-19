import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  Search,
  Download,
  Plane,
  Receipt,
} from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import {
  RecentTripsSnapshotCard,
  ResolvedRevisionsCard,
} from './employee/EmployeeSidebarPanels';
import { formatINR } from '../utils/currency';
import { exportRequestsToCsv } from '../utils/travelAnalytics';
import type { TravelRequest } from '../types/travel.types';

export interface EmployeeTravelPortalProps {
  activeTab?: string;
}

export type EmployeeStatusSegment = 'ALL' | 'IN_FLIGHT' | 'REVISIONS' | 'DRAFTS' | 'CONCLUDED';
type PastSubFilter = 'ALL' | 'APPROVED' | 'SETTLED' | 'OTHER';

export const resolveEmployeeSegment = (activeTab?: string, explicitSegment?: string): EmployeeStatusSegment => {
  if (explicitSegment && ['ALL', 'IN_FLIGHT', 'REVISIONS', 'DRAFTS', 'CONCLUDED'].includes(explicitSegment)) {
    return explicitSegment as EmployeeStatusSegment;
  }
  switch (activeTab) {
    case 'revisions':
      return 'REVISIONS';
    case 'drafts':
      return 'DRAFTS';
    case 'past':
      return 'CONCLUDED';
    case 'present':
      return 'IN_FLIGHT';
    case 'trips':
    default:
      return 'ALL';
  }
};

export const EmployeeTravelPortal: React.FC<EmployeeTravelPortalProps> = ({
  activeTab = 'trips',
}) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { requests, loadRequests } = useTravel();

  const [statusSegment, setStatusSegment] = useState<EmployeeStatusSegment>(() =>
    resolveEmployeeSegment(activeTab)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [pastSubFilter, setPastSubFilter] = useState<PastSubFilter>('ALL');
  const tableSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Synchronize when activeTab changes (e.g. browser back button or direct link with legacy param)
  useEffect(() => {
    if (activeTab && ['present', 'revisions', 'drafts', 'past', 'trips'].includes(activeTab)) {
      setStatusSegment(resolveEmployeeSegment(activeTab));
    }
  }, [activeTab]);

  // Classification sets across all requests (unfiltered for KPI integrity)
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

  const approvedTrips = useMemo(() => allPast.filter((r) => r.status === 'APPROVED'), [allPast]);
  const settledTrips = useMemo(() => allPast.filter((r) => r.status === 'SETTLED'), [allPast]);
  const clearedCount = approvedTrips.length + settledTrips.length;
  const avgTripSpend = clearedCount > 0 ? totalSpent / clearedCount : 0;

  const managerReviewCount = useMemo(
    () => allActive.filter((r) => r.status === 'PENDING_MANAGER_REVIEW').length,
    [allActive]
  );
  const adminApprovalCount = useMemo(
    () => allActive.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL').length,
    [allActive]
  );

  // Filtering requests by search query
  const baseFilteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  // Segmented requests display
  const displayedRequests = useMemo(() => {
    switch (statusSegment) {
      case 'IN_FLIGHT':
        return baseFilteredRequests.filter((r) =>
          ['SUBMITTED', 'PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'].includes(r.status)
        );
      case 'REVISIONS':
        return baseFilteredRequests.filter((r) => r.status.includes('REVISION_REQUESTED'));
      case 'DRAFTS':
        return baseFilteredRequests.filter((r) => r.status === 'DRAFT');
      case 'CONCLUDED': {
        const past = baseFilteredRequests.filter((r) =>
          ['SETTLED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(r.status)
        );
        if (pastSubFilter === 'ALL') return past;
        if (pastSubFilter === 'APPROVED') return past.filter((r) => r.status === 'APPROVED');
        if (pastSubFilter === 'SETTLED') return past.filter((r) => r.status === 'SETTLED');
        return past.filter((r) => ['REJECTED', 'CANCELLED'].includes(r.status));
      }
      case 'ALL':
      default:
        return baseFilteredRequests;
    }
  }, [baseFilteredRequests, statusSegment, pastSubFilter]);

  const hasActiveFilter = Boolean(
    searchQuery.trim() ||
      statusSegment !== 'ALL' ||
      pastSubFilter !== 'ALL'
  );

  const handleCloneTrip = (req: TravelRequest) => {
    navigate(`/travel/new?clone=${req.id}`);
  };

  const handleRowAction = (req: TravelRequest) => {
    if (req.status.includes('REVISION')) {
      navigate(`/travel/requests/${req.id}/edit?tab=revisions`);
    } else if (req.status === 'DRAFT') {
      navigate(`/travel/requests/${req.id}/edit?tab=drafts`);
    } else if (['APPROVED', 'SETTLED', 'REJECTED', 'CANCELLED'].includes(req.status)) {
      navigate(`/travel/requests/${req.id}?tab=past`);
    } else {
      navigate(`/travel/requests/${req.id}`);
    }
  };

  const quickLaunchActions = (
    <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            My Travel Workspace
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {quickLaunchActions}
        </div>
      </div>

      {/* Pinned Executive Metric Strip */}
      <TravelMetricsGrid
        metrics={[
          {
            label: 'Active / In Review',
            value: allActive.length,
            subtext: 'Currently in approval pipeline',
            isActive: statusSegment === 'IN_FLIGHT',
            pills: [
              { label: 'Manager', value: managerReviewCount },
              { label: 'Admin', value: adminApprovalCount },
            ],
            onClick: () =>
              setStatusSegment((prev) => (prev === 'IN_FLIGHT' ? 'ALL' : 'IN_FLIGHT')),
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
            isActive: statusSegment === 'REVISIONS' || statusSegment === 'DRAFTS',
            pills: [
              {
                label: 'Revisions',
                value: allRevisions.length,
                isActive: statusSegment === 'REVISIONS',
                onClick: () =>
                  setStatusSegment((prev) => (prev === 'REVISIONS' ? 'ALL' : 'REVISIONS')),
              },
              {
                label: 'Drafts',
                value: allDrafts.length,
                isActive: statusSegment === 'DRAFTS',
                onClick: () =>
                  setStatusSegment((prev) => (prev === 'DRAFTS' ? 'ALL' : 'DRAFTS')),
              },
            ],
            onClick: () =>
              setStatusSegment((prev) =>
                prev === 'REVISIONS' || prev === 'DRAFTS'
                  ? 'ALL'
                  : allRevisions.length > 0
                  ? 'REVISIONS'
                  : 'DRAFTS'
              ),
          },
          {
            label: 'Settled / Cleared',
            value: clearedCount,
            subtext:
              clearedCount > 0
                ? `Avg ${formatINR(avgTripSpend)} per trip`
                : 'No completed trips yet',
            isActive: statusSegment === 'CONCLUDED',
            pills: [
              {
                label: 'Approved',
                value: approvedTrips.length,
                isActive: statusSegment === 'CONCLUDED' && pastSubFilter === 'APPROVED',
                onClick: () => {
                  setStatusSegment('CONCLUDED');
                  setPastSubFilter((prev) => (prev === 'APPROVED' ? 'ALL' : 'APPROVED'));
                },
              },
              {
                label: 'Settled',
                value: settledTrips.length,
                isActive: statusSegment === 'CONCLUDED' && pastSubFilter === 'SETTLED',
                onClick: () => {
                  setStatusSegment('CONCLUDED');
                  setPastSubFilter((prev) => (prev === 'SETTLED' ? 'ALL' : 'SETTLED'));
                },
              },
            ],
            onClick: () => {
              setStatusSegment((prev) => (prev === 'CONCLUDED' ? 'ALL' : 'CONCLUDED'));
              setPastSubFilter('ALL');
            },
          },
          {
            label: 'Total Expenditure',
            value: formatINR(totalSpent),
            isCurrency: true,
            subtext: `${nonDraftRequests.length} submitted request(s) · INR`,
            isActive: statusSegment === 'ALL',
            onClick: () => {
              setStatusSegment('ALL');
              setPastSubFilter('ALL');
            },
          },
        ]}
      />

      {/* Search and Export Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px] max-w-xl">
          <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, city, project..."
            aria-label="Search travel requests"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
          />
        </div>

        <button
          type="button"
          disabled={displayedRequests.length === 0}
          onClick={() => exportRequestsToCsv(displayedRequests, 'my-travel-requests.csv')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-xs font-semibold text-ink disabled:opacity-40 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 shrink-0"
        >
          <Download className="size-3.5 text-primary" /> Export CSV
        </button>
      </div>

      {/* Main Workspace Table (Full Width) */}
      <motion.div
        ref={tableSectionRef}
        key={statusSegment}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="w-full flex flex-col gap-5"
      >
        <TravelRequestsTable
          title={
            statusSegment === 'IN_FLIGHT'
              ? 'Active In-Flight Requests'
              : statusSegment === 'REVISIONS'
              ? 'Requests Requiring Revision'
              : statusSegment === 'DRAFTS'
              ? 'Saved Travel Drafts'
              : statusSegment === 'CONCLUDED'
              ? 'Concluded & Settled Company Travel'
              : 'All Travel Requests'
          }
          requests={displayedRequests}
          actionLabel={
            statusSegment === 'REVISIONS'
              ? 'Fix & Resubmit'
              : statusSegment === 'DRAFTS'
              ? 'Resume Draft'
              : 'Inspect'
          }
          showRemarksPreview={statusSegment === 'REVISIONS' || statusSegment === 'ALL'}
          onAction={handleRowAction}
          secondaryAction={
            statusSegment === 'CONCLUDED' || statusSegment === 'ALL'
              ? {
                  label: 'Clone',
                  onClick: handleCloneTrip,
                }
              : undefined
          }
          compactEmpty
          emptyMessage={
            hasActiveFilter
              ? 'No travel requests match your current filters.'
              : statusSegment === 'REVISIONS'
              ? 'All clear. No requests currently require revisions.'
              : statusSegment === 'DRAFTS'
              ? 'You have no saved travel drafts.'
              : statusSegment === 'IN_FLIGHT'
              ? 'No active travel requests in review.'
              : statusSegment === 'CONCLUDED'
              ? 'No concluded or settled trips on record.'
              : 'No travel requests found.'
          }
          emptyDescription={
            statusSegment === 'REVISIONS'
              ? 'When a Line Manager or Corporate Admin returns a trip for corrections, their remarks will appear here.'
              : statusSegment === 'DRAFTS'
              ? 'Start a new trip and click Save as Draft at any point to stage items and finish later.'
              : 'Start a new pre-trip authorization or submit a post-trip reimbursement claim.'
          }
          emptyAction={
            statusSegment === 'REVISIONS' ? (
              <button
                type="button"
                onClick={() => setStatusSegment('ALL')}
                className="px-3.5 py-2 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-xs font-semibold text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all"
              >
                View All Trips
              </button>
            ) : (
              quickLaunchActions
            )
          }
        />

        {/* Contextual Sub-Cards on specific segments */}
        {statusSegment === 'REVISIONS' && (
          <ResolvedRevisionsCard
            requests={baseFilteredRequests}
            onInspect={(req) => navigate(`/travel/requests/${req.id}?tab=revisions`)}
          />
        )}

        {statusSegment === 'DRAFTS' && (
          <RecentTripsSnapshotCard
            title="Clone from Past Trips"
            subtitle="Duplicate route, project code, and emergency contact into a fresh request"
            requests={allPast.slice(0, 4)}
            actionLabel="Clone as Draft"
            emptyMessage={hasActiveFilter ? 'No past trips match your current search.' : undefined}
            onAction={handleCloneTrip}
          />
        )}
      </motion.div>
    </div>
  );
};
