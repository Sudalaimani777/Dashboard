import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Loader2, Plane, ReceiptText, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/currency';
import type { CreateTravelRequestInput, TravelType } from '../types/travel.types';

const expenseItemSchema = z.object({
  category: z.enum(['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC'] as const),
  merchant: z.string().min(2, 'Merchant required'),
  amount: z.number().positive('Amount must be > 0'),
  expenseDate: z.string().min(1, 'Date required'),
  receiptImageUrl: z.string().url('Must be valid URL').or(z.literal('')).optional(),
  notes: z.string().optional(),
});

const newTravelRequestSchema = z.object({
  travelType: z.enum(['UPCOMING', 'ALREADY_TRAVELLED'] as const),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  purpose: z.string().min(5, 'Purpose required'),
  projectCode: z.string().min(2, 'Project code required'),
  origin: z.string().min(2, 'Origin city required'),
  destination: z.string().min(2, 'Destination city required'),
  departureDate: z.string().min(1, 'Departure date required'),
  returnDate: z.string().min(1, 'Return date required'),
  emergencyContactName: z.string().min(2, 'Emergency contact required'),
  emergencyContactPhone: z.string().min(5, 'Contact phone required'),
  supportingDocUrl: z.string().url('Must be a valid document URL'),
  expenses: z.array(expenseItemSchema).min(1, 'Add at least one itemized expense'),
}).refine((data) => new Date(data.returnDate) >= new Date(data.departureDate), {
  message: 'Return date cannot be earlier than departure date',
  path: ['returnDate'],
});

type FormValues = z.infer<typeof newTravelRequestSchema>;

export interface NewTravelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTravelRequestInput) => Promise<void>;
}

export const NewTravelRequestModal: React.FC<NewTravelRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activeCase, setActiveCase] = useState<TravelType>('UPCOMING');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(newTravelRequestSchema),
    defaultValues: {
      travelType: 'UPCOMING',
      title: '',
      purpose: '',
      projectCode: 'PROJ-IND-2026',
      origin: 'Bengaluru',
      destination: '',
      departureDate: new Date().toISOString().split('T')[0],
      returnDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      emergencyContactName: '',
      emergencyContactPhone: '',
      supportingDocUrl: 'https://storage.tripflow.internal/proofs/quote-sample.pdf',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: 'IndiGo Airlines',
          amount: 14500,
          expenseDate: new Date().toISOString().split('T')[0],
          receiptImageUrl: '',
          notes: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expenses',
  });

  const watchedExpenses = watch('expenses') || [];
  const totalAmount = watchedExpenses.reduce(
    (sum, exp) => sum + (Number(exp?.amount) || 0),
    0
  );

  const handleTypeChange = (type: TravelType) => {
    setActiveCase(type);
    setValue('travelType', type);
    if (type === 'ALREADY_TRAVELLED') {
      setValue('supportingDocUrl', 'https://storage.tripflow.internal/receipts/tax-invoice-sample.pdf');
    } else {
      setValue('supportingDocUrl', 'https://storage.tripflow.internal/quotes/fare-estimate-sample.pdf');
    }
  };

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await onSubmit({
        ...values,
        expenses: values.expenses.map((e) => ({
          ...e,
          receiptImageUrl: e.receiptImageUrl || null,
          notes: e.notes || null,
        })),
        currency: 'INR',
      });
      reset();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit travel request');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B231D]/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#E8DFD3] bg-white p-6 sm:p-8 shadow-xl my-8 max-h-[90vh] overflow-y-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD3] pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#2B231D]">
              New Travel Request
            </h2>
            <p className="text-xs text-[#756F68] mt-0.5">
              Submit upcoming travel authorization or post-trip reimbursement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#756F68] hover:bg-[#F7F4EE] hover:text-[#2B231D] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Operational Case Switcher */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange('UPCOMING')}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
              activeCase === 'UPCOMING'
                ? 'border-[#8A582B] bg-[#8A582B]/5 ring-1 ring-[#8A582B]/20'
                : 'border-[#E8DFD3] hover:border-[#D4C4B5] bg-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeCase === 'UPCOMING' ? 'bg-[#8A582B] text-white' : 'bg-[#F7F4EE] text-[#756F68]'}`}>
              <Plane className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2B231D]">Case 2: Upcoming Travel</p>
              <p className="text-[11px] text-[#756F68]">Pre-trip clearance & budget authorization</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('ALREADY_TRAVELLED')}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
              activeCase === 'ALREADY_TRAVELLED'
                ? 'border-[#8A582B] bg-[#8A582B]/5 ring-1 ring-[#8A582B]/20'
                : 'border-[#E8DFD3] hover:border-[#D4C4B5] bg-white'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeCase === 'ALREADY_TRAVELLED' ? 'bg-[#8A582B] text-white' : 'bg-[#F7F4EE] text-[#756F68]'}`}>
              <ReceiptText className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2B231D]">Case 1: Already Travelled</p>
              <p className="text-[11px] text-[#756F68]">Post-trip reimbursement with tax invoice</p>
            </div>
          </button>
        </div>

        {submitError ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{submitError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-5" noValidate>
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Trip Title</label>
              <input
                type="text"
                placeholder="e.g. Q4 Client Architecture Workshop"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] focus:ring-1 focus:ring-[#8A582B]/20 outline-none"
                {...register('title')}
              />
              {errors.title && <p className="text-[11px] text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Origin</label>
              <input
                type="text"
                placeholder="Bengaluru"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('origin')}
              />
              {errors.origin && <p className="text-[11px] text-red-600">{errors.origin.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Destination</label>
              <input
                type="text"
                placeholder="Mumbai"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('destination')}
              />
              {errors.destination && <p className="text-[11px] text-red-600">{errors.destination.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Departure Date</label>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('departureDate')}
              />
              {errors.departureDate && <p className="text-[11px] text-red-600">{errors.departureDate.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Return Date</label>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('returnDate')}
              />
              {errors.returnDate && <p className="text-[11px] text-red-600">{errors.returnDate.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Project Code</label>
              <input
                type="text"
                placeholder="PROJ-2026-ENG"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('projectCode')}
              />
              {errors.projectCode && <p className="text-[11px] text-red-600">{errors.projectCode.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">
                {activeCase === 'ALREADY_TRAVELLED' ? 'Tax Invoice / Receipt URL' : 'Quotation Proof URL'}
              </label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('supportingDocUrl')}
              />
              {errors.supportingDocUrl && <p className="text-[11px] text-red-600">{errors.supportingDocUrl.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="Priya Sharma"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('emergencyContactName')}
              />
              {errors.emergencyContactName && <p className="text-[11px] text-red-600">{errors.emergencyContactName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Emergency Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full h-10 px-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('emergencyContactPhone')}
              />
              {errors.emergencyContactPhone && <p className="text-[11px] text-red-600">{errors.emergencyContactPhone.message}</p>}
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Business Purpose & Objectives</label>
              <textarea
                rows={2}
                placeholder="Explain the business objectives and deliverables for this trip..."
                className="w-full p-3 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('purpose')}
              />
              {errors.purpose && <p className="text-[11px] text-red-600">{errors.purpose.message}</p>}
            </div>
          </div>

          {/* Itemized Expenses Section */}
          <div className="border-t border-[#E8DFD3] pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B231D]">
                  Itemized Expenses (INR)
                </h3>
                <p className="text-[11px] text-[#756F68]">
                  Upfront itemization required for Tier 1 Manager audit.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  append({
                    category: 'HOTEL',
                    merchant: '',
                    amount: 5000,
                    expenseDate: new Date().toISOString().split('T')[0],
                    receiptImageUrl: '',
                    notes: '',
                  })
                }
                className="flex items-center gap-1.5 rounded-lg border border-[#8A582B]/30 bg-[#8A582B]/10 px-2.5 py-1 text-xs font-semibold text-[#8A582B] hover:bg-[#8A582B]/20 transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                Add Line Item
              </button>
            </div>

            {/* Expenses List */}
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-3 text-xs"
                >
                  <div className="sm:col-span-3">
                    <select
                      className="w-full h-9 px-2 rounded-lg border border-[#E8DFD3] bg-white text-xs text-[#2B231D] outline-none"
                      {...register(`expenses.${idx}.category` as const)}
                    >
                      <option value="FLIGHT">Flight / Airfare</option>
                      <option value="HOTEL">Hotel / Lodging</option>
                      <option value="MEALS_PER_DIEM">Meals & Per Diem</option>
                      <option value="TRANSIT">Local Transit / Cab</option>
                      <option value="MISC">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Merchant / Vendor"
                      className="w-full h-9 px-2.5 rounded-lg border border-[#E8DFD3] bg-white text-xs text-[#2B231D] outline-none"
                      {...register(`expenses.${idx}.merchant` as const)}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[#756F68] font-mono text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        className="w-full h-9 pl-6 pr-2 rounded-lg border border-[#E8DFD3] bg-white text-xs font-mono tabular-nums text-[#2B231D] outline-none"
                        {...register(`expenses.${idx}.amount` as const, { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1 flex justify-center">
                    {fields.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Summation Footer */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#E8DFD3] bg-[#F7F4EE] px-4 py-3">
              <span className="text-xs font-semibold text-[#756F68]">Total Request Amount</span>
              <span className="text-base font-bold font-mono tabular-nums text-[#2B231D]">
                {formatINR(totalAmount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-[#E8DFD3] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#E8DFD3] px-4 py-2 text-xs font-semibold text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#8A582B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#754820] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Submit for Manager Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
