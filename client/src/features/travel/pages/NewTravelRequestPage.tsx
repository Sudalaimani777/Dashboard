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
  GitMerge,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { useTravelForm, getLocalDateString, PROJECT_CODE_REGEX, type TravelFormValues } from '../hooks/useTravelForm';
import type { TravelType } from '../types/travel.types';
import { isValidEmergencyPhone } from '../utils/countryDialCodes';
import { TravelTypeToggle } from '../components/forms/TravelTypeToggle';
import { TravelLogisticsFields } from '../components/forms/TravelLogisticsFields';
import { ProofAttachmentField } from '../components/forms/ProofAttachmentField';
import { DynamicExpenseTable } from '../components/forms/DynamicExpenseTable';
import { CloneTripDropdown } from '../components/forms/CloneTripDropdown';
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
  const { form, fieldArray, watchedType, watchedProof, watchedDocs, watchedExpenses, totalAmount } = useTravelForm(
    initialTypeParam === 'ALREADY_TRAVELLED' ? 'ALREADY_TRAVELLED' : 'UPCOMING'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const watchedTitle = form.watch('title');
  const watchedPurpose = form.watch('purpose');
  const watchedProjectCode = form.watch('project_code');
  const watchedOrigin = form.watch('origin');
  const watchedDest = form.watch('destination');
  const watchedDep = form.watch('departure_date');
  const watchedRet = form.watch('return_date');
  const watchedContactName = form.watch('emergency_contact_name');
  const watchedContactPhone = form.watch('emergency_contact_phone');

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
      const today = getLocalDateString();
      const pastThreeDays = new Date();
      pastThreeDays.setDate(pastThreeDays.getDate() - 3);
      const pastThreeDaysStr = getLocalDateString(pastThreeDays);

      const depDefault = source.travelType === 'ALREADY_TRAVELLED' ? pastThreeDaysStr : today;
      const retDefault =
        source.travelType === 'ALREADY_TRAVELLED'
          ? today
          : getLocalDateString(new Date(Date.now() + 86400000 * 3));
      const expenseDateDefault = source.travelType === 'ALREADY_TRAVELLED' ? pastThreeDaysStr : today;

      form.reset({
        travel_type: source.travelType,
        title: `${source.title} (Copy)`,
        purpose: source.purpose,
        project_code: source.projectCode || 'ENG-2026',
        origin: source.origin,
        destination: source.destination,
        departure_date: depDefault,
        return_date: retDefault,
        emergency_contact_name: source.emergencyContactName || 'HR Operations',
        emergency_contact_phone: source.emergencyContactPhone || '+91',
        supporting_doc_url: source.supportingDocUrl || '',
        supporting_docs:
          source.supportingDocs && source.supportingDocs.length > 0
            ? source.supportingDocs
            : source.supportingDocUrl
            ? [{ id: 'clone-1', type: 'LINK', name: 'Primary Itinerary Proof', url: source.supportingDocUrl }]
            : [],
        expenses:
          source.expenses && source.expenses.length > 0
            ? source.expenses.map((e) => {
                const origCur = e.originalCurrency || (e as any).original_currency || 'INR';
                const origAmt = Number(
                  e.originalAmount !== undefined && e.originalAmount !== null
                    ? e.originalAmount
                    : (e as any).original_amount !== undefined && (e as any).original_amount !== null
                    ? (e as any).original_amount
                    : e.amount
                ) || 0;
                const rate = Number(
                  e.exchangeRate !== undefined && e.exchangeRate !== null
                    ? e.exchangeRate
                    : (e as any).exchange_rate !== undefined && (e as any).exchange_rate !== null
                    ? (e as any).exchange_rate
                    : 1.0
                );
                const inr = Number(
                  e.inrAmount !== undefined && e.inrAmount !== null
                    ? e.inrAmount
                    : (e as any).inr_amount !== undefined && (e as any).inr_amount !== null
                    ? (e as any).inr_amount
                    : e.amount
                ) || 0;
                return {
                  category: e.category,
                  merchant: e.merchant,
                  amount: Number(e.amount) || 0,
                  originalCurrency: origCur,
                  originalAmount: origAmt,
                  exchangeRate: rate,
                  inrAmount: inr,
                  expenseDate: source.travelType === 'ALREADY_TRAVELLED' && e.expenseDate > today ? today : (e.expenseDate || expenseDateDefault),
                  notes: e.notes || '',
                };
              })
            : [
                {
                  category: 'FLIGHT',
                  merchant: '',
                  amount: 0,
                  originalCurrency: 'INR',
                  originalAmount: 0,
                  exchangeRate: 1.0,
                  inrAmount: 0,
                  expenseDate: expenseDateDefault,
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

  const handleTypeChange = (t: TravelType) => {
    form.setValue('travel_type', t, { shouldValidate: true });
    const todayStr = getLocalDateString();
    const currentDep = form.getValues('departure_date');
    const currentRet = form.getValues('return_date');

    if (t === 'ALREADY_TRAVELLED') {
      if (!currentRet || currentRet > todayStr) {
        const pastThreeDays = new Date();
        pastThreeDays.setDate(pastThreeDays.getDate() - 3);
        const pastThreeDaysStr = getLocalDateString(pastThreeDays);
        form.setValue('return_date', todayStr, { shouldValidate: true });
        form.setValue('departure_date', pastThreeDaysStr, { shouldValidate: true });
      }
      // Sanitize expense dates to not exceed today
      const currentExpenses = form.getValues('expenses') || [];
      const sanitizedExpenses = currentExpenses.map((exp) => ({
        ...exp,
        expenseDate: exp.expenseDate && exp.expenseDate > todayStr ? todayStr : exp.expenseDate,
      }));
      form.setValue('expenses', sanitizedExpenses, { shouldValidate: true });
    } else if (t === 'UPCOMING') {
      if (!currentDep || currentDep < todayStr) {
        const futureThreeDays = new Date();
        futureThreeDays.setDate(futureThreeDays.getDate() + 3);
        form.setValue('departure_date', todayStr, { shouldValidate: true });
        form.setValue('return_date', getLocalDateString(futureThreeDays), { shouldValidate: true });
      }
    }
  };

  const readinessChecks = useMemo(
    () => {
      const todayStr = getLocalDateString();
      const datesValid = Boolean(
        watchedOrigin &&
          watchedOrigin.trim().length >= 2 &&
          watchedDest &&
          watchedDest.trim().length >= 2 &&
          watchedDep &&
          watchedRet &&
          new Date(watchedRet) >= new Date(watchedDep) &&
          (watchedType === 'UPCOMING'
            ? watchedDep >= todayStr
            : watchedRet <= todayStr && watchedDep <= todayStr)
      );

      return [
        { label: 'Trip title (min 5 chars)', ok: Boolean(watchedTitle && watchedTitle.trim().length >= 5) },
        { label: 'Business purpose (min 10 chars)', ok: Boolean(watchedPurpose && watchedPurpose.trim().length >= 10) },
        {
          label: 'Project code (uppercase with hyphen, e.g. ENG-2026)',
          ok: Boolean(watchedProjectCode && PROJECT_CODE_REGEX.test(watchedProjectCode.trim())),
        },
        {
          label: 'Route & valid dates',
          ok: datesValid,
        },
        {
          label: 'Emergency contact specified',
          ok: Boolean(
            watchedContactName &&
              watchedContactName.trim().length >= 2 &&
              isValidEmergencyPhone(watchedContactPhone)
          ),
        },
        {
          label: 'Valid proof / itinerary quotation attached',
          ok: Boolean((watchedDocs && watchedDocs.length > 0) || (watchedProof && /^https?:\/\/.+/i.test(watchedProof))),
        },
        {
          label: 'At least 1 expense > ₹0 (within trip dates)',
          ok: Boolean(
            watchedExpenses &&
              watchedExpenses.length > 0 &&
              watchedExpenses.some((e) => Number(e.amount) > 0) &&
              watchedExpenses.every(
                (e) =>
                  !e.expenseDate ||
                  ((!watchedDep || e.expenseDate >= watchedDep) &&
                    (!watchedRet || e.expenseDate <= watchedRet) &&
                    (watchedType !== 'ALREADY_TRAVELLED' || e.expenseDate <= todayStr))
              )
          ),
        },
      ];
    },
    [watchedTitle, watchedPurpose, watchedProjectCode, watchedOrigin, watchedDest, watchedDep, watchedRet, watchedType, watchedContactName, watchedContactPhone, watchedProof, watchedDocs, watchedExpenses]
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
        projectCode: values.project_code.trim().toUpperCase(),
        origin: values.origin,
        destination: values.destination,
        departureDate: values.departure_date,
        returnDate: values.return_date,
        emergencyContactName: values.emergency_contact_name,
        emergencyContactPhone: values.emergency_contact_phone,
        supportingDocUrl: values.supporting_doc_url || values.supporting_docs?.[0]?.url,
        supportingDocs: values.supporting_docs || [],
        expenses: values.expenses.map((e) => ({
          category: e.category,
          merchant: e.merchant,
          amount: Number(e.amount),
          originalCurrency: e.originalCurrency || 'INR',
          originalAmount: Number(e.originalAmount ?? e.amount),
          exchangeRate: Number(e.exchangeRate ?? 1.0),
          inrAmount: Number(e.inrAmount ?? e.amount),
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
        projectCode: values.project_code ? values.project_code.trim().toUpperCase() : 'ENG-2026',
        origin: values.origin,
        destination: values.destination,
        departureDate: values.departure_date,
        returnDate: values.return_date,
        emergencyContactName: values.emergency_contact_name,
        emergencyContactPhone: values.emergency_contact_phone,
        supportingDocUrl: values.supporting_doc_url || values.supporting_docs?.[0]?.url,
        supportingDocs: values.supporting_docs || [],
        isDraft: true,
        expenses: (values.expenses || []).map((e) => ({
          category: e.category,
          merchant: e.merchant,
          amount: Number(e.amount) || 0,
          originalCurrency: e.originalCurrency || 'INR',
          originalAmount: Number(e.originalAmount ?? e.amount),
          exchangeRate: Number(e.exchangeRate ?? 1.0),
          inrAmount: Number(e.inrAmount ?? e.amount),
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
    () => requests.filter((r) => r.status !== 'DRAFT'),
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
            <CloneTripDropdown
              trips={clonableTrips}
              onSelectTrip={applyClonedRequest}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Create Travel Request</h1>
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
          <div className="w-full pb-4 border-b border-border-warm">
            <TravelTypeToggle
              value={watchedType}
              onChange={handleTypeChange}
            />
          </div>

          <TravelLogisticsFields
            register={form.register}
            errors={form.formState.errors}
            travelType={watchedType}
            departureDate={watchedDep}
            returnDate={watchedRet}
            phoneValue={watchedContactPhone}
            onPhoneChange={(val) => form.setValue('emergency_contact_phone', val, { shouldValidate: true })}
            onPhoneBlur={() => form.trigger('emergency_contact_phone')}
          />

          <ProofAttachmentField
            travelType={watchedType}
            setValue={form.setValue}
            docs={watchedDocs}
            errors={form.formState.errors}
            proofUrlValue={watchedProof}
          />

          <DynamicExpenseTable
            fieldArray={fieldArray}
            register={form.register}
            errors={form.formState.errors}
            totalAmount={totalAmount}
            control={form.control}
            setValue={form.setValue}
            travelType={watchedType}
            departureDate={watchedDep}
            returnDate={watchedRet}
          />

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border-warm">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border-warm text-xs font-semibold text-muted hover:bg-surface-subtle active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 text-center"
            >
              Cancel
            </button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSaveDraft}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <FileEdit className="size-4 text-primary" />
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
            title="Expense Split"
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
                    <Circle className="size-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className={check.ok ? 'text-ink font-semibold' : 'text-slate-800 font-medium'}>
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
