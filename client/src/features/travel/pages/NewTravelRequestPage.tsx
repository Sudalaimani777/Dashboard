import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { useTravelForm, type TravelFormValues } from '../hooks/useTravelForm';
import { TravelTypeToggle } from '../components/forms/TravelTypeToggle';
import { TravelLogisticsFields } from '../components/forms/TravelLogisticsFields';
import { ProofAttachmentField } from '../components/forms/ProofAttachmentField';
import { DynamicExpenseTable } from '../components/forms/DynamicExpenseTable';
import { formatINR } from '../utils/currency';

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

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-[#756F68] hover:text-[#2B231D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs font-mono tabular-nums text-[#8A582B] bg-[#F5EBE1] px-3 py-1 rounded-full border border-[#E8DFD3]">
          Estimated Total: {formatINR(totalAmount)}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#2B231D] tracking-tight">Create Travel Request</h1>
        <p className="text-xs text-[#756F68]">
          Submit a new pre-trip authorization or post-trip reimbursement claim.
        </p>
      </div>

      {apiError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-[#9E2A2B] font-medium">
          {apiError}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-[#E8DFD3] shadow-sm">
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFD3]">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2.5 rounded-xl border border-[#E8DFD3] text-xs font-semibold text-[#756F68] hover:bg-[#FAF8F5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8A582B] hover:bg-[#754820] text-white text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Travel Request'}
          </button>
        </div>
      </form>
    </div>
  );
};
