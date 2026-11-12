import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Search, Download, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { DepartmentBudgetsPage } from '../pages/DepartmentBudgetsPage';
import { formatINR } from '../utils/currency';
import { exportRequestsToCsv } from '../utils/travelAnalytics';
import {
  classifyAdminQueue,
  filterAdminRequests,
  isManagerPersonalTrip,
  type AdminLedgerStatusFilter,
  type AdminTypeFilter,
} from '../utils/adminQueue';

export interface AdminGovernancePortalProps {
  activeTab?: string;
}

const LEDGER_STATUS_FILTERS: Array<{ id: AdminLedgerStatusFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'SETTLED', label: 'Settled' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export const AdminGovernancePortal: React.FC<AdminGovernancePortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { adminQueue, loadAdminQueue } = useTravel();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AdminTypeFilter>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<AdminLedgerStatusFilter>('ALL');

  useEffect(() => {
    if (activeTab !== 'budgets') {
      loadAdminQueue();
    }
  }, [activeTab, loadAdminQueue]);

  const classified = useMemo(() => classifyAdminQueue(adminQueue), [adminQueue]);

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    for (const req of adminQueue) {
      if (req.requesterDepartment) depts.add(req.requesterDepartment);
    }
    return Array.from(depts).sort((a, b) => a.localeCompare(b));
  }, [adminQueue]);

  const pendingExecutiveRequests = useMemo(
    () =>
      filterAdminRequests(classified.awaitingExecutive, {
        query: searchQuery,
        typeFilter,
        departmentFilter,
      }),
    [classified.awaitingExecutive, searchQuery, typeFilter, departmentFilter]
  );

  const currentUserId = user?.id;

  const tier1OversightRequests = useMemo(
    () =>
      filterAdminRequests(
        // Exclude own personal request if an Admin ever submits one, preventing self-audit
        classified.tier1Oversight.filter((r) => !currentUserId || r.userId !== currentUserId),
        {
          query: searchQuery,
          typeFilter,
          departmentFilter,
        }
      ),
    [classified.tier1Oversight, currentUserId, searchQuery, typeFilter, departmentFilter]
  );

  const managerPersonalPendingCount = useMemo(
    () => tier1OversightRequests.filter(isManagerPersonalTrip).length,
    [tier1OversightRequests]
  );

  const dispatchedRevisionRequests = useMemo(
    () =>
      filterAdminRequests(classified.dispatchedRevisions, {
        query: searchQuery,
        typeFilter,
        departmentFilter,
      }),
    [classified.dispatchedRevisions, searchQuery, typeFilter, departmentFilter]
  );

  const pastLedgerRequests = useMemo(
    () =>
      filterAdminRequests(classified.ledgerArchive, {
        query: searchQuery,
        typeFilter,
        departmentFilter,
        statusFilter: ledgerStatusFilter,
      }),
    [classified.ledgerArchive, searchQuery, typeFilter, departmentFilter, ledgerStatusFilter]
  );

  const executiveQueueValue = useMemo(
    () =>
      classified.awaitingExecutive.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [classified.awaitingExecutive]
  );

  const disbursedSpendTotal = useMemo(
    () =>
      classified.ledgerArchive
        .filter((r) => r.status === 'APPROVED' || r.status === 'SETTLED')
        .reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [classified.ledgerArchive]
  );

  if (activeTab === 'budgets') {
    return <DepartmentBudgetsPage />;
  }

  const pageMeta =
    activeTab === 'revisions'
      ? {
          title: 'Dispatched Revision Tracking',
          subtitle: 'Monitor active Route A (Manager) and Route B (Employee) correction cycles.',
        }
      : activeTab === 'past'
      ? {
          title: 'Corporate Travel Ledger Archive',
          subtitle: 'Organization-wide history of approved, settled, rejected, and cancelled travel.',
        }
      : {
          title: 'Corporate Governance Hub',
          subtitle: 'Executive clearance, disbursement authorization, and Tier 1 oversight.',
        };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'ALL' ||
    departmentFilter !== 'ALL' ||
    (activeTab === 'past' && ledgerStatusFilter !== 'ALL');

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setDepartmentFilter('ALL');
    setLedgerStatusFilter('ALL');
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">{pageMeta.title}</h1>
          <p className="text-xs text-muted">{pageMeta.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'past' && pastLedgerRequests.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportRequestsToCsv(
                  pastLedgerRequests,
                  `corporate-travel-ledger-${new Date().toISOString().slice(0, 10)}.csv`
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

      {/* Executive KPI Summary Strip */}
      <TravelMetricsGrid
        metrics={[
          {
            label: 'Awaiting Clearance',
            value: classified.awaitingExecutive.length,
            subtext: `${formatINR(executiveQueueValue)} pending sign-off`,
          },
          {
            label: 'Tier 1 / Manager Queue',
            value: tier1OversightRequests.length,
            subtext:
              managerPersonalPendingCount > 0
                ? `${managerPersonalPendingCount} Manager personal request${managerPersonalPendingCount > 1 ? 's' : ''}`
                : 'Initial manager audits',
          },
          {
            label: 'Dispatched Revisions',
            value: classified.dispatchedRevisions.length,
            subtext: 'In Route A / B correction',
          },
          {
            label: 'Cleared & Settled',
            value: formatINR(disbursedSpendTotal),
            subtext: `${classified.ledgerArchive.filter((r) => r.status === 'APPROVED' || r.status === 'SETTLED').length} approved requests`,
          },
        ]}
      />

      {/* Search & Multi-Facet Filter Toolbar */}
      <div className="bg-surface rounded-xl border border-border-warm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
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
          <div
            role="group"
            aria-label="Filter by trip type"
            className="inline-flex rounded-lg border border-border-warm bg-surface p-0.5"
          >
            {(
              [
                { id: 'ALL', label: 'All Types' },
                { id: 'UPCOMING', label: 'Upcoming' },
                { id: 'ALREADY_TRAVELLED', label: 'Claims' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={typeFilter === opt.id}
                onClick={() => setTypeFilter(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
                  typeFilter === opt.id ? 'bg-primary text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

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

      {activeTab === 'present' && (
        <div className="flex flex-col gap-5">
          <TravelRequestsTable
            title="Requests Awaiting Executive Action"
            requests={pendingExecutiveRequests}
            showRequester
            actionLabel="Review & Clear"
            onAction={(req) => navigate(`/travel/clearance/${req.id}?tab=present`)}
            emptyMessage="All manager-approved requests have been processed."
            emptyDescription={
              hasActiveFilters
                ? 'No pending requests match your active search or filters.'
                : 'New requests will appear here once Line Managers complete Tier 1 verification.'
            }
          />

          <div className="flex flex-col gap-2">
            {managerPersonalPendingCount > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/90 text-xs text-amber-900">
                <ShieldAlert className="size-4 text-amber-700 shrink-0" />
                <span>
                  <strong>{managerPersonalPendingCount} Manager personal travel request{managerPersonalPendingCount > 1 ? 's' : ''}</strong>{' '}
                  awaiting Tier 1 clearance (Managers cannot self-approve their own travel).
                </span>
              </div>
            )}

            <TravelRequestsTable
              title="Tier 1 Review Oversight (Pending Initial Audit)"
              requests={tier1OversightRequests}
              showRequester
              actionLabel="Advance / Audit"
              onAction={(req) => navigate(`/travel/audit/${req.id}?tab=present`)}
              emptyMessage="No pending Tier 1 audits in the queue."
              emptyDescription={
                hasActiveFilters
                  ? 'No Tier 1 requests match your active search or filters.'
                  : 'Submitted employee and manager personal travel requests awaiting initial audit appear here.'
              }
              compactEmpty
            />
          </div>
        </div>
      )}

      {activeTab === 'revisions' && (
        <TravelRequestsTable
          title="Active Dispatched Revisions"
          requests={dispatchedRevisionRequests}
          showRequester
          showRemarksPreview
          actionLabel="View Status"
          onAction={(req) => navigate(`/travel/requests/${req.id}?tab=revisions`)}
          emptyMessage="No requests currently in revision dispatch."
          emptyDescription={
            hasActiveFilters
              ? 'No dispatched revisions match your active search or filters.'
              : 'Requests returned to Managers (Route A) or Employees (Route B) appear here until resubmitted.'
          }
        />
      )}

      {activeTab === 'past' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {LEDGER_STATUS_FILTERS.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => setLedgerStatusFilter(bucket.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
                  ledgerStatusFilter === bucket.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface border-border-warm text-muted hover:text-ink'
                }`}
              >
                {bucket.label}
              </button>
            ))}
          </div>

          <TravelRequestsTable
            title="Company-Wide Travel Ledger"
            requests={pastLedgerRequests}
            showRequester
            actionLabel="Inspect"
            onAction={(req) => navigate(`/travel/requests/${req.id}?tab=past`)}
            emptyMessage="No historical travel records found."
            emptyDescription={
              hasActiveFilters
                ? 'Try clearing your active search, department, or status filter.'
                : 'Approved, settled, rejected, and cancelled travel requests will appear here.'
            }
          />
        </div>
      )}
    </motion.div>
  );
};
