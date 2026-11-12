import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, FileEdit, Loader2 } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { useTravelForm, type TravelFormValues } from '../hooks/useTravelForm';
import { TravelTypeToggle } from '../components/forms/TravelTypeToggle';
import { TravelLogisticsFields } from '../components/forms/TravelLogisticsFields';
import { ProofAttachmentField } from '../components/forms/ProofAttachmentField';
import { DynamicExpenseTable } from '../components/forms/DynamicExpenseTable';

export const NewTravelRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRequest } = useTravel();
  const { form, fieldArray, watchedType, watchedProof, totalAmount } = useTravelForm('UPCOMING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
      navigate('/dashboard?tab=present');
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

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-ink cursor-pointer transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </button>
        {/* <span className="text-xs font-mono tabular-nums font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-border-warm">
          Estimated Total: {formatINR(totalAmount)}
        </span> */}
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

      {/* Main Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 bg-surface p-6 rounded-xl border border-border-warm shadow-xs">
        <TravelTypeToggle
          value={watchedType}
          onChange={(t) => form.setValue('travel_type', t)}
        />

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

        <div className="flex items-center justify-between pt-4 border-t border-border-warm">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 rounded-xl border border-border-warm text-xs font-semibold text-muted hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSaveDraft}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-warm bg-surface hover:bg-surface-subtle active:scale-[0.98] text-ink text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <FileEdit className="size-4 text-primary" />
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Travel Request'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
