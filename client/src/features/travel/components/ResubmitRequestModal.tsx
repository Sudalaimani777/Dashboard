import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { formatINR } from '../utils/currency';
import { travelApi } from '../services/travel.api';
import { parseExpenseAmount } from '../hooks/useTravelForm';
import type { TravelRequest, ResubmitRequestInput } from '../types/travel.types';

const resubmitSchema = z.object({
  remarks: z.string().trim().min(3, 'Please describe what alterations you made'),
  departureDate: z.string().trim().min(1, 'Departure date required'),
  returnDate: z.string().trim().min(1, 'Return date required'),
  supportingDocUrl: z.string().trim().url('Must be a valid document URL'),
  expenses: z.array(
    z.object({
      category: z.enum(['FLIGHT', 'HOTEL', 'MEALS_PER_DIEM', 'TRANSIT', 'MISC'] as const),
      merchant: z.string().trim().min(2, 'Merchant required'),
      amount: z.number().positive('Amount must be > 0'),
      expenseDate: z.string().trim().min(1, 'Date required'),
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
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(resubmitSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    values: request ? {
      remarks: '',
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
      })) || [{ category: 'MISC', merchant: '', amount: 0, expenseDate: new Date().toISOString().split('T')[0], receiptImageUrl: '', notes: '' }],
    } : undefined,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'expenses' });
  const watchedExpenses = useWatch({ control, name: 'expenses' }) || [];
  const totalAmount = useMemo(() => {
    if (!watchedExpenses || !Array.isArray(watchedExpenses)) return 0;
    return watchedExpenses.reduce((sum, exp) => {
      const val = typeof exp?.amount === 'number' ? exp.amount : parseFloat(exp?.amount as any);
      return sum + (Number.isFinite(val) && val > 0 ? val : 0);
    }, 0);
  }, [watchedExpenses]);

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
        expenses: values.expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to resubmit request');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
          />

          {/* Dialog Body */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resubmit-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            className="relative bg-surface rounded-xl border border-border-warm w-[calc(100%-2rem)] max-w-xl mx-auto my-auto p-4 sm:p-6 max-h-[85dvh] overflow-y-auto flex flex-col gap-4 shadow-xl z-10"
          >
            <div className="flex justify-between items-center border-b border-border-warm pb-3">
              <div>
                <h2 id="resubmit-modal-title" className="text-base font-bold text-ink">
                  Fix & Resubmit Travel Request
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Request #{request.id.slice(0, 8)} • {request.title}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 rounded-md text-faint hover:text-ink transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-destructive text-xs rounded-lg border border-red-200">{error}</div>}

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
              <span>Resubmissions return directly to your Line Manager for re-verification.</span>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink">
                  Describe Alterations Made <span className="text-destructive">*</span>
                </label>
                <textarea
                  {...register('remarks')}
                  rows={2}
                  placeholder="Summarize the corrected details, adjusted quotes, or updated receipts..."
                  className="p-2.5 rounded-xl border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                />
                {errors.remarks && <p className="text-[11px] text-destructive">{errors.remarks.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">
                    Updated Proof <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={isUploadingProof}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingProof ? <Loader2 className="size-3 animate-spin" /> : <UploadCloud className="size-3" />}
                    <span>{isUploadingProof ? 'Uploading...' : 'Upload File (Cloudinary)'}</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setIsUploadingProof(true);
                    try {
                      const res = await travelApi.uploadProofFile(f);
                      setValue('supportingDocUrl', res.url, { shouldValidate: true });
                    } catch (err: any) {
                      setError(err.message || 'File upload failed');
                    } finally {
                      setIsUploadingProof(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <input
                  type="url"
                  placeholder="https://proofs.corp.com/updated-receipt.pdf or uploaded URL"
                  {...register('supportingDocUrl')}
                  className="p-2.5 rounded-xl border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                />
                {errors.supportingDocUrl && <p className="text-[11px] text-destructive">{errors.supportingDocUrl.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-ink">Itemized Expenses (Total: {formatINR(totalAmount)})</span>
                  <button
                    type="button"
                    onClick={() => append({ category: 'MISC', merchant: '', amount: 1000, expenseDate: new Date().toISOString().split('T')[0] })}
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Add Row
                  </button>
                </div>
                {fields.map((f, i) => (
                  <div
                    key={f.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-2 items-start sm:items-center bg-surface-subtle p-3 sm:p-2 rounded-lg border border-border-warm text-xs"
                  >
                    <div className="sm:col-span-3 w-full">
                      <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Category</label>
                      <select
                        {...register(`expenses.${i}.category`)}
                        className="w-full p-2 sm:p-1.5 bg-surface border border-border-warm rounded text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      >
                        <option value="FLIGHT">Flight</option>
                        <option value="HOTEL">Hotel</option>
                        <option value="MEALS_PER_DIEM">Meals / Per Diem</option>
                        <option value="TRANSIT">Transit</option>
                        <option value="MISC">Misc</option>
                      </select>
                    </div>
                    <div className="sm:col-span-4 w-full">
                      <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Merchant</label>
                      <input
                        {...register(`expenses.${i}.merchant`)}
                        placeholder="Merchant"
                        className="w-full p-2 sm:p-1.5 bg-surface border border-border-warm rounded text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="sm:col-span-4 w-full">
                      <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Amount (₹)</label>
                      <input
                        {...register(`expenses.${i}.amount`, {
                          setValueAs: parseExpenseAmount,
                        })}
                        type="text"
                        inputMode="decimal"
                        placeholder="₹ 0.00"
                        className="w-full p-2 sm:p-1.5 bg-surface border border-border-warm rounded font-mono tabular-nums text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="sm:col-span-1 w-full flex justify-end sm:justify-center pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        disabled={fields.length === 1}
                        aria-label="Remove item"
                        className="p-1.5 text-destructive hover:opacity-80 disabled:opacity-30 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-border-warm">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 border border-border-warm rounded-xl text-xs text-muted hover:bg-surface-subtle transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="size-3.5 animate-spin" />} Resubmit to Manager
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
