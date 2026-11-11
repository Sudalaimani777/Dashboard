import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { DepartmentBudgetCard } from './DepartmentBudgetCard';
import { DepartmentBudgetsPage } from '../pages/DepartmentBudgetsPage';

export interface AdminGovernancePortalProps {
  activeTab?: string;
}

export const AdminGovernancePortal: React.FC<AdminGovernancePortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const { adminQueue, budget, loadAdminQueue, loadBudget } = useTravel();

  useEffect(() => {
    loadAdminQueue();
    loadBudget('Engineering', 2026, 'Q4');
  }, [loadAdminQueue, loadBudget]);

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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#2B231D] tracking-tight">
          {activeTab === 'revisions'
            ? 'Dispatched Revision Tracking'
            : activeTab === 'past'
            ? 'Corporate Travel Ledger Archive'
            : 'Corporate Governance Hub'}
        </h1>
        <p className="text-xs text-[#756F68]">
          Tier 2 executive clearance, disbursement authorization, and budget oversight.
        </p>
      </div>

      {activeTab === 'present' && (
        <>
          <DepartmentBudgetCard budget={budget} />
          <TravelRequestsTable
            title="Requests Awaiting Executive Action"
            requests={pendingRequests}
            showRequester
            actionLabel="Review & Clear"
            onAction={(req) => navigate(`/travel/clearance/${req.id}`)}
            emptyMessage="All manager-approved requests have been processed."
          />
        </>
      )}

      {activeTab === 'revisions' && (
        <TravelRequestsTable
          title="Active Dispatched Revisions"
          requests={dispatchedRevisions}
          showRequester
          actionLabel="View Status"
          onAction={(req) => navigate(`/travel/clearance/${req.id}`)}
          emptyMessage="No requests currently in revision dispatch."
        />
      )}

      {activeTab === 'past' && (
        <TravelRequestsTable
          title="Company-Wide Travel Ledger"
          requests={pastLedger}
          showRequester
          onAction={(req) => navigate(`/travel/clearance/${req.id}`)}
          emptyMessage="No historical travel records found."
        />
      )}
    </div>
  );
};
