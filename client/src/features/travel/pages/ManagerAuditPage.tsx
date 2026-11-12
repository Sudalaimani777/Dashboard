import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  MapPin,
  AlertTriangle,
  Briefcase,
  Phone,
  ExternalLink,
  MessageSquareText,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { useAuditDecision } from '../hooks/useAuditDecision';
import { ProofInspectorViewer } from '../components/audit/ProofInspectorViewer';
import { ManagerDecisionCard } from '../components/audit/ManagerDecisionCard';
import { AuditTimelineLog } from '../components/audit/AuditTimelineLog';
import { CategorySpendBreakdownCard } from '../components/employee/CategorySpendBreakdownCard';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { RouteLabel } from '../components/shared/RouteLabel';
import { TravelDetailSkeleton } from '../components/shared/TravelDetailSkeleton';
import { formatINR } from '../utils/currency';
import {
  aggregateExpenseItems,
  computeTripDuration,
  EXPENSE_CATEGORY_META,
} from '../utils/travelAnalytics';
import {
  getLatestResubmissionNote,
  isManagerReviewableStatus,
} from '../utils/managerQueue';
import type { ExpenseCategory, TravelRequest } from '../types/travel.types';

export const ManagerAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('tab');
  const { user } = useAuth();
  const { loadRequestDetails } = useTravel();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const returnTab = fromTab === 'revisions' ? 'revisions' : 'present';
  const {
    isSubmitting,
    error,
    managerApprove,
    managerRequestRevision,
    managerReject,
  } = useAuditDecision(id || '', returnTab);

  // Guard: prevent self-review on personal requests & redirect non-reviewable statuses to read-only detail
  useEffect(() => {
    if (!request) return;
    if (user?.id && request.userId === user.id) {
      navigate(`/travel/requests/${request.id}?tab=personal`, { replace: true });
      return;
    }
    if (!isManagerReviewableStatus(request.status)) {
      navigate(`/travel/requests/${request.id}?tab=${fromTab || 'past'}`, { replace: true });
    }
  }, [request, user?.id, navigate, fromTab]);

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

  const expenseBreakdown = useMemo(
    () => aggregateExpenseItems(request?.expenses || []),
    [request?.expenses]
  );

  const resubmissionNote = useMemo(
    () => (request ? getLatestResubmissionNote(request) : null),
    [request]
  );

  if (isLoading || !request) {
    return <TravelDetailSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(fromTab ? `/dashboard?tab=${fromTab}` : '/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" />
          {user?.role === 'ADMIN'
            ? 'Back to Governance Hub'
            : fromTab === 'revisions'
            ? 'Back to Revised Requests'
            : 'Back to Team Audit Queue'}
        </button>
        <div className="flex flex-wrap items-center gap-2.5">
          <TravelStatusBadge status={request.status} />
          <span className="text-sm font-mono tabular-nums font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-border-warm">
            {formatINR(request.totalExpenses)}
          </span>
        </div>
      </div>

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
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-0.5">
          <span className="flex items-center gap-1 font-semibold text-ink">
            <UserIcon className="size-3.5 text-primary" />
            {request.requesterName || 'Employee'}
            {request.requesterEmail ? ` (${request.requesterEmail})` : ''}
            {request.requesterDepartment ? ` • ${request.requesterDepartment}` : ''}
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

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Admin Revision Directive Banner */}
      {request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Admin Revision Directive</span>
          </div>
          <p className="border-l-2 border-amber-600/60 pl-3 py-0.5 text-xs text-ink font-mono">
            {request.adminRemarks || 'Please review itemized quotes with employee or supply business justification.'}
          </p>
          <p className="text-[11px] text-amber-800">
            Pass revision instructions to the employee for edits, clarify with justification for Admin, or reject this request.
          </p>
        </div>
      )}

      {/* Employee Resubmission Summary Banner */}
      {resubmissionNote && request.status === 'PENDING_MANAGER_REVIEW' && (
        <div className="bg-surface border border-border-warm rounded-xl p-4 shadow-xs flex items-start gap-3">
          <MessageSquareText className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-ink">Employee Resubmission Notes</span>
            <p className="text-muted italic">"{resubmissionNote}"</p>
          </div>
        </div>
      )}

      {/* Split Audit Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Operational Justification, Proof Inspector, Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Briefcase className="size-4 text-primary" /> Operational Justification & Contact
              </h3>
              <span className="text-[11px] font-mono text-muted">{request.projectCode}</span>
            </div>
            <p className="text-xs text-ink leading-relaxed whitespace-pre-line">
              {request.purpose || 'No purpose provided.'}
            </p>
            {(request.emergencyContactName || request.emergencyContactPhone) && (
              <div className="pt-2.5 border-t border-border-warm flex flex-wrap items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" />
                  Emergency Contact:{' '}
                  <strong className="text-ink font-semibold">
                    {request.emergencyContactName || 'Not provided'}
                  </strong>
                  {request.emergencyContactPhone ? ` (${request.emergencyContactPhone})` : ''}
                </span>
              </div>
            )}
          </div>

          <ProofInspectorViewer proofUrl={request.supportingDocUrl} title={request.title} />
          <AuditTimelineLog timeline={request.timeline} />
        </div>

        {/* Right: Decision Panel, Spend Mix & Itemized Expenses */}
        <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-5">
          <ManagerDecisionCard
            status={request.status}
            isSubmitting={isSubmitting}
            onApprove={managerApprove}
            onRequestRevision={managerRequestRevision}
            onReject={managerReject}
          />

          <CategorySpendBreakdownCard
            title="Category Allocation"
            subtitle="Share of requested total"
            totalSpend={expenseBreakdown.totalSpend || Number(request.totalExpenses) || 0}
            categories={expenseBreakdown.categories}
            emptyMessage="No positive line items recorded."
          />

          {/* Itemized Expenses Card */}
          <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Itemized Expenses ({request.expenses?.length || 0})
              </h3>
              <span className="text-xs font-mono font-bold text-primary tabular-nums">
                {formatINR(request.totalExpenses)}
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border-warm">
              {request.expenses?.map((exp, idx) => {
                const catKey = (exp.category || 'MISC') as ExpenseCategory;
                const catLabel = EXPENSE_CATEGORY_META[catKey]?.shortLabel || catKey.replace(/_/g, ' ');
                return (
                  <div key={exp.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-ink truncate">{exp.merchant}</span>
                        <span className="text-[10px] text-muted">
                          {catLabel}
                          {exp.expenseDate ? ` • ${exp.expenseDate.split('T')[0]}` : ''}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-primary shrink-0">
                        {formatINR(exp.amount)}
                      </span>
                    </div>
                    {exp.notes && (
                      <p className="text-[11px] text-muted italic">{exp.notes}</p>
                    )}
                    {exp.receiptImageUrl && (
                      <a
                        href={exp.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        Line receipt <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
