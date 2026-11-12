import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Send, AlertTriangle, Loader2, Trash2, Ban } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelLogisticsFields } from '../components/forms/TravelLogisticsFields';
import { ProofAttachmentField } from '../components/forms/ProofAttachmentField';
import { DynamicExpenseTable } from '../components/forms/DynamicExpenseTable';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { formatINR } from '../utils/currency';
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
  expenses: z.array(
    z.object({
      category: z.enum(['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC']),
      merchant: z.string().min(2, 'Merchant required'),
      amount: z.number().positive('Amount must be positive'),
      expenseDate: z.string(),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one expense line item is required'),
});

type ResubmitFormValues = z.infer<typeof resubmitFormSchema>;

export const ResubmitTravelRequestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('tab');
  const { loadRequestDetails, resubmitRequest, cancelRequest } = useTravel();

  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const totalAmount = useMemo(() => {
    if (!watchedExpenses || !Array.isArray(watchedExpenses)) return 0;
    return watchedExpenses.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  }, [watchedExpenses]);

  // Load existing request with full expenses on mount
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
          expenses: req.expenses && req.expenses.length > 0
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

  const handleCancelRequest = async () => {
    if (!request) return;
    const confirmMessage = isDraft
      ? 'Are you sure you want to discard this draft? This cannot be undone.'
      : 'Are you sure you want to cancel and withdraw this travel request?';

    if (!window.confirm(confirmMessage)) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await cancelRequest(request.id, isDraft ? 'Draft discarded by requester' : 'Cancelled by requester');
      navigate(isDraft ? '/dashboard?tab=drafts' : '/dashboard?tab=revisions');
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to cancel request');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin text-primary" /> Loading travel request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-4">
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

  // Find rejection feedback
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

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(isDraft || fromTab === 'drafts' ? '/dashboard?tab=drafts' : '/dashboard?tab=revisions')}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" /> {isDraft || fromTab === 'drafts' ? 'Back to Travel Drafts' : 'Back to Revised Requests'}
        </button>
        <div className="flex items-center gap-3">
          <TravelStatusBadge status={request.status} />
          <span className="text-xs font-mono tabular-nums font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-border-warm">
            Total: {formatINR(totalAmount)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          {isDraft ? 'Complete & Submit Travel Request' : 'Fix & Resubmit Travel Request'}
        </h1>
        <p className="text-xs text-muted">
          {isDraft
            ? 'Review or update your travel draft details, then submit to your manager for approval.'
            : 'Update quotes, receipts, or logistics as requested, then resubmit for line manager re-verification.'}
        </p>
      </div>

      {apiError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive font-medium">
          {apiError}
        </div>
      )}

      {/* Prominent Auditor Feedback Banner (Only for Revisions) */}
      {!isDraft && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Revision Feedback from {isByAdmin ? 'Corporate Admin' : 'Line Manager'}</span>
          </div>
          <div className="bg-surface/90 border border-amber-300/50 rounded-lg p-3 text-xs text-ink font-mono italic">
            "{latestFeedback || 'Please review itemized costs, downgrade quotes if necessary, and attach valid receipts.'}"
          </div>
          <div className="flex items-center gap-2 text-[11px] text-amber-700">
            <span>Resubmissions return directly to your Line Manager for re-audit.</span>
          </div>
        </div>
      )}

      {/* Main Resubmit Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 bg-surface p-6 rounded-xl border border-border-warm shadow-xs">
        {/* Describe Alterations Made (Only for Revisions) */}
        {!isDraft && (
          <div className="flex flex-col gap-1.5 pb-2 border-b border-border-warm">
            <label className="text-xs font-bold text-ink flex items-center gap-1">
              Describe Alterations Made <span className="text-destructive">*</span>
            </label>
            <p className="text-[11px] text-muted">
              Summarize the corrections made (e.g., flight class downgraded, revised quotes attached, expense breakdown adjusted) so your Line Manager can quickly verify.
            </p>
            <textarea
              {...form.register('alterations_remarks')}
              rows={2}
              placeholder="e.g. Downgraded outbound flight to Economy class, attached updated quote, and adjusted hotel total..."
              className="p-3 rounded-xl border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            />
            {form.formState.errors.alterations_remarks && (
              <p className="text-[11px] text-destructive">{form.formState.errors.alterations_remarks.message}</p>
            )}
          </div>
        )}

        {/* Full Travel Logistics Fields (Pre-filled) */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Trip Logistics</h2>
          <TravelLogisticsFields register={form.register as any} errors={form.formState.errors as any} />
        </div>

        {/* Attached Proof Document (Pre-filled) */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Supporting Quotation / Receipts</h2>
          <ProofAttachmentField
            travelType={request.travelType}
            register={form.register as any}
            errors={form.formState.errors as any}
            proofUrlValue={watchedProof}
          />
        </div>

        {/* Itemized Expenses Table (Pre-filled with actual rows) */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Itemized Expenses</h2>
          <DynamicExpenseTable
            fieldArray={fieldArray as any}
            register={form.register as any}
            errors={form.formState.errors as any}
            totalAmount={totalAmount}
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border-warm">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancelRequest}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-xs font-semibold text-destructive transition-all cursor-pointer"
          >
            {isDraft ? <Trash2 className="size-4" /> : <Ban className="size-4" />}
            {isDraft ? 'Discard Draft' : 'Cancel / Withdraw Request'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(isDraft || fromTab === 'drafts' ? '/dashboard?tab=drafts' : '/dashboard?tab=revisions')}
              className="px-4 py-2.5 rounded-xl border border-border-warm text-xs font-semibold text-muted hover:bg-surface-subtle transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {isSubmitting ? 'Submitting...' : isDraft ? 'Submit for Manager Review' : 'Fix & Resubmit to Manager'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
