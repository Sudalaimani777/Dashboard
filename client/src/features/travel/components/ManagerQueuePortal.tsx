import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { RefreshButton } from './shared/RefreshButton';
import { formatINR } from '../utils/currency';

export interface ManagerQueuePortalProps {
  activeTab?: string;
}

export const ManagerQueuePortal: React.FC<ManagerQueuePortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const { managerQueue, requests, loadManagerQueue, loadRequests, refresh, isRefreshing, lastSyncedAt } = useTravel();

  useEffect(() => {
    loadManagerQueue();
    loadRequests();
  }, [loadManagerQueue, loadRequests]);

  const pendingRequests = useMemo(
    () => managerQueue.filter((r) => ['SUBMITTED', 'PENDING_MANAGER_REVIEW'].includes(r.status)),
    [managerQueue]
  );

  const resubmittedRequests = useMemo(
    () =>
      managerQueue.filter(
        (r) =>
          r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' ||
          (r.status === 'PENDING_MANAGER_REVIEW' && (r.timeline?.length || 0) > 1)
      ),
    [managerQueue]
  );

  const personalSubmittedRequests = useMemo(
    () => requests.filter((r) => r.status !== 'DRAFT'),
    [requests]
  );

  const personalDraftRequests = useMemo(
    () => requests.filter((r) => r.status === 'DRAFT'),
    [requests]
  );

  const queueTotal = useMemo(
    () => pendingRequests.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0),
    [pendingRequests]
  );

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {activeTab === 'personal'
              ? 'My Personal Travel'
              : activeTab === 'drafts'
              ? 'Travel Drafts'
              : activeTab === 'revisions'
              ? 'Resubmitted Team Requests'
              : activeTab === 'past'
              ? 'Past Team Approvals History'
              : 'Line Manager Audit Queue'}
          </h1>
          <p className="text-xs text-muted">
            {activeTab === 'personal'
              ? 'Manage your own corporate trips as an Engineering team member.'
              : activeTab === 'drafts'
              ? 'Your personal unsubmitted travel drafts.'
              : activeTab === 'revisions'
              ? 'Team revisions and admin directives requiring re-verification.'
              : activeTab === 'past'
              ? 'Historical record of team travel decisions and audits.'
              : 'Tier 1 operational necessity and expense audit of direct reports.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RefreshButton
            onRefresh={() => refresh('MANAGER')}
            isRefreshing={isRefreshing}
            lastSyncedAt={lastSyncedAt}
          />
          {(activeTab === 'personal' || activeTab === 'drafts') && (
            <button
              type="button"
              onClick={() => navigate('/travel/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="size-4" /> Submit My Travel
            </button>
          )}
        </div>
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
          title="Team Revisions & Admin Directives"
          requests={resubmittedRequests}
          showRequester
          actionLabel="Audit & Action"
          onAction={(req) => navigate(`/travel/audit/${req.id}?tab=revisions`)}
          emptyMessage="No resubmitted requests or admin directives currently waiting for review."
        />
      )}

      {activeTab === 'past' && (
        <TravelRequestsTable
          title="Historical Team Approvals Archive"
          requests={managerQueue.filter((r) => ['APPROVED', 'SETTLED', 'REJECTED'].includes(r.status))}
          showRequester
          actionLabel="Inspect"
          onAction={(req) => navigate(`/travel/requests/${req.id}?tab=past`)}
          emptyMessage="No historical team approvals recorded."
        />
      )}

      {activeTab === 'personal' && (
        <TravelRequestsTable
          title="My Personal Travel Requests"
          requests={personalSubmittedRequests}
          actionLabel="Inspect"
          onAction={(req) => navigate(`/travel/requests/${req.id}?tab=personal`)}
          emptyMessage="You have not submitted any personal travel requests."
        />
      )}

      {activeTab === 'drafts' && (
        <TravelRequestsTable
          title="Saved Personal Drafts"
          requests={personalDraftRequests}
          actionLabel="Resume Draft"
          onAction={(req) => navigate(`/travel/requests/${req.id}/edit?tab=drafts`)}
          emptyMessage="You have no saved travel drafts."
        />
      )}
    </div>
  );
};
