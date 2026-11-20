import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, Search, Download } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { formatINR } from '../utils/currency';
import { aggregateRequestsCategorySpend, exportRequestsToCsv } from '../utils/travelAnalytics';
import {
  classifyManagerQueue,
  filterManagerRequests,
} from '../utils/managerQueue';
import type { TravelRequest } from '../types/travel.types';

export interface ManagerQueuePortalProps {
  activeTab?: string;
}

export type ManagerTeamStatusSegment =
  | 'ALL'
  | 'AUDIT'
  | 'REVISIONS'
  | 'AWAITING_ADMIN'
  | 'WAITING_EMPLOYEE'
  | 'CONCLUDED';

export type ManagerPersonalStatusSegment =
  | 'ALL'
  | 'ACTIVE'
  | 'REVISIONS'
  | 'DRAFTS'
  | 'ARCHIVE';

export const ManagerQueuePortal: React.FC<ManagerQueuePortalProps> = ({ activeTab = 'team' }) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { managerQueue, requests, loadManagerQueue, loadRequests } = useTravel();

  // Determine effective workspace ('team' or 'personal')
  const effectiveWorkspace =
    activeTab === 'personal' || activeTab === 'drafts' ? 'personal' : 'team';

  // Map legacy URL params to initial status segments
  const initialTeamSegment = useMemo<ManagerTeamStatusSegment>(() => {
    if (activeTab === 'present') return 'AUDIT';
    if (activeTab === 'revisions') return 'REVISIONS';
    if (activeTab === 'past') return 'CONCLUDED';
    return 'ALL';
  }, [activeTab]);

  const initialPersonalSegment = useMemo<ManagerPersonalStatusSegment>(() => {
    if (activeTab === 'drafts') return 'DRAFTS';
    return 'ALL';
  }, [activeTab]);

  const [teamSegment, setTeamSegment] = useState<ManagerTeamStatusSegment>(initialTeamSegment);
  const [personalSegment, setPersonalSegment] = useState<ManagerPersonalStatusSegment>(initialPersonalSegment);
  const [searchQuery, setSearchQuery] = useState('');
  const personalTableRef = useRef<HTMLDivElement>(null);

  // Sync state if activeTab changes from external navigation
  useEffect(() => {
    if (activeTab === 'present') {
      setTeamSegment('AUDIT');
    } else if (activeTab === 'revisions') {
      setTeamSegment('REVISIONS');
    } else if (activeTab === 'past') {
      setTeamSegment('CONCLUDED');
    } else if (activeTab === 'drafts') {
      setPersonalSegment('DRAFTS');
    }
  }, [activeTab]);

  useEffect(() => {
    loadManagerQueue();
    loadRequests();
  }, [loadManagerQueue, loadRequests]);

  const classified = useMemo(
    () => classifyManagerQueue(managerQueue, user?.id),
    [managerQueue, user?.id]
  );

  // In-flight active segments for team queue
  const awaitingAdminRequests = useMemo(
    () =>
      classified.teamHistoryAndTracking.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL'),
    [classified.teamHistoryAndTracking]
  );

  const waitingEmployeeRequests = useMemo(
    () =>
      classified.teamHistoryAndTracking.filter(
        (r) =>
          r.status === 'REVISION_REQUESTED_BY_MANAGER' ||
          r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
      ),
    [classified.teamHistoryAndTracking]
  );

  const concludedRequests = useMemo(
    () =>
      classified.teamHistoryAndTracking.filter((r) =>
        ['APPROVED', 'SETTLED', 'REJECTED', 'CANCELLED'].includes(r.status)
      ),
    [classified.teamHistoryAndTracking]
  );

  const queueTotal = useMemo(
    () => classified.initialAudit.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [classified.initialAudit]
  );

  const pendingUpcomingCount = useMemo(
    () => classified.initialAudit.filter((r) => r.travelType === 'UPCOMING').length,
    [classified.initialAudit]
  );

  const pendingClaimsCount = useMemo(
    () => classified.initialAudit.filter((r) => r.travelType === 'ALREADY_TRAVELLED').length,
    [classified.initialAudit]
  );

  const teamCategorySpend = useMemo(
    () => aggregateRequestsCategorySpend(classified.teamQueue),
    [classified.teamQueue]
  );

  // Filtered requests for Team Workspace
  const baseTeamRequests = useMemo(() => {
    switch (teamSegment) {
      case 'AUDIT':
        return classified.initialAudit;
      case 'REVISIONS':
        return classified.revisions;
      case 'AWAITING_ADMIN':
        return awaitingAdminRequests;
      case 'WAITING_EMPLOYEE':
        return waitingEmployeeRequests;
      case 'CONCLUDED':
        return concludedRequests;
      case 'ALL':
      default:
        return classified.teamQueue;
    }
  }, [teamSegment, classified, awaitingAdminRequests, waitingEmployeeRequests, concludedRequests]);

  const filteredTeamRequests = useMemo(
    () => filterManagerRequests(baseTeamRequests, { query: searchQuery }),
    [baseTeamRequests, searchQuery]
  );

  // Personal travel segmentation
  const personalDraftRequests = useMemo(
    () => requests.filter((r) => r.status === 'DRAFT'),
    [requests]
  );

  const personalActiveRequests = useMemo(
    () =>
      requests.filter((r) =>
        ['SUBMITTED', 'PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'].includes(r.status)
      ),
    [requests]
  );

  const personalRevisionRequests = useMemo(
    () => requests.filter((r) => r.status.includes('REVISION_REQUESTED')),
    [requests]
  );

  const personalArchiveRequests = useMemo(
    () =>
      requests.filter((r) =>
        ['APPROVED', 'SETTLED', 'REJECTED', 'CANCELLED'].includes(r.status)
      ),
    [requests]
  );

  const basePersonalRequests = useMemo(() => {
    switch (personalSegment) {
      case 'ACTIVE':
        return personalActiveRequests;
      case 'REVISIONS':
        return personalRevisionRequests;
      case 'DRAFTS':
        return personalDraftRequests;
      case 'ARCHIVE':
        return personalArchiveRequests;
      case 'ALL':
      default:
        return requests;
    }
  }, [
    personalSegment,
    requests,
    personalActiveRequests,
    personalRevisionRequests,
    personalDraftRequests,
    personalArchiveRequests,
  ]);

  const filteredPersonalRequests = useMemo(
    () => filterManagerRequests(basePersonalRequests, { query: searchQuery }),
    [basePersonalRequests, searchQuery]
  );

  const hasActiveFilter = Boolean(
    searchQuery.trim() ||
      (effectiveWorkspace === 'team' && teamSegment !== 'ALL')
  );

  // Segment configs
  const teamSegmentConfig: Array<{ id: ManagerTeamStatusSegment; label: string; count: number }> = [
    { id: 'ALL', label: 'All Team Requests', count: classified.teamQueue.length },
    { id: 'AUDIT', label: 'Pending Audit', count: classified.initialAudit.length },
    { id: 'REVISIONS', label: 'In Revision', count: classified.revisions.length },
    { id: 'AWAITING_ADMIN', label: 'Awaiting Admin', count: awaitingAdminRequests.length },
    { id: 'WAITING_EMPLOYEE', label: 'Waiting on Employee', count: waitingEmployeeRequests.length },
    { id: 'CONCLUDED', label: 'Settled & Closed', count: concludedRequests.length },
  ];

  const personalSegmentConfig: Array<{ id: ManagerPersonalStatusSegment; label: string; count: number }> = [
    { id: 'ALL', label: 'All Personal Trips', count: requests.length },
    { id: 'ACTIVE', label: 'In Flight', count: personalActiveRequests.length },
    { id: 'REVISIONS', label: 'Action Needed', count: personalRevisionRequests.length },
    { id: 'DRAFTS', label: 'Saved Drafts', count: personalDraftRequests.length },
    { id: 'ARCHIVE', label: 'Past Archive', count: personalArchiveRequests.length },
  ];

  const getTeamActionLabel = (): string => {
    switch (teamSegment) {
      case 'AUDIT':
        return 'Audit Proofs';
      case 'REVISIONS':
        return 'Audit & Action';
      case 'AWAITING_ADMIN':
        return 'Track Status';
      case 'WAITING_EMPLOYEE':
        return 'Inspect Note';
      case 'CONCLUDED':
        return 'Inspect';
      case 'ALL':
      default:
        return 'Audit & Inspect';
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Workspace Header + Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {effectiveWorkspace === 'team' ? 'Team Approvals' : 'My Personal Travel'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
            <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                effectiveWorkspace === 'personal'
                  ? 'Search personal trips, cities, projects...'
                  : 'Search direct reports, titles, cities...'
              }
              aria-label="Search travel requests"
              className="pl-8 pr-3 py-2 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint w-full sm:w-72 md:w-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>

          {effectiveWorkspace === 'team' && filteredTeamRequests.length > 0 && (
            <button
              type="button"
              onClick={() => exportRequestsToCsv(filteredTeamRequests, 'team-travel-approvals.csv')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Download className="size-3.5 text-primary" /> Export CSV
            </button>
          )}

          {effectiveWorkspace === 'personal' && (
            <button
              type="button"
              onClick={() => navigate('/travel/new?tab=personal')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shadow-xs"
            >
              <Plus className="size-4" /> Submit My Travel
            </button>
          )}
        </div>
      </div>

      {/* 1. Team Approvals Workspace */}
      {effectiveWorkspace === 'team' && (
        <motion.div
          key="team-workspace"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          className="flex flex-col gap-5"
        >
          {/* Pinned Metric Strip */}
          <TravelMetricsGrid
            metrics={[
              {
                label: 'Pending Audit',
                value: classified.initialAudit.length,
                subtext: 'Direct reports awaiting review',
                isActive: teamSegment === 'AUDIT',
                pills: [
                  { label: 'Upcoming', value: pendingUpcomingCount },
                  { label: 'Claims', value: pendingClaimsCount },
                ],
                onClick: () => setTeamSegment((prev) => (prev === 'AUDIT' ? 'ALL' : 'AUDIT')),
              },
              {
                label: 'Team Revisions',
                value: classified.revisions.length + waitingEmployeeRequests.length,
                subtext:
                  classified.revisions.length > 0
                    ? 'Resubmitted & waiting action'
                    : 'Directives & revision loops',
                tone: classified.revisions.length > 0 ? 'amber' : 'default',
                badge: classified.revisions.length > 0 ? 'Action Needed' : undefined,
                isActive: teamSegment === 'REVISIONS' || teamSegment === 'WAITING_EMPLOYEE',
                pills: [
                  {
                    label: 'With Manager',
                    value: classified.revisions.length,
                    isActive: teamSegment === 'REVISIONS',
                    onClick: () =>
                      setTeamSegment((prev) => (prev === 'REVISIONS' ? 'ALL' : 'REVISIONS')),
                  },
                  {
                    label: 'With Employee',
                    value: waitingEmployeeRequests.length,
                    isActive: teamSegment === 'WAITING_EMPLOYEE',
                    onClick: () =>
                      setTeamSegment((prev) =>
                        prev === 'WAITING_EMPLOYEE' ? 'ALL' : 'WAITING_EMPLOYEE'
                      ),
                  },
                ],
                onClick: () =>
                  setTeamSegment((prev) =>
                    prev === 'REVISIONS' || prev === 'WAITING_EMPLOYEE'
                      ? 'ALL'
                      : classified.revisions.length > 0
                      ? 'REVISIONS'
                      : 'WAITING_EMPLOYEE'
                  ),
              },
              {
                label: 'Tracking & Concluded',
                value: awaitingAdminRequests.length + concludedRequests.length,
                subtext: 'Tier 2 clearance & closed',
                isActive: teamSegment === 'AWAITING_ADMIN' || teamSegment === 'CONCLUDED',
                pills: [
                  {
                    label: 'Awaiting Admin',
                    value: awaitingAdminRequests.length,
                    isActive: teamSegment === 'AWAITING_ADMIN',
                    onClick: () =>
                      setTeamSegment((prev) =>
                        prev === 'AWAITING_ADMIN' ? 'ALL' : 'AWAITING_ADMIN'
                      ),
                  },
                  {
                    label: 'Settled & Closed',
                    value: concludedRequests.length,
                    isActive: teamSegment === 'CONCLUDED',
                    onClick: () =>
                      setTeamSegment((prev) => (prev === 'CONCLUDED' ? 'ALL' : 'CONCLUDED')),
                  },
                ],
                onClick: () =>
                  setTeamSegment((prev) =>
                    prev === 'AWAITING_ADMIN' || prev === 'CONCLUDED' ? 'ALL' : 'AWAITING_ADMIN'
                  ),
              },
              {
                label: 'Total Queue Value',
                value: formatINR(queueTotal),
                isCurrency: true,
                subtext: `${classified.teamQueue.length} team request(s) · View All`,
                isActive: teamSegment === 'ALL',
                onClick: () => setTeamSegment('ALL'),
                progressSegments: teamCategorySpend.categories.map((c) => ({
                  label: c.shortLabel,
                  percentage: c.percentage,
                  color: c.color,
                })),
              },
            ]}
          />

          {/* Main Table Layout (100% Full Width) */}
          <div className="w-full">
            <TravelRequestsTable
              title={`Team Pipeline: ${
                teamSegmentConfig.find((s) => s.id === teamSegment)?.label || 'All Requests'
              }`}
              requests={filteredTeamRequests}
              showRequester
              showRemarksPreview={teamSegment === 'REVISIONS' || teamSegment === 'ALL'}
              actionLabel={getTeamActionLabel()}
              onAction={(req) => navigate(`/travel/requests/${req.id}?tab=team`)}
              compactEmpty={classified.teamQueue.length > 0}
              emptyMessage={
                hasActiveFilter
                  ? 'No team requests match your active filters.'
                  : 'No requests currently in this workflow stage.'
              }
              emptyDescription="New direct report requests and revisions will appear here automatically."
            />
          </div>
        </motion.div>
      )}

      {/* 2. Personal Travel & Drafts Workspace */}
      {effectiveWorkspace === 'personal' && (
        <motion.div
          key="personal-workspace"
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          className="flex flex-col gap-5"
        >
          {/* Personal Lifecycle Segment Pills */}
          <div
            role="tablist"
            aria-label="Filter personal travel by stage"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-border-warm bg-surface shadow-2xs"
          >
            {personalSegmentConfig.map((seg) => {
              const isSelected = personalSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setPersonalSegment(seg.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-muted hover:text-ink hover:bg-surface-subtle'
                  }`}
                >
                  <span>{seg.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-subtle border border-border-warm text-muted'
                    }`}
                  >
                    {seg.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div ref={personalTableRef} className="w-full">
            <TravelRequestsTable
              title={`My Travel: ${
                personalSegmentConfig.find((s) => s.id === personalSegment)?.label || 'All Trips'
              }`}
              requests={filteredPersonalRequests}
              showRemarksPreview={personalSegment === 'REVISIONS' || personalSegment === 'ALL'}
              actionLabel={
                personalSegment === 'DRAFTS'
                  ? 'Resume Draft'
                  : personalSegment === 'REVISIONS'
                  ? 'Fix & Resubmit'
                  : 'Inspect'
              }
              onAction={(req: TravelRequest) => {
                if (req.status === 'DRAFT' || req.status.includes('REVISION_REQUESTED')) {
                  navigate(`/travel/requests/${req.id}/edit?tab=personal`);
                } else {
                  navigate(`/travel/requests/${req.id}?tab=personal`);
                }
              }}
              compactEmpty
              emptyMessage={
                hasActiveFilter
                  ? 'No personal travel records match your active filters.'
                  : personalSegment === 'DRAFTS'
                  ? 'You have no saved travel drafts.'
                  : personalSegment === 'REVISIONS'
                  ? 'No personal revision requests are waiting on your correction.'
                  : 'You have not created any personal travel requests yet.'
              }
              emptyDescription={
                personalSegment === 'DRAFTS'
                  ? 'Drafts let you stage routes and expense items before submitting for approval.'
                  : 'Use Submit My Travel above to initiate a new travel authorization or claim.'
              }
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
