import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  ExternalLink,
  MessageSquareText,
} from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { useAuditDecision } from '../hooks/useAuditDecision';
import { BudgetImpactGauge } from '../components/audit/BudgetImpactGauge';
import { ProofInspectorViewer } from '../components/audit/ProofInspectorViewer';
import { AdminClearanceCard } from '../components/audit/AdminClearanceCard';
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
  getFiscalQuarterFromDate,
} from '../utils/travelAnalytics';
import { isManagerReviewableStatus } from '../utils/managerQueue';
import type { ExpenseCategory, TravelRequest } from '../types/travel.types';

export const AdminClearancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('tab');
  const returnTab = fromTab === 'revisions' || fromTab === 'past' ? fromTab : 'present';
  const { loadRequestDetails, budget, loadBudget } = useTravel();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isSubmitting, error, adminClearance, adminRevision, adminReject } = useAuditDecision(
    id || '',
    returnTab
  );

  // Route guard: Tier 1 items go to /travel/audit/:id; concluded/non-admin statuses go to read-only detail
  useEffect(() => {
    if (!request) return;
    if (isManagerReviewableStatus(request.status)) {
      navigate(`/travel/audit/${request.id}?tab=${returnTab}`, { replace: true });
      return;
    }
    if (request.status !== 'PENDING_ADMIN_APPROVAL') {
      navigate(`/travel/requests/${request.id}?tab=${fromTab || 'past'}`, { replace: true });
    }
  }, [request, navigate, fromTab, returnTab]);

  useEffect(() => {
    if (!id) return;
    loadRequestDetails(id)
      .then((req) => {
        setRequest(req);
        const { year, quarter } = getFiscalQuarterFromDate(req.departureDate);
        return loadBudget(req.requesterDepartment || 'Engineering', year, quarter);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, loadRequestDetails, loadBudget]);

  const duration = useMemo(
    () => computeTripDuration(request?.departureDate, request?.returnDate),
    [request?.departureDate, request?.returnDate]
  );

  const expenseBreakdown = useMemo(
    () => aggregateExpenseItems(request?.expenses || []),
    [request?.expenses]
  );

  const fiscalPeriod = useMemo(
    () => getFiscalQuarterFromDate(request?.departureDate),
    [request?.departureDate]
  );

  const isBudgetOverflow = useMemo(() => {
    if (!budget || !request || budget.totalAllocation <= 0) return false;
    return budget.utilizedAmount + Number(request.totalExpenses || 0) > budget.totalAllocation;
  }, [budget, request]);

  if (isLoading || !request) {
    return <TravelDetailSkeleton />;
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto flex flex-col gap-5"
    >
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(fromTab ? `/dashboard?tab=${fromTab}` : '/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" />
          {fromTab === 'revisions' ? 'Back to Dispatched Revisions' : 'Back to Governance Hub'}
        </button>
        <div className="flex flex-wrap items-center gap-2.5">
          <TravelStatusBadge status={request.status} />
          <span className="text-sm font-mono tabular-nums font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-border-warm">
            {formatINR(request.totalExpenses)}
          </span>
        </div>
      </div>

      {/* Header Context */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-ink tracking-tight">{request.title}</h1>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-surface-subtle border border-border-warm text-muted">
            {request.projectCode}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary">
            {request.travelType === 'UPCOMING' ? 'Pre-Trip Authorization' : 'Post-Trip Reimbursement'}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-surface-subtle border border-border-warm text-muted">
            {fiscalPeriod.quarter} {fiscalPeriod.year}
          </span>
          {request.requesterRole === 'MANAGER' && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Manager Personal Request
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-0.5">
          <span className="flex items-center gap-1 font-semibold text-ink">
            <UserIcon className="size-3.5 text-primary" />
            {request.requesterName}
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
        <div className="p-3.5 bg-[#FFF0E8] border border-destructive/30 rounded-xl text-xs text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Tier 1 Manager Verification Remarks Callout */}
      {request.managerRemarks && (
        <div className="bg-surface border border-border-warm rounded-xl p-4 shadow-xs flex items-start gap-3">
          <MessageSquareText className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-semibold text-ink">
              Tier 1 Manager Audit Note{request.managerName ? ` (${request.managerName})` : ''}
            </span>
            <p className="text-muted italic">“{request.managerRemarks}”</p>
          </div>
        </div>
      )}

      {/* Real-time Budget Impact Gauge */}
      <BudgetImpactGauge budget={budget} requestAmount={request.totalExpenses} />

      {/* Split Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Operational Justification & Emergency Contact */}
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
            <div className="pt-2 border-t border-border-warm/60 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary/70" />
                Emergency Contact:{' '}
                <strong className="text-ink font-medium">{request.emergencyContactName || 'N/A'}</strong>
                {request.emergencyContactPhone ? (
                  <span className="font-mono text-[11px]">({request.emergencyContactPhone})</span>
                ) : null}
              </span>
            </div>
          </div>

          <ProofInspectorViewer proofUrl={request.supportingDocUrl} title={request.title} />
          <AuditTimelineLog timeline={request.timeline} />
        </div>

        <div className="lg:col-span-5 flex flex-col gap-5">
          <AdminClearanceCard
            travelType={request.travelType}
            isSubmitting={isSubmitting}
            isBudgetOverflow={isBudgetOverflow}
            onClearance={adminClearance}
            onRevision={adminRevision}
            onReject={adminReject}
          />

          <CategorySpendBreakdownCard
            categories={expenseBreakdown.categories}
            totalSpend={expenseBreakdown.totalSpend}
            title="Request Category Mix"
          />

          <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Itemized Expenses ({request.expenses?.length || 0})
            </h3>
            <div className="flex flex-col gap-2">
              {request.expenses?.map((exp, idx) => {
                const catKey = (exp.category || 'MISC') as ExpenseCategory;
                const catLabel = EXPENSE_CATEGORY_META[catKey]?.label || String(catKey).replace(/_/g, ' ');
                return (
                  <div
                    key={exp.id || idx}
                    className="flex flex-col gap-1.5 text-xs p-3 bg-surface-subtle rounded-xl border border-border-warm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink">{exp.merchant}</span>
                        <span className="text-[10px] text-muted">
                          {catLabel}
                          {exp.expenseDate ? ` • ${exp.expenseDate}` : ''}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-bold text-primary shrink-0">
                        {formatINR(exp.amount)}
                      </span>
                    </div>
                    {exp.notes && <p className="text-[11px] text-muted">{exp.notes}</p>}
                    {exp.receiptImageUrl && (
                      <a
                        href={exp.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline w-fit"
                      >
                        <ExternalLink className="size-3" /> View Receipt Proof
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
