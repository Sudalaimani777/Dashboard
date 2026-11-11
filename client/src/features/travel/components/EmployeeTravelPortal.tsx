import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelRequestsTable } from './tables/TravelRequestsTable';
import { TravelMetricsGrid } from './shared/TravelMetricsGrid';
import { ResubmitRequestModal } from './ResubmitRequestModal';
import { formatINR } from '../utils/currency';
import type { TravelRequest } from '../types/travel.types';

export interface EmployeeTravelPortalProps {
  activeTab?: string;
}

export const EmployeeTravelPortal: React.FC<EmployeeTravelPortalProps> = ({ activeTab = 'present' }) => {
  const navigate = useNavigate();
  const { requests, loadRequests, resubmitRequest } = useTravel();
  const [resubmitTarget, setResubmitTarget] = useState<TravelRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const presentRequests = useMemo(
    () => requests.filter((r) => !['SETTLED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(r.status)),
    [requests]
  );

  const revisionRequests = useMemo(
    () => requests.filter((r) => r.status.includes('REVISION_REQUESTED')),
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
          <h1 className="text-2xl font-bold text-[#2B231D] tracking-tight">
            {activeTab === 'revisions' ? 'Action Required: Revisions' : activeTab === 'past' ? 'Past Travel History' : 'My Travel Dashboard'}
          </h1>
          <p className="text-xs text-[#756F68]">
            {activeTab === 'revisions' ? 'Trips requiring updated quotes or receipts.' : activeTab === 'past' ? 'Settled and completed company travel.' : 'Track active travel requests and reimbursements.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/travel/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8A582B] hover:bg-[#754820] text-white text-xs font-semibold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Travel Request
        </button>
      </div>

      {activeTab === 'present' && (
        <>
          <TravelMetricsGrid
            metrics={[
              { label: 'Active / In Review', value: presentRequests.length, subtext: 'In manager/admin review' },
              { label: 'Settled / Approved', value: pastRequests.length, subtext: 'Completed trips' },
              { label: 'Total Expenditure', value: formatINR(totalSpent), isCurrency: true, subtext: 'Indian Rupees' },
            ]}
          />
          <TravelRequestsTable
            title="Active Travel Requests"
            requests={presentRequests}
            onAction={(req) => navigate(`/travel/requests/${req.id}`)}
          />
        </>
      )}

      {activeTab === 'revisions' && (
        <div className="flex flex-col gap-6">
          {revisionRequests.length > 0 && (
            <div className="bg-[#FEF9E7] border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#B9770E]" />
                <div className="text-xs text-[#2B231D]">
                  <strong>{revisionRequests.length} request(s) require your revisions.</strong> Resubmissions strictly return to your Line Manager.
                </div>
              </div>
            </div>
          )}
          <TravelRequestsTable
            title="Requests Awaiting Revision"
            requests={revisionRequests}
            actionLabel="Fix & Resubmit"
            onAction={setResubmitTarget}
            emptyMessage="No requests currently require revisions."
          />
        </div>
      )}

      {activeTab === 'past' && (
        <TravelRequestsTable
          title="Concluded & Settled Trips"
          requests={pastRequests}
          onAction={(req) => navigate(`/travel/requests/${req.id}`)}
          emptyMessage="No completed or settled trips in archive."
        />
      )}

      {resubmitTarget && (
        <ResubmitRequestModal
          request={resubmitTarget}
          isOpen={Boolean(resubmitTarget)}
          onClose={() => setResubmitTarget(null)}
          onSubmit={async (id, input) => {
            await resubmitRequest(id, input);
            setResubmitTarget(null);
          }}
        />
      )}
    </div>
  );
};
