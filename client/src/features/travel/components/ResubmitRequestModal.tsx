import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Loader2, ShieldAlert, AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/currency';
import type { TravelRequest, ResubmitRequestInput } from '../types/travel.types';

const resubmitSchema = z.object({
  remarks: z.string().min(3, 'Please describe what you revised'),
  departureDate: z.string().min(1, 'Departure date required'),
  returnDate: z.string().min(1, 'Return date required'),
  supportingDocUrl: z.string().url('Must be valid document URL'),
  expenses: z.array(
    z.object({
      category: z.enum(['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC'] as const),
      merchant: z.string().min(2, 'Merchant required'),
      amount: z.number().positive('Amount must be > 0'),
      expenseDate: z.string().min(1, 'Date required'),
      receiptImageUrl: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ).min(1, 'At least one expense required'),
});

type FormValues = z.infer<typeof resubmitSchema>;

export interface ResubmitRequestModalProps {
  request: TravelRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, input: ResubmitRequestInput) => Promise<void>;
}

export const ResubmitRequestModal: React.FC<ResubmitRequestModalProps> = ({
  request,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(resubmitSchema),
    values: request
      ? {
          remarks: 'Updated itemized expenses and attached fresh receipt proof.',
          departureDate: request.departureDate ? request.departureDate.split('T')[0] : '',
          returnDate: request.returnDate ? request.returnDate.split('T')[0] : '',
          supportingDocUrl: request.supportingDocUrl || '',
          expenses: request.expenses && request.expenses.length > 0
            ? request.expenses.map((e) => ({
                category: e.category,
                merchant: e.merchant,
                amount: e.amount,
                expenseDate: e.expenseDate ? e.expenseDate.split('T')[0] : '',
                receiptImageUrl: e.receiptImageUrl || '',
                notes: e.notes || '',
              }))
            : [
                {
                  category: 'FLIGHT',
                  merchant: 'Airline',
                  amount: 10000,
                  expenseDate: new Date().toISOString().split('T')[0],
                  receiptImageUrl: '',
                  notes: '',
                },
              ],
        }
      : undefined,
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

  const handleFormSubmit = async (values: FormValues) => {
    if (!request) return;
    setError(null);
    try {
      await onSubmit(request.id, {
        remarks: values.remarks,
        employee_response_notes: values.remarks,
        departureDate: values.departureDate,
        returnDate: values.returnDate,
        supportingDocUrl: values.supportingDocUrl,
        expenses: values.expenses.map((e) => ({
          ...e,
          receiptImageUrl: e.receiptImageUrl || null,
          notes: e.notes || null,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resubmit request');
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B231D]/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#E8DFD3] bg-white p-6 sm:p-8 shadow-xl my-8 max-h-[90vh] overflow-y-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD3] pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#2B231D]">
              Revise & Resubmit Request
            </h2>
            <p className="text-xs text-[#756F68] mt-0.5">
              Trip #{request.id.slice(0, 8)}: {request.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Auditor Remarks Callout */}
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 p-4 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <ShieldAlert className="size-4" />
            <span>Auditor Revision Instructions</span>
          </div>
          <p className="text-rose-700 leading-relaxed">
            "{request.adminRemarks || request.managerRemarks || 'Please verify expense lines and submit updated receipts.'}"
          </p>
          <p className="text-[10px] text-rose-600 font-medium pt-1">
            * Note: Resubmissions always return directly to your Line Manager for re-audit before progressing.
          </p>
        </div>

        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-5 space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2B231D]">Response Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="Explain how you addressed the auditor's revision notes..."
              className="w-full p-2.5 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
              {...register('remarks')}
            />
            {errors.remarks && <p className="text-[11px] text-red-600">{errors.remarks.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Departure Date</label>
              <input
                type="date"
                className="w-full h-9 px-2.5 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('departureDate')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2B231D]">Return Date</label>
              <input
                type="date"
                className="w-full h-9 px-2.5 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
                {...register('returnDate')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2B231D]">Updated Proof Document URL</label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full h-9 px-2.5 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
              {...register('supportingDocUrl')}
            />
            {errors.supportingDocUrl && <p className="text-[11px] text-red-600">{errors.supportingDocUrl.message}</p>}
          </div>

          {/* Itemized Expenses Adjustment */}
          <div className="border-t border-[#E8DFD3] pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2B231D]">Adjust Itemized Expenses</span>
              <button
                type="button"
                onClick={() =>
                  append({
                    category: 'MISC',
                    merchant: '',
                    amount: 1000,
                    expenseDate: new Date().toISOString().split('T')[0],
                    receiptImageUrl: '',
                    notes: '',
                  })
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-[#8A582B] hover:underline cursor-pointer"
              >
                <Plus className="size-3" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 items-center rounded-lg border border-[#E8DFD3] bg-[#FAF8F5] p-2 text-xs"
                >
                  <div className="col-span-4">
                    <select
                      className="w-full h-8 px-2 rounded-md border border-[#E8DFD3] bg-white text-xs outline-none"
                      {...register(`expenses.${idx}.category` as const)}
                    >
                      <option value="FLIGHT">Flight</option>
                      <option value="HOTEL">Hotel</option>
                      <option value="MEALS_PER_DIEM">Meals</option>
                      <option value="TRANSIT">Transit</option>
                      <option value="MISC">Misc</option>
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Merchant"
                      className="w-full h-8 px-2 rounded-md border border-[#E8DFD3] bg-white text-xs outline-none"
                      {...register(`expenses.${idx}.merchant` as const)}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Amount"
                      className="w-full h-8 px-2 rounded-md border border-[#E8DFD3] bg-white text-xs font-mono tabular-nums outline-none"
                      {...register(`expenses.${idx}.amount` as const, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {fields.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F7F4EE] px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-[#756F68]">Total Revised Amount:</span>
              <span className="font-bold font-mono tabular-nums text-[#2B231D]">
                {formatINR(totalAmount)}
              </span>
            </div>
          </div>

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
              Resubmit to Line Manager
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
