import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Loader2, ShieldAlert } from 'lucide-react';
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

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(resubmitSchema),
    values: request ? {
      remarks: 'Updated itemized expenses and attached fresh receipt proof.',
      departureDate: request.departureDate ? request.departureDate.split('T')[0] : '',
      returnDate: request.returnDate ? request.returnDate.split('T')[0] : '',
      supportingDocUrl: request.supportingDocUrl || '',
      expenses: request.expenses?.map((e) => ({
        category: e.category,
        merchant: e.merchant,
        amount: e.amount,
        expenseDate: e.expenseDate ? e.expenseDate.split('T')[0] : '',
        receiptImageUrl: e.receiptImageUrl || '',
        notes: e.notes || '',
      })) || [{ category: 'FLIGHT', merchant: 'Airline', amount: 10000, expenseDate: new Date().toISOString().split('T')[0], receiptImageUrl: '', notes: '' }],
    } : undefined,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'expenses' });
  const watchedExpenses = watch('expenses') || [];
  const totalAmount = watchedExpenses.reduce((sum, exp) => sum + (Number(exp?.amount) || 0), 0);

  if (!isOpen || !request) return null;

  const handleFormSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await onSubmit(request.id, {
        remarks: values.remarks,
        employee_response_notes: values.remarks,
        departureDate: values.departureDate,
        returnDate: values.returnDate,
        supportingDocUrl: values.supportingDocUrl,
        expenses: values.expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to resubmit request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E8DFD3] max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-[#E8DFD3] pb-3">
          <h2 className="text-base font-bold text-[#2B231D]">Fix & Resubmit Travel Request</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-[#A0988E] hover:text-[#2B231D]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

        <div className="p-3 bg-[#FEF9E7] border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-[#B9770E]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Resubmission returns directly to your Line Manager for re-audit.</span>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold">Describe Alterations Made</label>
            <textarea {...register('remarks')} rows={2} className="p-2.5 rounded-xl border border-[#E8DFD3] text-xs" />
            {errors.remarks && <p className="text-[11px] text-red-600">{errors.remarks.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold">Updated Proof URL</label>
            <input type="url" {...register('supportingDocUrl')} className="p-2.5 rounded-xl border border-[#E8DFD3] text-xs" />
            {errors.supportingDocUrl && <p className="text-[11px] text-red-600">{errors.supportingDocUrl.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">Itemized Expenses (Total: {formatINR(totalAmount)})</span>
              <button
                type="button"
                onClick={() => append({ category: 'MISC', merchant: '', amount: 1000, expenseDate: new Date().toISOString().split('T')[0] })}
                className="flex items-center gap-1 text-xs text-[#8A582B] font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2 rounded-lg border border-[#E8DFD3] text-xs">
                <select {...register(`expenses.${i}.category`)} className="col-span-3 p-1.5 bg-white border border-[#E8DFD3] rounded">
                  <option value="FLIGHT">Flight</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="MEALS_PER_DIEM">Meals</option>
                  <option value="TRANSIT">Transit</option>
                  <option value="MISC">Misc</option>
                </select>
                <input {...register(`expenses.${i}.merchant`)} placeholder="Merchant" className="col-span-4 p-1.5 bg-white border border-[#E8DFD3] rounded" />
                <input {...register(`expenses.${i}.amount`, { valueAsNumber: true })} type="number" placeholder="₹" className="col-span-4 p-1.5 bg-white border border-[#E8DFD3] rounded font-mono tabular-nums" />
                <button type="button" onClick={() => remove(i)} disabled={fields.length === 1} className="col-span-1 text-red-500 disabled:opacity-30">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E8DFD3]">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-xs">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-[#8A582B] text-white rounded-xl text-xs font-semibold">
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Resubmit to Manager
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
