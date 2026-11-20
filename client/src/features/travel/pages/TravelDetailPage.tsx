import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  FileEdit,
  Trash2,
  Ban,
  Copy,
  Printer,
  Phone,
  Briefcase,
  MessageSquareText,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { useAuditDecision } from '../hooks/useAuditDecision';
import { ProofInspectorViewer } from '../components/audit/ProofInspectorViewer';
import { AuditTimelineLog } from '../components/audit/AuditTimelineLog';
import { AdminClearanceCard } from '../components/audit/AdminClearanceCard';
import { ManagerDecisionCard } from '../components/audit/ManagerDecisionCard';
import { BudgetImpactGauge } from '../components/audit/BudgetImpactGauge';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { RouteLabel } from '../components/shared/RouteLabel';
import { TravelDetailSkeleton } from '../components/shared/TravelDetailSkeleton';
import { InlineConfirmBar } from '../components/shared/InlineConfirmBar';
import { formatINR, formatForeignCurrency } from '../utils/currency';
import {
  aggregateExpenseItems,
  computeTripDuration,
  getFiscalQuarterFromDate,
} from '../utils/travelAnalytics';
import type { TravelRequest } from '../types/travel.types';

export const TravelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('tab');
  const { user } = useAuth();
  const { loadRequestDetails, cancelRequest, budget, loadBudget } = useTravel();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const returnTab = useMemo(() => {
    if (fromTab) return fromTab;
    if (user?.role === 'ADMIN') return 'governance';
    return 'present';
  }, [fromTab, user?.role]);

  const {
    isSubmitting: isAuditing,
    error: auditError,
    managerApprove,
    managerRequestRevision,
    managerReject,
    adminClearance,
    adminRevision,
    adminReject,
  } = useAuditDecision(id || '', returnTab);

  const backNav = useMemo(() => {
    if (fromTab === 'drafts') {
      return { label: 'Back to Travel Drafts', path: '/dashboard?tab=drafts' };
    }
    if (fromTab === 'governance') {
      return { label: 'Back to Travel Governance Queue', path: '/dashboard?tab=governance' };
    }
    if (fromTab === 'past') {
      if (user?.role === 'ADMIN') return { label: 'Back to Travel Governance Queue', path: '/dashboard?tab=governance' };
      if (user?.role === 'MANAGER') return { label: 'Back to Past Team Approvals History', path: '/dashboard?tab=past' };
      return { label: 'Back to Past Travel History', path: '/dashboard?tab=past' };
    }
    if (fromTab === 'revisions') {
      if (user?.role === 'ADMIN') return { label: 'Back to Travel Governance Queue', path: '/dashboard?tab=governance' };
      if (user?.role === 'MANAGER') return { label: 'Back to Resubmitted Team Requests', path: '/dashboard?tab=revisions' };
      return { label: 'Back to Action Required: Revisions', path: '/dashboard?tab=revisions' };
    }
    if (fromTab === 'personal') {
      return { label: 'Back to My Personal Travel', path: '/dashboard?tab=personal' };
    }
    if (user?.role === 'ADMIN') {
      return { label: 'Back to Travel Governance Queue', path: '/dashboard?tab=governance' };
    }
    return { label: 'Back to Dashboard', path: '/dashboard' };
  }, [fromTab, user?.role]);

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
        .then((req) => {
          setRequest(req);
          if (req && req.departureDate) {
            const { year, quarter } = getFiscalQuarterFromDate(req.departureDate);
            loadBudget(req.requesterDepartment || 'Engineering', year, quarter).catch(() => {});
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id, loadRequestDetails, loadBudget]);

  const duration = useMemo(
    () => computeTripDuration(request?.departureDate, request?.returnDate),
    [request?.departureDate, request?.returnDate]
  );

  const expenseSummary = useMemo(
    () => aggregateExpenseItems(request?.expenses || []),
    [request?.expenses]
  );

  const isBudgetOverflow = useMemo(() => {
    if (!budget || !request || budget.totalAllocation <= 0) return false;
    return budget.utilizedAmount + Number(request.totalExpenses || 0) > budget.totalAllocation;
  }, [budget, request]);

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

  // Review permissions and self-review guards
  const isAdminClearanceEligible = user?.role === 'ADMIN' && request.status === 'PENDING_ADMIN_APPROVAL';
  const isManagerAuditEligible =
    (request.status === 'PENDING_MANAGER_REVIEW' || request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER') &&
    (user?.role === 'MANAGER' || (user?.role === 'ADMIN' && !isOwner));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Top Header & Navigation */}
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
          <TravelStatusBadge status={request.status} />
          <span className="text-sm font-mono tabular-nums font-bold text-primary pl-1">
            {formatINR(request.totalExpenses)}
          </span>
        </div>
      </div>

      {(actionError || auditError) && (
        <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive font-medium">
          {actionError || auditError}
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

      {/* Title + Metadata Card */}
      <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          </div>
        </div>

        {/* Date & Duration Badge shifted to the right place */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-subtle border border-border-warm text-xs font-mono text-ink shrink-0">
          <Calendar className="size-4 text-primary shrink-0" />
          <span>
            {request.departureDate} to {request.returnDate}{' '}
            <span className="text-muted font-sans font-medium">({duration.label})</span>
          </span>
        </div>
      </div>

      {/* Owner Action Banners */}
      {isOwner && request.status === 'DRAFT' && (
        <div className="flex flex-col gap-3">
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <FileEdit className="size-5 text-amber-700 shrink-0" />
              <div className="text-xs text-ink">
                <strong>Saved Travel Draft:</strong> This request is currently saved as an unsubmitted draft.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={confirmCancel}
                onClick={() => setConfirmCancel(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-50 text-destructive text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 active:scale-[0.98] disabled:opacity-50 flex-1 sm:flex-initial"
              >
                <Trash2 className="size-4" /> Discard Draft
              </button>
              <button
                type="button"
                onClick={() => navigate(`/travel/requests/${request.id}/edit?tab=drafts`)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 flex-1 sm:flex-initial"
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

      {/* Employee Revision Banner */}
      {isOwner && request.status.includes('REVISION') && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-700 shrink-0" />
            <div className="text-xs text-ink">
              <strong>Employee Revision Required:</strong> Your request requires corrections before it can proceed.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/travel/requests/${request.id}/edit`)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            Fix & Resubmit Request <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* Self-Review Guard Banners */}
      {isOwner && request.status === 'PENDING_ADMIN_APPROVAL' && user?.role === 'ADMIN' && (
        <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shadow-2xs">
          <ShieldAlert className="size-4 text-amber-700 shrink-0" />
          <span>
            <strong>Self-Review Guard:</strong> You submitted this travel request. Corporate governance policies prohibit approving or clearing your own personal travel request.
          </span>
        </div>
      )}

      {isOwner && request.status === 'PENDING_MANAGER_REVIEW' && (user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
        <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shadow-2xs">
          <ShieldAlert className="size-4 text-amber-700 shrink-0" />
          <span>
            <strong>Self-Review Guard:</strong> You submitted this travel request. Line managers cannot audit or clear their own travel. This request has been escalated to Corporate Admin for Tier 1 clearance.
          </span>
        </div>
      )}

      {/* Polymorphic Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Evidence Viewer & Audit Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <ProofInspectorViewer proofUrl={request.supportingDocUrl} docs={request.supportingDocs} title={request.title} />
          <AuditTimelineLog timeline={request.timeline} />
        </div>

        {/* Right Column: In-situ Action Cards & Financial Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* 1. Admin Clearance Decision Panel (In-situ Workstation) */}
          {isAdminClearanceEligible && !isOwner && (
            <div className="flex flex-col gap-5">
              <BudgetImpactGauge
                budget={budget}
                requestAmount={Number(request.totalExpenses || 0)}
              />
              <AdminClearanceCard
                travelType={request.travelType}
                isSubmitting={isAuditing}
                isBudgetOverflow={isBudgetOverflow}
                onClearance={adminClearance}
                onRevision={adminRevision}
                onReject={adminReject}
              />
            </div>
          )}

          {/* 2. Manager Audit Decision Panel (In-situ Workstation) */}
          {isManagerAuditEligible && !isOwner && (
            <ManagerDecisionCard
              status={request.status}
              isSubmitting={isAuditing}
              onApprove={managerApprove}
              onRequestRevision={managerRequestRevision}
              onReject={managerReject}
            />
          )}

          {/* 3. Itemized Expenses with Category Bar */}
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
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-mono tabular-nums font-bold text-primary">
                      {formatINR(exp.amount)}
                    </span>
                    {(exp.originalCurrency || (exp as any).original_currency) &&
                      (exp.originalCurrency || (exp as any).original_currency) !== 'INR' && (
                        <span className="text-[10px] font-mono tabular-nums text-muted">
                          {formatForeignCurrency(
                            exp.originalAmount || (exp as any).original_amount,
                            exp.originalCurrency || (exp as any).original_currency
                          )}{' '}
                          @ ₹{Number(exp.exchangeRate || (exp as any).exchange_rate || 1).toFixed(2)}
                        </span>
                      )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-border-warm flex items-center justify-between text-xs">
              <span className="text-muted">Daily average ({duration.days} day{duration.days > 1 ? 's' : ''})</span>
              <span className="font-mono font-semibold text-ink tabular-nums">{formatINR(avgPerDay)} / day</span>
            </div>
          </div>

          {/* 4. Business Justification & Safety Metadata */}
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

          {/* 5. Reviewer Sign-off & Remarks Card (Mounted for all or read-only view) */}
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
