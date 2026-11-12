import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  FileEdit,
  Trash2,
  Ban,
  Copy,
  Printer,
  Phone,
  Briefcase,
  CheckCircle2,
  MessageSquareText,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { ProofInspectorViewer } from '../components/audit/ProofInspectorViewer';
import { AuditTimelineLog } from '../components/audit/AuditTimelineLog';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { RefreshButton } from '../components/shared/RefreshButton';
import { RouteLabel } from '../components/shared/RouteLabel';
import { TravelDetailSkeleton } from '../components/shared/TravelDetailSkeleton';
import { InlineConfirmBar } from '../components/shared/InlineConfirmBar';
import { formatINR } from '../utils/currency';
import { aggregateExpenseItems, computeTripDuration } from '../utils/travelAnalytics';
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
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
    setIsCancelling(true);
    setActionError(null);
    try {
      const updated = await cancelRequest(
        id,
        isDraft ? 'Draft discarded by requester' : 'Cancelled by requester'
      );
      setRequest(updated);
      setConfirmCancel(false);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Failed to cancel request');
    } finally {
      setIsCancelling(false);
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

  const duration = useMemo(
    () => computeTripDuration(request?.departureDate, request?.returnDate),
    [request?.departureDate, request?.returnDate]
  );

  const expenseSummary = useMemo(
    () => aggregateExpenseItems(request?.expenses || []),
    [request?.expenses]
  );

  const workflowStages = useMemo(() => {
    if (!request) return [];
    const s = request.status;
    const isTerminalBad = s === 'REJECTED' || s === 'CANCELLED';
    const submittedDone = s !== 'DRAFT';
    const managerDone = [
      'PENDING_ADMIN_APPROVAL',
      'APPROVED',
      'SETTLED',
      'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE',
      'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER',
    ].includes(s);
    const adminDone = s === 'APPROVED' || s === 'SETTLED';
    const settledDone = s === 'SETTLED';

    return [
      { label: 'Submitted', done: submittedDone, active: s === 'DRAFT' },
      {
        label: 'Manager Audit',
        done: managerDone,
        active: s === 'PENDING_MANAGER_REVIEW' || s === 'REVISION_REQUESTED_BY_MANAGER',
      },
      {
        label: 'Admin Clearance',
        done: adminDone,
        active: s === 'PENDING_ADMIN_APPROVAL' || s.includes('REVISION_REQUESTED_BY_ADMIN'),
      },
      {
        label: isTerminalBad ? (s === 'REJECTED' ? 'Rejected' : 'Cancelled') : request.travelType === 'UPCOMING' ? 'Approved' : 'Settled',
        done: settledDone || (s === 'APPROVED' && request.travelType === 'UPCOMING'),
        active: s === 'APPROVED' && request.travelType === 'ALREADY_TRAVELLED',
        isError: isTerminalBad,
      },
    ];
  }, [request]);

  if (isLoading || !request) {
    return <TravelDetailSkeleton />;
  }

  const isOwner = user?.id === request.userId;
  const isCancellable =
    isOwner &&
    ['PENDING_MANAGER_REVIEW', 'REVISION_REQUESTED_BY_MANAGER', 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'].includes(
      request.status
    );
  const avgPerDay = duration.days > 0 ? Number(request.totalExpenses) / duration.days : Number(request.totalExpenses);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(backNav.path)}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" /> {backNav.label}
        </button>
        <div className="flex flex-wrap items-center gap-2.5">
          {isOwner && (
            <button
              type="button"
              onClick={() => navigate(`/travel/new?clone=${request.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle text-ink text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]"
            >
              <Copy className="size-3.5 text-primary" /> Clone Trip
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle text-ink text-xs font-semibold transition-all cursor-pointer print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]"
          >
            <Printer className="size-3.5 text-muted" /> Print Summary
          </button>
          {isCancellable && (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-50 text-destructive text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 active:scale-[0.98]"
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
          <span className="text-sm font-mono tabular-nums font-bold text-primary pl-1">
            {formatINR(request.totalExpenses)}
          </span>
        </div>
      </div>

      {actionError && (
        <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive font-medium">
          {actionError}
        </div>
      )}

      {confirmCancel && request.status !== 'DRAFT' && (
        <InlineConfirmBar
          message="Withdraw and cancel this travel request from the approval queue?"
          confirmLabel="Confirm Cancellation"
          isBusy={isCancelling}
          onConfirm={handleCancel}
          onCancel={() => setConfirmCancel(false)}
        />
      )}

      {/* Title + Metadata + Approval Stage Stepper */}
      <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-ink tracking-tight">{request.title}</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-surface-subtle border border-border-warm text-muted">
              {request.projectCode}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary">
              {request.travelType === 'UPCOMING' ? 'Pre-Trip Authorization' : 'Post-Trip Reimbursement'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <UserIcon className="size-3.5 text-primary" />
              {request.requesterName} • {request.requesterDepartment || 'Engineering'}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              <RouteLabel origin={request.origin} destination={request.destination} />
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="size-3.5" /> {request.departureDate} to {request.returnDate} ({duration.label})
            </span>
          </div>
        </div>

        {/* 4-Stage Progress Bar */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {workflowStages.map((stage, i) => (
            <React.Fragment key={stage.label}>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${
                  stage.isError
                    ? 'bg-red-50 border-red-200 text-destructive'
                    : stage.done
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : stage.active
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-surface-subtle border-border-warm text-muted'
                }`}
              >
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>{stage.label}</span>
              </div>
              {i < workflowStages.length - 1 && (
                <ChevronRight className="size-3 text-muted/60 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Role-Specific Direct Action Banners */}
      {isOwner && request.status === 'DRAFT' && (
        <div className="flex flex-col gap-3">
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
                disabled={confirmCancel}
                onClick={() => setConfirmCancel(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-50 text-destructive text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 active:scale-[0.98] disabled:opacity-50"
              >
                <Trash2 className="size-4" /> Discard Draft
              </button>
              <button
                type="button"
                onClick={() => navigate(`/travel/requests/${request.id}/edit?tab=drafts`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Resume & Submit <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {confirmCancel && (
            <InlineConfirmBar
              message="Discard this saved draft permanently? This action cannot be undone."
              confirmLabel="Confirm Discard"
              isBusy={isCancelling}
              onConfirm={handleCancel}
              onCancel={() => setConfirmCancel(false)}
            />
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 flex flex-col gap-5">
          <ProofInspectorViewer proofUrl={request.supportingDocUrl} title={request.title} />
          <AuditTimelineLog timeline={request.timeline} />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Itemized Expenses with Category Bar + Footer */}
          <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <h3 className="text-sm font-semibold text-ink">
                Itemized Expenses ({request.expenses?.length || 0})
              </h3>
              <span className="text-sm font-mono font-bold tabular-nums text-primary">
                {formatINR(request.totalExpenses)}
              </span>
            </div>

            {expenseSummary.categories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden flex">
                  {expenseSummary.categories.map((cat) => (
                    <div
                      key={cat.category}
                      title={`${cat.label}: ${formatINR(cat.total)} (${cat.percentage}%)`}
                      style={{ width: `${Math.max(cat.percentage, 3)}%`, backgroundColor: cat.color }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                  {expenseSummary.categories.map((cat) => (
                    <span key={cat.category} className="inline-flex items-center gap-1">
                      <span className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.shortLabel} {cat.percentage}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="divide-y divide-border-warm/80">
              {request.expenses?.map((exp) => (
                <div
                  key={exp.id}
                  className="flex justify-between items-start gap-2 text-xs py-2.5 first:pt-1 last:pb-1"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-ink">{exp.merchant}</span>
                    <span className="text-[10px] text-muted">
                      {exp.category ? String(exp.category).replace(/_/g, ' ') : 'MISC'}
                      {exp.expenseDate ? ` • ${exp.expenseDate}` : ''}
                    </span>
                    {exp.notes && (
                      <span className="text-[11px] text-faint mt-0.5 truncate">{exp.notes}</span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums font-bold text-primary shrink-0">
                    {formatINR(exp.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-border-warm flex items-center justify-between text-xs">
              <span className="text-muted">Daily average ({duration.days} day{duration.days > 1 ? 's' : ''})</span>
              <span className="font-mono font-semibold text-ink tabular-nums">{formatINR(avgPerDay)} / day</span>
            </div>
          </div>

          {/* Business Justification & Safety Metadata */}
          <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3 shadow-xs">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2 border-b border-border-warm pb-2.5">
              <Briefcase className="size-4 text-primary" /> Business Purpose & Logistics
            </h3>
            <p className="text-xs text-ink leading-relaxed bg-surface-subtle/70 p-3 rounded-lg">
              {request.purpose || 'No business justification provided.'}
            </p>
            <div className="divide-y divide-border-warm/80 text-xs">
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-muted">Project Code</span>
                <span className="font-mono font-semibold text-ink">{request.projectCode}</span>
              </div>
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="text-muted">Duration</span>
                <span className="font-semibold text-ink">{duration.label}</span>
              </div>
              <div className="pt-2 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Phone className="size-3 text-primary" /> Emergency Contact
                  </span>
                  <span className="font-semibold text-ink">
                    {request.emergencyContactName || 'Not specified'}
                  </span>
                </div>
                <span className="font-mono text-xs text-muted">
                  {request.emergencyContactPhone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Reviewer Sign-off & Remarks Card */}
          <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3 shadow-xs">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2 border-b border-border-warm pb-2.5">
              <MessageSquareText className="size-4 text-primary" /> Reviewer Sign-Off & Remarks
            </h3>
            <div className="divide-y divide-border-warm/80 text-xs">
              <div className="py-2.5 first:pt-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">
                    Line Manager {request.managerName ? `(${request.managerName})` : ''}
                  </span>
                  <span className="text-[10px] font-mono text-faint">
                    {request.managerReviewedAt
                      ? new Date(request.managerReviewedAt).toLocaleDateString()
                      : 'Pending'}
                  </span>
                </div>
                <p className="text-[11px] text-muted italic">
                  {request.managerRemarks ? `“${request.managerRemarks}”` : 'No remarks recorded.'}
                </p>
              </div>

              <div className="pt-2.5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">
                    Corporate Admin {request.adminName ? `(${request.adminName})` : ''}
                  </span>
                  <span className="text-[10px] font-mono text-faint">
                    {request.adminReviewedAt
                      ? new Date(request.adminReviewedAt).toLocaleDateString()
                      : 'Pending'}
                  </span>
                </div>
                <p className="text-[11px] text-muted italic">
                  {request.adminRemarks ? `“${request.adminRemarks}”` : 'No remarks recorded.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
