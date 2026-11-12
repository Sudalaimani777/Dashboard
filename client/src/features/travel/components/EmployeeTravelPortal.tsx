import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { RefreshButton } from './shared/RefreshButton';
import { formatINR } from '../utils/currency';

export interface EmployeeTravelPortalProps {
  activeTab?: string;
}

export const EmployeeTravelPortal: React.FC<EmployeeTravelPortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const { requests, loadRequests, refresh, isRefreshing, lastSyncedAt } = useTravel();

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const presentRequests = useMemo(
    () => requests.filter((r) => ['SUBMITTED', 'PENDING_MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'].includes(r.status)),
    [requests]
  );

  const revisionRequests = useMemo(
    () => requests.filter((r) => r.status.includes('REVISION_REQUESTED')),
    [requests]
  );

  const draftRequests = useMemo(
    () => requests.filter((r) => r.status === 'DRAFT'),
    [requests]
  );

  const pastRequests = useMemo(
    () => requests.filter((r) => ['SETTLED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(r.status)),
    [requests]
  );

  const totalSpent = useMemo(
    () => requests.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [requests]
  );

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
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
              ? 'Trips requiring updated quotes or receipts.'
              : activeTab === 'drafts'
              ? 'Saved unsubmitted travel requests awaiting completion.'
              : activeTab === 'past'
              ? 'Settled and completed company travel.'
              : 'Track active travel requests currently in review.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton
            onRefresh={() => refresh('EMPLOYEE')}
            isRefreshing={isRefreshing}
            lastSyncedAt={lastSyncedAt}
          />
          <button
            type="button"
            onClick={() => navigate('/travel/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-4" /> New Travel Request
          </button>
        </div>
      </div>

      {activeTab === 'present' && (
        <>
          <TravelMetricsGrid
            metrics={[
              { label: 'Active / In Review', value: presentRequests.length, subtext: 'In manager/admin review' },
              { label: 'Settled / Approved', value: pastRequests.filter((r) => ['SETTLED', 'APPROVED'].includes(r.status)).length, subtext: 'Completed trips' },
              { label: 'Total Expenditure', value: formatINR(totalSpent), isCurrency: true, subtext: 'Indian Rupees' },
            ]}
          />
          <TravelRequestsTable
            title="Active Travel Requests"
            requests={presentRequests}
            onAction={(req) => navigate(`/travel/requests/${req.id}`)}
            emptyMessage="No active travel requests in review."
          />
        </>
      )}

      {activeTab === 'revisions' && (
        <div className="flex flex-col gap-6">
          {revisionRequests.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-700 shrink-0" />
                <div className="text-xs text-ink">
                  <strong>{revisionRequests.length} request(s) require your revisions.</strong> Resubmissions strictly return to your Line Manager.
                </div>
              </div>
            </div>
          )}
          <TravelRequestsTable
            title="Requests Awaiting Revision"
            requests={revisionRequests}
            actionLabel="Fix & Resubmit"
            onAction={(req) => navigate(`/travel/requests/${req.id}/edit?tab=revisions`)}
            emptyMessage="No requests currently require revisions."
          />
        </div>
      )}

      {activeTab === 'drafts' && (
        <TravelRequestsTable
          title="Saved Travel Drafts"
          requests={draftRequests}
          actionLabel="Resume Draft"
          onAction={(req) => navigate(`/travel/requests/${req.id}/edit?tab=drafts`)}
          emptyMessage="You have no saved travel drafts."
        />
      )}

      {activeTab === 'past' && (
        <TravelRequestsTable
          title="Concluded & Settled Trips"
          requests={pastRequests}
          onAction={(req) => navigate(`/travel/requests/${req.id}?tab=past`)}
          emptyMessage="No completed or settled trips in archive."
        />
      )}
    </div>
  );
};
