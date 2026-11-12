import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { RefreshButton } from './shared/RefreshButton';
import { DepartmentBudgetsPage } from '../pages/DepartmentBudgetsPage';

export interface AdminGovernancePortalProps {
  activeTab?: string;
}

export const AdminGovernancePortal: React.FC<AdminGovernancePortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const { adminQueue, loadAdminQueue, refresh, isRefreshing, lastSyncedAt } = useTravel();

  useEffect(() => {
    loadAdminQueue();
  }, [loadAdminQueue]);

  const pendingRequests = useMemo(
    () => adminQueue.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL'),
    [adminQueue]
  );

  const dispatchedRevisions = useMemo(
    () => adminQueue.filter((r) => r.status.includes('REVISION_REQUESTED_BY_ADMIN')),
    [adminQueue]
  );

  const pastLedger = useMemo(
    () => adminQueue.filter((r) => ['SETTLED', 'APPROVED', 'REJECTED'].includes(r.status)),
    [adminQueue]
  );

  if (activeTab === 'budgets') {
    return <DepartmentBudgetsPage />;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {activeTab === 'revisions'
              ? 'Dispatched Revision Tracking'
              : activeTab === 'past'
              ? 'Corporate Travel Ledger Archive'
              : 'Corporate Governance Hub'}
          </h1>
          <p className="text-xs text-muted">
            Executive clearance, disbursement authorization, and budget oversight.
          </p>
        </div>

        <RefreshButton
          onRefresh={() => refresh('ADMIN')}
          isRefreshing={isRefreshing}
          lastSyncedAt={lastSyncedAt}
        />
      </div>

      {activeTab === 'present' && (
        <TravelRequestsTable
          title="Requests Awaiting Executive Action"
          requests={pendingRequests}
          showRequester
          actionLabel="Review & Clear"
          onAction={(req) => navigate(`/travel/clearance/${req.id}`)}
          emptyMessage="All manager-approved requests have been processed."
        />
      )}

      {activeTab === 'revisions' && (
        <TravelRequestsTable
          title="Active Dispatched Revisions"
          requests={dispatchedRevisions}
          showRequester
          actionLabel="View Status"
          onAction={(req) => navigate(`/travel/requests/${req.id}?tab=revisions`)}
          emptyMessage="No requests currently in revision dispatch."
        />
      )}

      {activeTab === 'past' && (
        <TravelRequestsTable
          title="Company-Wide Travel Ledger"
          requests={pastLedger}
          showRequester
          actionLabel="Inspect"
          onAction={(req) => navigate(`/travel/requests/${req.id}?tab=past`)}
          emptyMessage="No historical travel records found."
        />
      )}
    </div>
  );
};
