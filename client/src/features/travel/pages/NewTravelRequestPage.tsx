import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  FileEdit,
  Loader2,
  CheckCircle2,
  Circle,
  Copy,
  GitMerge,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { useTravelForm, type TravelFormValues } from '../hooks/useTravelForm';
import { TravelTypeToggle } from '../components/forms/TravelTypeToggle';
import { TravelLogisticsFields } from '../components/forms/TravelLogisticsFields';
import { ProofAttachmentField } from '../components/forms/ProofAttachmentField';
import { DynamicExpenseTable } from '../components/forms/DynamicExpenseTable';
import { CategorySpendBreakdownCard } from '../components/employee/CategorySpendBreakdownCard';
import { aggregateExpenseItems } from '../utils/travelAnalytics';

export const NewTravelRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTypeParam = searchParams.get('type');
  const cloneIdParam = searchParams.get('clone');
  const fromTab = searchParams.get('tab');
  const { user } = useAuth();
  const defaultReturnTab = user?.role === 'MANAGER' ? 'personal' : 'present';
  const backPath = `/dashboard?tab=${fromTab || defaultReturnTab}`;

  const { requests, loadRequests, loadRequestDetails, createRequest } = useTravel();
  const { form, fieldArray, watchedType, watchedProof, totalAmount } = useTravelForm(
    initialTypeParam === 'ALREADY_TRAVELLED' ? 'ALREADY_TRAVELLED' : 'UPCOMING'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const watchedTitle = form.watch('title');
  const watchedPurpose = form.watch('purpose');
  const watchedOrigin = form.watch('origin');
  const watchedDest = form.watch('destination');
  const watchedDep = form.watch('departure_date');
  const watchedRet = form.watch('return_date');
  const watchedContactName = form.watch('emergency_contact_name');
  const watchedExpenses = form.watch('expenses');

  useEffect(() => {
    if (requests.length === 0) {
      loadRequests();
    }
  }, [requests.length, loadRequests]);

  const applyClonedRequest = async (reqId: string) => {
    if (!reqId) return;
    try {
      const source =
        requests.find((r) => r.id === reqId && r.expenses && r.expenses.length > 0) ||
        (await loadRequestDetails(reqId));
      const today = new Date().toISOString().split('T')[0];
      const returnDefault = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
      form.reset({
        travel_type: source.travelType,
        title: `${source.title} (Copy)`,
        purpose: source.purpose,
        project_code: source.projectCode || 'ENG-2026',
        origin: source.origin,
        destination: source.destination,
        departure_date: today,
        return_date: returnDefault,
        emergency_contact_name: source.emergencyContactName || 'HR Operations',
        emergency_contact_phone: source.emergencyContactPhone || '+91 9876543210',
        supporting_doc_url: '',
        expenses:
          source.expenses && source.expenses.length > 0
            ? source.expenses.map((e) => ({
                category: e.category,
                merchant: e.merchant,
                amount: Number(e.amount) || 0,
                expenseDate: today,
                notes: e.notes || '',
              }))
            : [
                {
                  category: 'FLIGHT',
                  merchant: '',
                  amount: 0,
                  expenseDate: today,
                  notes: '',
                },
              ],
      });
    } catch (err) {
      console.error('Failed to clone trip:', err);
    }
  };

  useEffect(() => {
    if (cloneIdParam) {
      applyClonedRequest(cloneIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloneIdParam]);

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

  const readinessChecks = useMemo(
    () => [
      { label: 'Trip title (min 5 chars)', ok: Boolean(watchedTitle && watchedTitle.trim().length >= 5) },
      { label: 'Business purpose (min 10 chars)', ok: Boolean(watchedPurpose && watchedPurpose.trim().length >= 10) },
      {
        label: 'Route & valid dates',
        ok: Boolean(
          watchedOrigin &&
            watchedDest &&
            watchedDep &&
            watchedRet &&
            new Date(watchedRet) >= new Date(watchedDep)
        ),
      },
      { label: 'Emergency contact specified', ok: Boolean(watchedContactName && watchedContactName.trim().length >= 2) },
      { label: 'Valid proof / itinerary URL', ok: Boolean(watchedProof && /^https?:\/\/.+/i.test(watchedProof)) },
      {
        label: 'At least 1 expense > ₹0',
        ok: Boolean(watchedExpenses && watchedExpenses.some((e) => Number(e.amount) > 0)),
      },
    ],
    [watchedTitle, watchedPurpose, watchedOrigin, watchedDest, watchedDep, watchedRet, watchedContactName, watchedProof, watchedExpenses]
  );

  const readyCount = readinessChecks.filter((c) => c.ok).length;

  const onSubmit = async (values: TravelFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await createRequest({
        travelType: values.travel_type,
        title: values.title,
        purpose: values.purpose,
        projectCode: values.project_code || 'ENG-2026',
        origin: values.origin,
        destination: values.destination,
        departureDate: values.departure_date,
        returnDate: values.return_date,
        emergencyContactName: values.emergency_contact_name,
        emergencyContactPhone: values.emergency_contact_phone,
        supportingDocUrl: values.supporting_doc_url,
        expenses: values.expenses.map((e) => ({
          category: e.category,
          merchant: e.merchant,
          amount: Number(e.amount),
          expenseDate: e.expenseDate,
          notes: e.notes,
        })),
      });
      navigate(`/dashboard?tab=${defaultReturnTab}`);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to submit travel request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const values = form.getValues();
      await createRequest({
        travelType: values.travel_type || 'UPCOMING',
        title: values.title || 'Untitled Travel Draft',
        purpose: values.purpose,
        projectCode: values.project_code || 'ENG-2026',
        origin: values.origin,
        destination: values.destination,
        departureDate: values.departure_date,
        returnDate: values.return_date,
        emergencyContactName: values.emergency_contact_name,
        emergencyContactPhone: values.emergency_contact_phone,
        supportingDocUrl: values.supporting_doc_url,
        isDraft: true,
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
      setApiError(err?.response?.data?.message || err?.message || 'Failed to save travel draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clonableTrips = useMemo(
    () => requests.filter((r) => r.status !== 'DRAFT').slice(0, 6),
    [requests]
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5">
      {/* Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink cursor-pointer transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" />
          {user?.role === 'MANAGER' ? 'Back to My Personal Travel' : 'Back to Dashboard'}
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {clonableTrips.length > 0 && (
            <div className="flex items-center gap-1.5 bg-surface border border-border-warm rounded-lg px-2.5 py-1.5">
              <Copy className="size-3.5 text-primary shrink-0" />
              <select
                aria-label="Clone from previous trip"
                defaultValue={cloneIdParam || ''}
                onChange={(e) => applyClonedRequest(e.target.value)}
                className="text-xs font-medium text-ink bg-transparent focus-visible:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  Clone from past trip...
                </option>
                {clonableTrips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title} ({trip.destination})
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Create Travel Request</h1>
        <p className="text-xs text-muted">
          Submit a new pre-trip authorization or post-trip reimbursement claim, or save a draft to finish later.
        </p>
      </div>

      {apiError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-destructive font-medium">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Form (8 cols) */}
        <form
          id="new-travel-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:col-span-8 flex flex-col gap-5 bg-surface p-6 rounded-xl border border-border-warm shadow-xs"
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-4 border-b border-border-warm">
            <TravelTypeToggle
              value={watchedType}
              onChange={(t) => form.setValue('travel_type', t)}
            />
          </div>

          <TravelLogisticsFields register={form.register} errors={form.formState.errors} />

          <ProofAttachmentField
            travelType={watchedType}
            register={form.register}
            errors={form.formState.errors}
            proofUrlValue={watchedProof}
          />

          <DynamicExpenseTable
            fieldArray={fieldArray}
            register={form.register}
            errors={form.formState.errors}
            totalAmount={totalAmount}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-warm">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="px-4 py-2 rounded-lg border border-border-warm text-xs font-semibold text-muted hover:bg-surface-subtle active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSaveDraft}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <FileEdit className="size-4 text-primary" />
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Travel Request'}
              </button>
            </div>
          </div>
        </form>

        {/* Sticky Live Summary & Readiness Sidebar (4 cols) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-5 flex flex-col gap-4">
          <CategorySpendBreakdownCard
            title="Live Expense Split"
            subtitle="Updates automatically from your table"
            totalSpend={liveBreakdown.totalSpend}
            categories={liveBreakdown.categories}
            emptyMessage="Enter amounts in the expense table to preview category mix."
          />

          <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
              <h3 className="text-sm font-semibold text-ink">Submission Readiness</h3>
              <span className="text-xs font-mono font-bold text-primary tabular-nums">
                {readyCount}/{readinessChecks.length}
              </span>
            </div>
            <ul className="flex flex-col gap-2 text-xs">
              {readinessChecks.map((check) => (
                <li key={check.label} className="flex items-center gap-2">
                  {check.ok ? (
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                  ) : (
                    <Circle className="size-3.5 text-faint/60 shrink-0" />
                  )}
                  <span className={check.ok ? 'text-ink font-medium' : 'text-muted'}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pt-2.5 border-t border-border-warm flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              <GitMerge className="size-3.5 text-primary shrink-0" />
              <span>Route: You</span>
              <ArrowRight className="size-3 text-faint shrink-0" aria-hidden="true" />
              <span>{user?.role === 'MANAGER' ? 'Reviewer' : 'Line Manager'}</span>
              <ArrowRight className="size-3 text-faint shrink-0" aria-hidden="true" />
              <span>Admin Clearance</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
