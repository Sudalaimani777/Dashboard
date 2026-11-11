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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#2B231D]">
          Itemized Expenses & Estimates <span className="text-[#9E2A2B]">*</span>
        </label>
        <span className="text-xs font-mono tabular-nums font-semibold text-[#8A582B]">
          Subtotal: {formatINR(totalAmount)}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
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
        className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#8A582B] text-[#8A582B] text-xs font-semibold hover:bg-[#F5EBE1] transition-colors cursor-pointer mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Expense Line Item
      </button>
    </div>
  );
};
