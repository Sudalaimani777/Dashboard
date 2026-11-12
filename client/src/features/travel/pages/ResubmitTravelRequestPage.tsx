import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  Loader2,
  Trash2,
  Ban,
  FileEdit,
  CheckCircle2,
  Circle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelLogisticsFields } from '../components/forms/TravelLogisticsFields';
import { ProofAttachmentField } from '../components/forms/ProofAttachmentField';
import { DynamicExpenseTable } from '../components/forms/DynamicExpenseTable';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { AuditTimelineLog } from '../components/audit/AuditTimelineLog';
import { CategorySpendBreakdownCard } from '../components/employee/CategorySpendBreakdownCard';
import { TravelDetailSkeleton } from '../components/shared/TravelDetailSkeleton';
import { InlineConfirmBar } from '../components/shared/InlineConfirmBar';
import { formatINR } from '../utils/currency';
import { aggregateExpenseItems, computeTripDuration } from '../utils/travelAnalytics';
import type { TravelRequest } from '../types/travel.types';

const resubmitFormSchema = z.object({
  alterations_remarks: z.string().optional(),
  title: z.string().min(3, 'Title is required'),
  purpose: z.string().min(5, 'Purpose is required'),
  project_code: z.string().optional(),
  origin: z.string().min(2, 'Origin city is required'),
  destination: z.string().min(2, 'Destination is required'),
  departure_date: z.string().min(1, 'Departure date is required'),
  return_date: z.string().min(1, 'Return date is required'),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  supporting_doc_url: z.string().url('Must be a valid document or receipt URL'),
  expenses: z
    .array(
      z.object({
        category: z.enum(['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC']),
        merchant: z.string().min(2, 'Merchant required'),
        amount: z.number().positive('Amount must be positive'),
        expenseDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .min(1, 'At least one expense line item is required'),
});

type ResubmitFormValues = z.infer<typeof resubmitFormSchema>;

const QUICK_ALTERATION_TAGS = [
  'Attached updated receipt/quote URL',
  'Reduced hotel/flight estimate',
  'Updated travel dates',
  'Clarified business justification',
];

export const ResubmitTravelRequestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('tab');
  const { loadRequestDetails, resubmitRequest, cancelRequest } = useTravel();

  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ResubmitFormValues>({
    resolver: zodResolver(resubmitFormSchema),
    defaultValues: {
      alterations_remarks: '',
      title: '',
      purpose: '',
      project_code: 'ENG-2026',
      origin: '',
      destination: '',
      departure_date: '',
      return_date: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      supporting_doc_url: '',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: '',
          amount: 0,
          expenseDate: new Date().toISOString().split('T')[0],
          notes: '',
        },
      ],
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'expenses',
  });

  const watchedExpenses = form.watch('expenses');
  const watchedProof = form.watch('supporting_doc_url');
  const watchedTitle = form.watch('title');
  const watchedPurpose = form.watch('purpose');
  const watchedOrigin = form.watch('origin');
  const watchedDest = form.watch('destination');
  const watchedDep = form.watch('departure_date');
  const watchedRet = form.watch('return_date');

  const totalAmount = useMemo(() => {
    if (!watchedExpenses || !Array.isArray(watchedExpenses)) return 0;
    return watchedExpenses.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  }, [watchedExpenses]);

  const liveBreakdown = useMemo(
    () =>
      aggregateExpenseItems(
        (watchedExpenses || []).map((e) => ({
          category: e.category,
          merchant: e.merchant,
          amount: Number(e.amount) || 0,
          expenseDate: e.expenseDate,
        }))
      ),
    [watchedExpenses]
  );

  const duration = useMemo(
    () => computeTripDuration(watchedDep, watchedRet),
    [watchedDep, watchedRet]
  );

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    loadRequestDetails(id)
      .then((req) => {
        setRequest(req);
        form.reset({
          alterations_remarks: '',
          title: req.title || '',
          purpose: req.purpose || '',
          project_code: req.projectCode || 'ENG-2026',
          origin: req.origin || '',
          destination: req.destination || '',
          departure_date: req.departureDate ? req.departureDate.split('T')[0] : '',
          return_date: req.returnDate ? req.returnDate.split('T')[0] : '',
          emergency_contact_name: req.emergencyContactName || '',
          emergency_contact_phone: req.emergencyContactPhone || '',
          supporting_doc_url: req.supportingDocUrl || '',
          expenses:
            req.expenses && req.expenses.length > 0
              ? req.expenses.map((e) => ({
                  category: e.category,
                  merchant: e.merchant,
                  amount: Number(e.amount),
                  expenseDate: e.expenseDate ? e.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
                  notes: e.notes || '',
                }))
              : [
                  {
                    category: 'FLIGHT',
                    merchant: '',
                    amount: 0,
                    expenseDate: new Date().toISOString().split('T')[0],
                    notes: '',
                  },
                ],
        });
      })
      .catch((err) => {
        console.error(err);
        setApiError(err?.message || 'Failed to load request for editing');
      })
      .finally(() => setIsLoading(false));
  }, [id, loadRequestDetails, form]);

  const isDraft = request?.status === 'DRAFT';

  const onSubmit = async (values: ResubmitFormValues) => {
    if (!request) return;

    if (!isDraft && (!values.alterations_remarks || values.alterations_remarks.trim().length < 5)) {
      form.setError('alterations_remarks', {
        message: 'Please describe what alterations you made (minimum 5 characters)',
      });
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      await resubmitRequest(request.id, {
        remarks: isDraft ? 'Submitted travel request from draft' : values.alterations_remarks,
        employee_response_notes: isDraft ? 'Submitted travel request from draft' : values.alterations_remarks,
        title: values.title,
        purpose: values.purpose,
        projectCode: values.project_code,
        origin: values.origin,
        destination: values.destination,
        departureDate: values.departure_date,
        returnDate: values.return_date,
        supportingDocUrl: values.supporting_doc_url,
        emergencyContactName: values.emergency_contact_name,
        emergencyContactPhone: values.emergency_contact_phone,
        expenses: values.expenses.map((e) => ({
          category: e.category,
          merchant: e.merchant,
          amount: Number(e.amount),
          expenseDate: e.expenseDate,
          notes: e.notes,
        })),
      });
      navigate('/dashboard?tab=present');
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraftProgress = async () => {
    if (!request || !isDraft) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      const values = form.getValues();
      await resubmitRequest(request.id, {
        isDraft: true,
        title: values.title || 'Untitled Travel Draft',
        purpose: values.purpose,
        projectCode: values.project_code,
        origin: values.origin,
        destination: values.destination,
        departureDate: values.departure_date,
        returnDate: values.return_date,
        supportingDocUrl: values.supporting_doc_url,
        emergencyContactName: values.emergency_contact_name,
        emergencyContactPhone: values.emergency_contact_phone,
        expenses: (values.expenses || []).map((e) => ({
          category: e.category,
          merchant: e.merchant,
          amount: Number(e.amount) || 0,
          expenseDate: e.expenseDate,
          notes: e.notes,
        })),
      });
      navigate('/dashboard?tab=drafts');
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to update draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!request) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      await cancelRequest(request.id, isDraft ? 'Draft discarded by requester' : 'Cancelled by requester');
      navigate(isDraft ? '/dashboard?tab=drafts' : '/dashboard?tab=revisions');
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to cancel request');
      setIsSubmitting(false);
      setConfirmCancel(false);
    }
  };

  const appendAlterationTag = (tag: string) => {
    const current = form.getValues('alterations_remarks') || '';
    if (current.includes(tag)) return;
    form.setValue('alterations_remarks', current.trim() ? `${current.trim()}; ${tag}` : tag, {
      shouldValidate: true,
    });
  };

  if (isLoading) {
    return <TravelDetailSkeleton />;
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate(fromTab === 'drafts' ? '/dashboard?tab=drafts' : '/dashboard?tab=revisions')}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink cursor-pointer"
        >
          <ArrowLeft className="size-4" /> {fromTab === 'drafts' ? 'Back to Travel Drafts' : 'Back to Revised Requests'}
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive">
          Travel request #{id} not found or you do not have permission to edit it.
        </div>
      </div>
    );
  }

  const latestFeedback =
    request.timeline
      ?.slice()
      .reverse()
      .find((e) => {
        const s = e.toStatus || (e as any).to_status || '';
        return Boolean(e.remarks && String(s).includes('REVISION'));
      })?.remarks ||
    request.managerRemarks ||
    request.adminRemarks;

  const isByAdmin = request.status.includes('ADMIN');
  const originalTotal = Number(request.totalExpenses) || 0;
  const costDelta = totalAmount - originalTotal;

  const draftReadinessChecks = [
    { label: 'Title (min 3 chars)', ok: Boolean(watchedTitle && watchedTitle.trim().length >= 3) },
    { label: 'Purpose (min 5 chars)', ok: Boolean(watchedPurpose && watchedPurpose.trim().length >= 5) },
    { label: 'Origin & destination', ok: Boolean(watchedOrigin && watchedOrigin !== 'TBD' && watchedDest && watchedDest !== 'TBD') },
    { label: 'Valid proof URL', ok: Boolean(watchedProof && /^https?:\/\/.+/i.test(watchedProof)) },
    { label: 'Expense > ₹0', ok: Boolean(watchedExpenses && watchedExpenses.some((e) => Number(e.amount) > 0)) },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(isDraft || fromTab === 'drafts' ? '/dashboard?tab=drafts' : '/dashboard?tab=revisions')}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" /> {isDraft || fromTab === 'drafts' ? 'Back to Travel Drafts' : 'Back to Revised Requests'}
        </button>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-surface border border-border-warm text-muted">
            {request.projectCode}
          </span>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-surface border border-border-warm text-ink">
            {request.travelType === 'UPCOMING' ? 'Pre-Trip' : 'Post-Trip'}
          </span>
          <TravelStatusBadge status={request.status} />
          <span className="text-sm font-mono tabular-nums font-bold text-primary pl-1">
            {formatINR(totalAmount)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          {isDraft ? 'Complete & Submit Travel Request' : 'Fix & Resubmit Travel Request'}
        </h1>
        <p className="text-xs text-muted">
          {isDraft
            ? 'Review or update your travel draft details, save progress anytime, or submit for manager approval.'
            : 'Update quotes, receipts, or logistics as requested, then resubmit for line manager re-verification.'}
        </p>
      </div>

      {apiError && (
        <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive font-medium">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Edit / Resubmit Form (8 cols) */}
        <form
          id="resubmit-travel-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:col-span-8 flex flex-col gap-6 bg-surface p-6 rounded-xl border border-border-warm shadow-xs"
        >
          {!isDraft && (
            <div className="flex flex-col gap-2 pb-4 border-b border-border-warm">
              <label className="text-xs font-bold text-ink flex items-center gap-1">
                Describe Alterations Made <span className="text-destructive">*</span>
              </label>
              <p className="text-[11px] text-muted">
                Summarize the corrections made so your Line Manager can quickly verify.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ALTERATION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => appendAlterationTag(tag)}
                    className="px-2.5 py-1 rounded-md border border-border-warm bg-surface-subtle hover:border-primary/40 text-[11px] font-medium text-ink cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <textarea
                {...form.register('alterations_remarks')}
                rows={2}
                placeholder="e.g. Downgraded outbound flight to Economy class, attached updated quote, and adjusted hotel total..."
                className="p-3 rounded-lg border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
              />
              {form.formState.errors.alterations_remarks && (
                <p className="text-[11px] text-destructive">{form.formState.errors.alterations_remarks.message}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink">Trip Logistics</h2>
            <TravelLogisticsFields register={form.register as any} errors={form.formState.errors as any} />
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-border-warm">
            <h2 className="text-sm font-semibold text-ink">Supporting Quotation / Receipts</h2>
            <ProofAttachmentField
              travelType={request.travelType}
              register={form.register as any}
              errors={form.formState.errors as any}
              proofUrlValue={watchedProof}
            />
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-border-warm">
            <h2 className="text-sm font-semibold text-ink">Itemized Expenses</h2>
            <DynamicExpenseTable
              fieldArray={fieldArray as any}
              register={form.register as any}
              errors={form.formState.errors as any}
              totalAmount={totalAmount}
            />
          </div>

          {/* Bottom Actions (single canonical CTA cluster) */}
          <div className="pt-4 border-t border-border-warm flex flex-col gap-3">
            {confirmCancel && (
              <InlineConfirmBar
                message={
                  isDraft
                    ? 'Discard this saved draft permanently? This action cannot be undone.'
                    : 'Withdraw and cancel this travel request from revision?'
                }
                confirmLabel={isDraft ? 'Confirm Discard' : 'Confirm Withdrawal'}
                isBusy={isSubmitting}
                onConfirm={handleCancelRequest}
                onCancel={() => setConfirmCancel(false)}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSubmitting || confirmCancel}
                onClick={() => setConfirmCancel(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-50 active:scale-[0.98] text-xs font-semibold text-destructive transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:opacity-50"
              >
                {isDraft ? <Trash2 className="size-4" /> : <Ban className="size-4" />}
                {isDraft ? 'Discard Draft' : 'Cancel / Withdraw Request'}
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(isDraft || fromTab === 'drafts' ? '/dashboard?tab=drafts' : '/dashboard?tab=revisions')}
                className="px-4 py-2 rounded-lg border border-border-warm text-xs font-semibold text-muted hover:bg-surface-subtle active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Cancel
              </button>
              {isDraft && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveDraftProgress}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-xs font-semibold text-ink disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <FileEdit className="size-4 text-primary" />
                  Save Draft Changes
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {isSubmitting ? 'Submitting...' : isDraft ? 'Submit for Manager Review' : 'Fix & Resubmit to Manager'}
              </button>
              </div>
            </div>
          </div>
        </form>

        {/* Sticky Right Assistant Sidebar (4 cols) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-5 flex flex-col gap-4">
          {!isDraft ? (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                <span>Pinned Feedback ({isByAdmin ? 'Corporate Admin' : 'Line Manager'})</span>
              </div>
              <p className="bg-surface/90 border-l-2 border-amber-500 pl-3 py-2 rounded-r-md text-xs text-ink font-mono italic">
                “{latestFeedback || 'Please review itemized costs, downgrade quotes if necessary, and attach valid receipts.'}”
              </p>
              <p className="text-[11px] text-amber-800 leading-snug">
                Resubmissions return directly to your Line Manager for re-audit.
              </p>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
                <h3 className="text-sm font-semibold text-ink">Draft Readiness</h3>
                <span className="text-xs font-mono font-bold text-primary tabular-nums">
                  {draftReadinessChecks.filter((c) => c.ok).length}/{draftReadinessChecks.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2 text-xs">
                {draftReadinessChecks.map((check) => (
                  <li key={check.label} className="flex items-center gap-2">
                    {check.ok ? (
                      <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    ) : (
                      <Circle className="size-3.5 text-faint/60 shrink-0" />
                    )}
                    <span className={check.ok ? 'text-ink font-medium' : 'text-muted'}>{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cost Comparison / Summary Card (read-only ledger, avoids duplicating bottom CTAs) */}
          <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
              <h3 className="text-sm font-semibold text-ink">
                {isDraft ? 'Draft Cost Summary' : 'Original vs. Revised Cost'}
              </h3>
              <span className="text-[11px] text-muted font-mono">{duration.label}</span>
            </div>

            {!isDraft && (
              <div className="grid grid-cols-2 divide-x divide-border-warm text-xs bg-surface-subtle/60 rounded-lg py-2.5">
                <div className="px-3">
                  <span className="text-[10px] text-muted block">Previously Submitted</span>
                  <span className="font-mono font-semibold text-ink tabular-nums">{formatINR(originalTotal)}</span>
                </div>
                <div className="px-3">
                  <span className="text-[10px] text-muted block">Net Adjustment</span>
                  <span
                    className={`font-mono font-bold tabular-nums inline-flex items-center gap-1 ${
                      costDelta < 0 ? 'text-emerald-700' : costDelta > 0 ? 'text-amber-700' : 'text-ink'
                    }`}
                  >
                    {costDelta < 0 ? <TrendingDown className="size-3" /> : costDelta > 0 ? <TrendingUp className="size-3" /> : null}
                    {costDelta >= 0 ? '+' : ''}
                    {formatINR(costDelta)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border-warm/80">
              <span className="text-xs font-medium text-muted">Current Total</span>
              <span className="text-lg font-mono font-bold tabular-nums text-primary">
                {formatINR(totalAmount)}
              </span>
            </div>
          </div>

          <CategorySpendBreakdownCard
            title="Updated Category Mix"
            subtitle="Live breakdown of itemized costs"
            totalSpend={liveBreakdown.totalSpend}
            categories={liveBreakdown.categories}
          />

          <AuditTimelineLog timeline={request.timeline} />
        </aside>
      </div>
    </div>
  );
};
