import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Calendar, MapPin, AlertTriangle } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { useAuditDecision } from '../hooks/useAuditDecision';
import { ProofInspectorViewer } from '../components/audit/ProofInspectorViewer';
import { ManagerDecisionCard } from '../components/audit/ManagerDecisionCard';
import { AuditTimelineLog } from '../components/audit/AuditTimelineLog';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { RefreshButton } from '../components/shared/RefreshButton';
import { formatINR } from '../utils/currency';
import type { TravelRequest } from '../types/travel.types';

export const ManagerAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('tab');
  const { loadRequestDetails, isRefreshing, lastSyncedAt } = useTravel();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isSubmitting, error, managerApprove, managerRequestRevision } = useAuditDecision(id || '');

  // Concluded trips redirect to read-only summary workstation
  useEffect(() => {
    if (request && ['APPROVED', 'SETTLED', 'REJECTED'].includes(request.status)) {
      navigate(`/travel/requests/${request.id}?tab=past`, { replace: true });
    }
  }, [request, navigate]);

  const handleRefresh = async () => {
    if (!id) return;
    try {
      const data = await loadRequestDetails(id);
      setRequest(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      loadRequestDetails(id)
        .then(setRequest)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id, loadRequestDetails]);

  if (isLoading || !request) {
    return (
      <div className="p-8 text-center text-xs text-muted">
        Loading audit workstation...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(fromTab ? `/dashboard?tab=${fromTab}` : '/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" /> {fromTab === 'revisions' ? 'Back to Revised Requests' : 'Back to Team Queue'}
        </button>
        <div className="flex items-center gap-3">
          <RefreshButton
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            lastSyncedAt={lastSyncedAt}
          />
          <TravelStatusBadge status={request.status} />
          <span className="text-sm font-mono tabular-nums font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-border-warm">
            {formatINR(request.totalExpenses)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight">{request.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-1">
          <span className="flex items-center gap-1 font-semibold text-ink">
            <UserIcon className="size-3.5 text-primary" />
            {request.requesterName || 'Employee'} ({request.requesterEmail})
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {request.origin} → {request.destination}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="size-3.5" /> {request.departureDate} to {request.returnDate}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Admin Revision Directive Banner */}
      {request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Executive Governance Directive from Corporate Admin</span>
          </div>
          <div className="bg-surface/90 border border-amber-300/50 rounded-lg p-3 text-xs text-ink font-mono italic">
            "{request.adminRemarks || 'Please review itemized quotes with employee or supply business justification.'}"
          </div>
          <p className="text-[11px] text-amber-700">
            You can either pass revision instructions to the employee (routes to employee for correction), or provide operational justification and re-forward directly to Corporate Admin.
          </p>
        </div>
      )}

      {/* Split Audit Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Proof Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ProofInspectorViewer proofUrl={request.supportingDocUrl} title={request.title} />
          <AuditTimelineLog timeline={request.timeline} />
        </div>

        {/* Right: Decision Panel & Expenses */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <ManagerDecisionCard
            status={request.status}
            isSubmitting={isSubmitting}
            onApprove={managerApprove}
            onRequestRevision={managerRequestRevision}
          />

          {/* Itemized Expenses Card */}
          <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Itemized Expenses ({request.expenses?.length || 0})
            </h3>
            <div className="flex flex-col gap-2">
              {request.expenses?.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center text-xs p-2.5 bg-surface-subtle rounded-xl border border-border-warm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink">{exp.merchant}</span>
                    <span className="text-[10px] text-muted">{exp.category ? String(exp.category).replace(/_/g, ' ') : 'MISC'}</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-primary">
                    {formatINR(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
