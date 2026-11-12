import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Calendar, MapPin, AlertTriangle, ShieldCheck, ChevronRight, FileEdit, Trash2, Ban } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { ProofInspectorViewer } from '../components/audit/ProofInspectorViewer';
import { AuditTimelineLog } from '../components/audit/AuditTimelineLog';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { RefreshButton } from '../components/shared/RefreshButton';
import { formatINR } from '../utils/currency';
import type { TravelRequest } from '../types/travel.types';

export const TravelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('tab');
  const { user } = useAuth();
  const { loadRequestDetails, cancelRequest, isRefreshing, lastSyncedAt } = useTravel();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const backNav = useMemo(() => {
    if (fromTab === 'drafts') {
      return { label: 'Back to Travel Drafts', path: '/dashboard?tab=drafts' };
    }
    if (fromTab === 'past') {
      if (user?.role === 'ADMIN') return { label: 'Back to Corporate Travel Ledger Archive', path: '/dashboard?tab=past' };
      if (user?.role === 'MANAGER') return { label: 'Back to Past Team Approvals History', path: '/dashboard?tab=past' };
      return { label: 'Back to Past Travel History', path: '/dashboard?tab=past' };
    }
    if (fromTab === 'revisions') {
      if (user?.role === 'ADMIN') return { label: 'Back to Dispatched Revisions', path: '/dashboard?tab=revisions' };
      if (user?.role === 'MANAGER') return { label: 'Back to Resubmitted Team Requests', path: '/dashboard?tab=revisions' };
      return { label: 'Back to Action Required: Revisions', path: '/dashboard?tab=revisions' };
    }
    if (fromTab === 'personal') {
      return { label: 'Back to My Personal Travel', path: '/dashboard?tab=personal' };
    }
    return { label: 'Back to Dashboard', path: '/dashboard' };
  }, [fromTab, user?.role]);

  const handleRefresh = async () => {
    if (!id) return;
    try {
      const data = await loadRequestDetails(id);
      setRequest(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!id || !request) return;
    const isDraft = request.status === 'DRAFT';
    const confirmMessage = isDraft
      ? 'Are you sure you want to discard this draft? This cannot be undone.'
      : 'Are you sure you want to cancel and withdraw this travel request?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const updated = await cancelRequest(id, isDraft ? 'Draft discarded by requester' : 'Cancelled by requester');
      setRequest(updated);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to cancel request');
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
    return <div className="p-8 text-center text-xs text-muted">Loading travel request details...</div>;
  }

  const isOwner = user?.id === request.userId;
  const isCancellable =
    isOwner &&
    ['PENDING_MANAGER_REVIEW', 'REVISION_REQUESTED_BY_MANAGER', 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'].includes(
      request.status
    );

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(backNav.path)}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" /> {backNav.label}
        </button>
        <div className="flex items-center gap-3">
          {isCancellable && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-destructive text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Ban className="size-3.5" /> Cancel Request
            </button>
          )}
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
            {request.requesterName} • {request.requesterDepartment || 'Engineering'}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {request.origin} → {request.destination}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="size-3.5" /> {request.departureDate} to {request.returnDate}
          </span>
        </div>
      </div>

      {/* Role-Specific Direct Action Banners */}
      {isOwner && request.status === 'DRAFT' && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <FileEdit className="size-5 text-amber-700 shrink-0" />
            <div className="text-xs text-ink">
              <strong>Saved Travel Draft:</strong> This request is currently saved as an unsubmitted draft.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-destructive text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="size-4" /> Discard Draft
            </button>
            <button
              type="button"
              onClick={() => navigate(`/travel/requests/${request.id}/edit?tab=drafts`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Resume & Submit <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {user?.role === 'MANAGER' &&
        (request.status === 'PENDING_MANAGER_REVIEW' ||
          request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER') && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-amber-700 shrink-0" />
              <div className="text-xs text-ink">
                <strong>Manager Action Required:</strong>{' '}
                {request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER'
                  ? 'Corporate Admin has dispatched this trip back to you for alteration instructions.'
                  : 'This trip is awaiting your line manager audit and clearance.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/travel/audit/${request.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Open Audit Workstation <ChevronRight className="size-4" />
            </button>
          </div>
        )}

      {user?.role === 'ADMIN' && request.status === 'PENDING_ADMIN_APPROVAL' && (
        <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-sky-700 shrink-0" />
            <div className="text-xs text-ink">
              <strong>Admin Action Required:</strong> This request is manager-approved and awaiting corporate clearance.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/travel/clearance/${request.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Open Clearance Workstation <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {user?.id === request.userId && request.status.includes('REVISION') && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-700 shrink-0" />
            <div className="text-xs text-ink">
              <strong>Employee Revision Required:</strong> Your request requires corrections before it can proceed.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/travel/requests/${request.id}/edit`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Fix & Resubmit Request <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ProofInspectorViewer proofUrl={request.supportingDocUrl} title={request.title} />
          <AuditTimelineLog timeline={request.timeline} />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
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
