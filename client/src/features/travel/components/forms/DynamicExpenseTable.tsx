import React from 'react';
import { Plus } from 'lucide-react';
import type { UseFormRegister, FieldErrors, UseFieldArrayReturn } from 'react-hook-form';
import type { TravelFormValues } from '../../hooks/useTravelForm';
import { ExpenseRowItem } from './ExpenseRowItem';
import { formatINR } from '../../utils/currency';

export interface DynamicExpenseTableProps {
  fieldArray: UseFieldArrayReturn<TravelFormValues, 'expenses', 'id'>;
  register: UseFormRegister<TravelFormValues>;
  errors: FieldErrors<TravelFormValues>;
  totalAmount: number;
}

export const DynamicExpenseTable: React.FC<DynamicExpenseTableProps> = ({
  fieldArray,
  register,
  errors,
  totalAmount,
}) => {
  const { fields, append, remove } = fieldArray;

  const handleAddRow = () => {
    append({
      category: 'MISC',
      merchant: '',
      amount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-1">
        <label className="text-xs font-semibold text-ink">
          Itemized Expenses & Estimates <span className="text-destructive">*</span>
        </label>
        <span className="text-xs font-mono tabular-nums font-semibold text-primary">
          Subtotal: {formatINR(totalAmount)}
        </span>
      </div>

      {/* Desktop Column Header */}
      <div className="hidden sm:grid grid-cols-12 gap-3 px-2 text-[11px] font-medium text-muted">
        <span className="col-span-3">Category</span>
        <span className="col-span-4">Merchant / Vendor</span>
        <span className="col-span-2">Date</span>
        <span className="col-span-2">Amount (₹)</span>
        <span className="col-span-1 text-center">Action</span>
      </div>

      <div className="divide-y divide-border-warm rounded-lg border border-border-warm bg-surface-subtle/40 px-3">
        {fields.map((field, idx) => (
          <ExpenseRowItem
            key={field.id}
            index={idx}
            register={register}
            errors={errors}
            onRemove={() => remove(idx)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-primary text-primary text-xs font-semibold hover:bg-primary/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all cursor-pointer mt-1"
      >
        <Plus className="size-3.5" />
        Add Expense Line Item
      </button>
    </div>
  );
};
