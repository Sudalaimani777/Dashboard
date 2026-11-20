import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Search, Download, User, Building2 } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { RubberSegment } from '../../../shared/components/ui/RubberSegment';
import { DepartmentBudgetsPage } from '../pages/DepartmentBudgetsPage';
import { AdminUsersPage } from '../../users/pages/AdminUsersPage';
import { formatINR } from '../utils/currency';
import { exportRequestsToCsv } from '../utils/travelAnalytics';
import {
  classifyAdminQueue,
  filterAdminRequests,
  isManagerPersonalTrip,
  isAssignedToAdmin,
  type AdminScope,
  type AdminLedgerStatusFilter,
} from '../utils/adminQueue';

export interface AdminGovernancePortalProps {
  activeTab?: string;
}

export type GovernanceStatusSegment = 'ALL' | 'CLEARANCE' | 'OVERSIGHT' | 'REVISIONS' | 'ARCHIVE';

const LEDGER_STATUS_FILTERS: Array<{ id: AdminLedgerStatusFilter; label: string }> = [
  { id: 'ALL', label: 'All Archived' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'SETTLED', label: 'Settled' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export const AdminGovernancePortal: React.FC<AdminGovernancePortalProps> = ({ activeTab = 'governance' }) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { adminQueue, loadAdminQueue } = useTravel();

  // Map legacy URL tab query values ('present', 'revisions', 'past') or default to 'ALL'
  const initialSegment = useMemo<GovernanceStatusSegment>(() => {
    if (activeTab === 'present') return 'CLEARANCE';
    if (activeTab === 'revisions') return 'REVISIONS';
    if (activeTab === 'past') return 'ARCHIVE';
    return 'ALL';
  }, [activeTab]);

  const [statusSegment, setStatusSegment] = useState<GovernanceStatusSegment>(initialSegment);
  const [adminScope, setAdminScope] = useState<AdminScope>('ASSIGNED');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<AdminLedgerStatusFilter>('ALL');

  // Sync segment if activeTab changes from external navigation (e.g. browser back/forward or sidebar clicks)
  useEffect(() => {
    if (activeTab === 'present') {
      setStatusSegment('CLEARANCE');
    } else if (activeTab === 'revisions') {
      setStatusSegment('REVISIONS');
    } else if (activeTab === 'past') {
      setStatusSegment('ARCHIVE');
    } else if (activeTab === 'governance') {
      // Keep existing segment or reset to ALL
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'budgets' && activeTab !== 'users') {
      loadAdminQueue();
    }
  }, [activeTab, loadAdminQueue]);

  const currentUserId = user?.id;

  const assignedRequests = useMemo(
    () => adminQueue.filter((r) => isAssignedToAdmin(r, currentUserId)),
    [adminQueue, currentUserId]
  );

  const displayedQueue = useMemo(
    () => (adminScope === 'ASSIGNED' ? assignedRequests : adminQueue),
    [adminScope, assignedRequests, adminQueue]
  );

  const classified = useMemo(() => classifyAdminQueue(displayedQueue), [displayedQueue]);

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    for (const req of displayedQueue) {
      if (req.requesterDepartment) depts.add(req.requesterDepartment);
    }
    return Array.from(depts).sort((a, b) => a.localeCompare(b));
  }, [displayedQueue]);

  // Exclude current Admin's own travel request from Tier 1 oversight to prevent self-audit
  const tier1OversightRequests = useMemo(
    () => classified.tier1Oversight.filter((r) => !currentUserId || r.userId !== currentUserId),
    [classified.tier1Oversight, currentUserId]
  );

  const managerPersonalPendingCount = useMemo(
    () => tier1OversightRequests.filter(isManagerPersonalTrip).length,
    [tier1OversightRequests]
  );

  const executiveQueueValue = useMemo(
    () => classified.awaitingExecutive.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [classified.awaitingExecutive]
  );

  const disbursedSpendTotal = useMemo(
    () =>
      classified.ledgerArchive
        .filter((r) => r.status === 'APPROVED' || r.status === 'SETTLED')
        .reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [classified.ledgerArchive]
  );

  const awaitingUpcomingCount = useMemo(
    () => classified.awaitingExecutive.filter((r) => r.travelType === 'UPCOMING').length,
    [classified.awaitingExecutive]
  );

  const awaitingClaimsCount = useMemo(
    () => classified.awaitingExecutive.filter((r) => r.travelType === 'ALREADY_TRAVELLED').length,
    [classified.awaitingExecutive]
  );

  const tier1GeneralCount = useMemo(
    () => Math.max(0, tier1OversightRequests.length - managerPersonalPendingCount),
    [tier1OversightRequests.length, managerPersonalPendingCount]
  );

  const archiveApprovedCount = useMemo(
    () => classified.ledgerArchive.filter((r) => r.status === 'APPROVED').length,
    [classified.ledgerArchive]
  );

  const archiveSettledCount = useMemo(
    () => classified.ledgerArchive.filter((r) => r.status === 'SETTLED').length,
    [classified.ledgerArchive]
  );

  // Base list depending on segment
  const baseSegmentRequests = useMemo(() => {
    switch (statusSegment) {
      case 'CLEARANCE':
        return classified.awaitingExecutive;
      case 'OVERSIGHT':
        return tier1OversightRequests;
      case 'REVISIONS':
        return classified.dispatchedRevisions;
      case 'ARCHIVE':
        return classified.ledgerArchive;
      case 'ALL':
      default:
        return [
          ...classified.awaitingExecutive,
          ...tier1OversightRequests,
          ...classified.dispatchedRevisions,
          ...classified.ledgerArchive,
        ];
    }
  }, [statusSegment, classified, tier1OversightRequests]);

  // Apply search query, department filter, and optional archive sub-filter
  const filteredRequests = useMemo(() => {
    return filterAdminRequests(baseSegmentRequests, {
      query: searchQuery,
      departmentFilter,
      statusFilter: statusSegment === 'ARCHIVE' ? ledgerStatusFilter : 'ALL',
    });
  }, [baseSegmentRequests, searchQuery, departmentFilter, statusSegment, ledgerStatusFilter]);

  if (activeTab === 'budgets') {
    return <DepartmentBudgetsPage />;
  }

  if (activeTab === 'users') {
    return <AdminUsersPage />;
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    departmentFilter !== 'ALL' ||
    (statusSegment === 'ARCHIVE' && ledgerStatusFilter !== 'ALL');

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('ALL');
    setLedgerStatusFilter('ALL');
  };

  const segmentConfig: Array<{ id: GovernanceStatusSegment; label: string }> = [
    { id: 'ALL', label: 'All Requests' },
    { id: 'CLEARANCE', label: 'Awaiting Clearance' },
    { id: 'OVERSIGHT', label: 'Tier 1 Oversight' },
    { id: 'REVISIONS', label: 'In Revision' },
    { id: 'ARCHIVE', label: 'Settled & Closed' },
  ];

  const getTableActionLabel = (): string => {
    switch (statusSegment) {
      case 'CLEARANCE':
        return 'Review & Clear';
      case 'OVERSIGHT':
        return 'Advance / Audit';
      case 'REVISIONS':
        return 'View Status';
      case 'ARCHIVE':
        return 'Inspect';
      case 'ALL':
      default:
        return 'Open Workstation';
    }
  };

  const getTableEmptyInfo = () => {
    if (hasActiveFilters) {
      return {
        message: 'No travel requests match your active filters.',
        description: 'Try adjusting your search query, department, or trip type filters.',
      };
    }
    if (adminScope === 'ASSIGNED' && assignedRequests.length === 0) {
      return {
        message: 'Your personal review queue is clear',
        description: 'You have no travel requests assigned to you right now. Toggle to "All Organization" to review company-wide travel.',
      };
    }
    switch (statusSegment) {
      case 'CLEARANCE':
        return {
          message: 'All manager-approved requests have been cleared.',
          description: 'New requests will arrive here once Line Managers complete Tier 1 verification.',
        };
      case 'OVERSIGHT':
        return {
          message: 'No pending Tier 1 audits in the queue.',
          description: 'Submitted requests and Manager personal travel awaiting initial audit appear here.',
        };
      case 'REVISIONS':
        return {
          message: 'No requests currently in revision dispatch.',
          description: 'Requests returned to employees for alteration will appear here.',
        };
      case 'ARCHIVE':
        return {
          message: 'No archived travel requests found.',
          description: 'Approved, settled, rejected, and cancelled requests will be tracked here.',
        };
      case 'ALL':
      default:
        return {
          message: 'The corporate travel governance queue is clear.',
          description: 'Submitted employee and manager travel requests across all stages will appear here.',
        };
    }
  };

  const emptyInfo = getTableEmptyInfo();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto flex flex-col gap-5"
    >
      {/* Header with Title and CSV Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Travel Governance Queue</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Executive Scope Switcher */}
          <RubberSegment
            aria-label="Queue scope"
            variant="surface"
            size="sm"
            value={adminScope}
            onChange={(val) => setAdminScope(val as AdminScope)}
            items={[
              {
                value: 'ASSIGNED',
                label: 'Assigned to Me',
                icon: <User className="size-3.5 text-primary" />,
                badge: assignedRequests.length,
              },
              {
                value: 'ALL',
                label: 'All Organization',
                icon: <Building2 className="size-3.5" />,
                badge: adminQueue.length,
              },
            ]}
          />

          {filteredRequests.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportRequestsToCsv(
                  filteredRequests,
                  `travel-governance-${adminScope.toLowerCase()}-${statusSegment.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-ink hover:border-primary/40 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="size-3.5 text-primary" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Pinned Executive KPI Summary Strip */}
      <TravelMetricsGrid
        metrics={[
          {
            label: 'Awaiting Clearance',
            value: classified.awaitingExecutive.length,
            subtext: `${formatINR(executiveQueueValue)} pending sign-off`,
            isActive: statusSegment === 'CLEARANCE',
            pills: [
              { label: 'Upcoming', value: awaitingUpcomingCount },
              { label: 'Claims', value: awaitingClaimsCount },
            ],
            onClick: () =>
              setStatusSegment((prev) => (prev === 'CLEARANCE' ? 'ALL' : 'CLEARANCE')),
          },
          {
            label: 'Tier 1 / Manager Queue',
            value: tier1OversightRequests.length,
            subtext:
              managerPersonalPendingCount > 0
                ? `${managerPersonalPendingCount} Manager personal request${managerPersonalPendingCount > 1 ? 's' : ''}`
                : 'Initial manager audits',
            badge: managerPersonalPendingCount > 0 ? 'Manager Action' : undefined,
            isActive: statusSegment === 'OVERSIGHT',
            pills: [
              { label: 'Manager', value: managerPersonalPendingCount },
              { label: 'Staff', value: tier1GeneralCount },
            ],
            onClick: () =>
              setStatusSegment((prev) => (prev === 'OVERSIGHT' ? 'ALL' : 'OVERSIGHT')),
          },
          {
            label: 'Dispatched Revisions',
            value: classified.dispatchedRevisions.length,
            subtext: 'In employee revision',
            tone: classified.dispatchedRevisions.length > 0 ? 'amber' : 'default',
            isActive: statusSegment === 'REVISIONS',
            onClick: () =>
              setStatusSegment((prev) => (prev === 'REVISIONS' ? 'ALL' : 'REVISIONS')),
          },
          {
            label: 'Cleared & Settled',
            value: formatINR(disbursedSpendTotal),
            isCurrency: true,
            subtext: `${archiveApprovedCount + archiveSettledCount} approved requests · View All`,
            isActive: statusSegment === 'ARCHIVE',
            pills: [
              {
                label: 'Approved',
                value: archiveApprovedCount,
                isActive: statusSegment === 'ARCHIVE' && ledgerStatusFilter === 'APPROVED',
                onClick: () => {
                  setStatusSegment('ARCHIVE');
                  setLedgerStatusFilter((prev) => (prev === 'APPROVED' ? 'ALL' : 'APPROVED'));
                },
              },
              {
                label: 'Settled',
                value: archiveSettledCount,
                isActive: statusSegment === 'ARCHIVE' && ledgerStatusFilter === 'SETTLED',
                onClick: () => {
                  setStatusSegment('ARCHIVE');
                  setLedgerStatusFilter((prev) => (prev === 'SETTLED' ? 'ALL' : 'SETTLED'));
                },
              },
            ],
            onClick: () => {
              setStatusSegment((prev) => (prev === 'ARCHIVE' ? 'ALL' : 'ARCHIVE'));
              setLedgerStatusFilter('ALL');
            },
          },
        ]}
      />

      {/* Search & Multi-Facet Filter Toolbar */}
      <div className="bg-surface rounded-xl border border-border-warm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, requester, email, project code, or city..."
            aria-label="Search corporate travel requests"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
            className="px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Archive Status Sub-Filter when in Settled & Closed segment */}
          {statusSegment === 'ARCHIVE' && (
            <select
              value={ledgerStatusFilter}
              onChange={(e) => setLedgerStatusFilter(e.target.value as AdminLedgerStatusFilter)}
              aria-label="Filter archive status"
              className="px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
            >
              {LEDGER_STATUS_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Single Unified Table for the Governance Queue */}
      <TravelRequestsTable
        title={`Governance Queue: ${segmentConfig.find((s) => s.id === statusSegment)?.label || 'All Requests'}${
          adminScope === 'ASSIGNED' ? ' (Assigned to Me)' : ' (All Organization)'
        }`}
        requests={filteredRequests}
        showRequester
        showRemarksPreview={statusSegment === 'REVISIONS' || statusSegment === 'ALL'}
        actionLabel={getTableActionLabel()}
        onAction={(req) => navigate(`/travel/requests/${req.id}?tab=governance`)}
        emptyMessage={emptyInfo.message}
        emptyDescription={emptyInfo.description}
        emptyAction={
          adminScope === 'ASSIGNED' && adminQueue.length > 0 ? (
            <button
              type="button"
              onClick={() => setAdminScope('ALL')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-primary hover:border-primary/40 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Building2 className="size-3.5 text-primary" />
              <span>View All Organization Requests ({adminQueue.length})</span>
            </button>
          ) : undefined
        }
      />
    </motion.div>
  );
};
