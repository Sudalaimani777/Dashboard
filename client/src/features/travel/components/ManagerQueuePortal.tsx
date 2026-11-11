import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { formatINR } from '../utils/currency';

export interface ManagerQueuePortalProps {
  activeTab?: string;
}

export const ManagerQueuePortal: React.FC<ManagerQueuePortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const { managerQueue, requests, loadManagerQueue, loadRequests } = useTravel();

  useEffect(() => {
    loadManagerQueue();
    loadRequests();
  }, [loadManagerQueue, loadRequests]);

  const pendingRequests = useMemo(
    () => managerQueue.filter((r) => ['SUBMITTED', 'PENDING_MANAGER_REVIEW'].includes(r.status)),
    [managerQueue]
  );

  const resubmittedRequests = useMemo(
    () => managerQueue.filter((r) => r.status === 'PENDING_MANAGER_REVIEW' && (r.timeline?.length || 0) > 1),
    [managerQueue]
  );

  const queueTotal = useMemo(
    () => pendingRequests.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [pendingRequests]
  );

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#2B231D] tracking-tight">
            {activeTab === 'personal'
              ? 'My Personal Travel'
              : activeTab === 'revisions'
              ? 'Resubmitted Team Requests'
              : activeTab === 'past'
              ? 'Past Team Approvals History'
              : 'Line Manager Audit Queue'}
          </h1>
          <p className="text-xs text-[#756F68]">
            {activeTab === 'personal'
              ? 'Manage your own corporate trips as an Engineering team member.'
              : 'Tier 1 operational necessity and expense audit of direct reports.'}
          </p>
        </div>

        {activeTab === 'personal' && (
          <button
            type="button"
            onClick={() => navigate('/travel/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8A582B] hover:bg-[#754820] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Submit My Travel
          </button>
        )}
      </div>

      {activeTab === 'present' && (
        <>
          <TravelMetricsGrid
            metrics={[
              { label: 'Pending Audit', value: pendingRequests.length, subtext: 'Direct reports awaiting review' },
              { label: 'Total Queue Value', value: formatINR(queueTotal), isCurrency: true, subtext: 'Estimated commitments' },
            ]}
          />
          <TravelRequestsTable
            title="Direct Reports Awaiting Initial Audit"
            requests={pendingRequests}
            showRequester
            actionLabel="Audit Proofs"
            onAction={(req) => navigate(`/travel/audit/${req.id}`)}
            emptyMessage="All direct report submissions are up to date."
          />
        </>
      )}

      {activeTab === 'revisions' && (
        <TravelRequestsTable
          title="Resubmitted Requests for Re-Audit"
          requests={resubmittedRequests}
          showRequester
          actionLabel="Re-Audit"
          onAction={(req) => navigate(`/travel/audit/${req.id}`)}
          emptyMessage="No resubmitted requests currently waiting for re-verification."
        />
      )}

      {activeTab === 'past' && (
        <TravelRequestsTable
          title="Historical Team Approvals Archive"
          requests={managerQueue.filter((r) => ['APPROVED', 'SETTLED', 'REJECTED'].includes(r.status))}
          showRequester
          onAction={(req) => navigate(`/travel/audit/${req.id}`)}
          emptyMessage="No historical team approvals recorded."
        />
      )}

      {activeTab === 'personal' && (
        <TravelRequestsTable
          title="My Personal Travel Requests"
          requests={requests}
          actionLabel="Inspect"
          onAction={(req) => navigate(`/travel/requests/${req.id}`)}
          emptyMessage="You have not submitted any personal travel requests."
        />
      )}
    </div>
  );
};
