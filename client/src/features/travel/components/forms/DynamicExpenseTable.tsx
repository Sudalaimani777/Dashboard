import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { UseFormRegister, FieldErrors, UseFieldArrayReturn, Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import type { TravelFormValues } from '../../hooks/useTravelForm';
import { getLocalDateString } from '../../hooks/useTravelForm';
import type { TravelType } from '../../types/travel.types';
import { ExpenseRowItem } from './ExpenseRowItem';
import { formatINR } from '../../utils/currency';

export interface DynamicExpenseTableProps {
  fieldArray: UseFieldArrayReturn<TravelFormValues, 'expenses', 'id'>;
  register: UseFormRegister<TravelFormValues>;
  errors: FieldErrors<TravelFormValues>;
  totalAmount?: number;
  control?: Control<TravelFormValues>;
  travelType?: TravelType;
  departureDate?: string;
  returnDate?: string;
}

export const DynamicExpenseTable: React.FC<DynamicExpenseTableProps> = ({
  fieldArray,
  register,
  errors,
  totalAmount,
  control,
  travelType = 'UPCOMING',
  departureDate,
  returnDate,
}) => {
  const { fields, append, remove } = fieldArray;
  const todayStr = useMemo(() => getLocalDateString(), []);
  const minExpenseDate = departureDate || undefined;
  const maxExpenseDate = useMemo(() => {
    if (travelType === 'ALREADY_TRAVELLED') {
      if (returnDate && returnDate < todayStr) return returnDate;
      return todayStr;
    }
    return returnDate || undefined;
  }, [travelType, returnDate, todayStr]);

  // Reactively watch expenses changes so subtotal recalculates instantly on keystroke
  const watchedExpenses = useWatch({
    control,
    name: 'expenses',
    defaultValue: fields,
  });

  const computedTotal = useMemo(() => {
    const list = watchedExpenses || fields;
    if (!list || !Array.isArray(list)) return 0;
    return list.reduce((sum, item) => {
      const val = typeof item?.amount === 'number' ? item.amount : parseFloat(item?.amount as any);
      return sum + (Number.isFinite(val) && val > 0 ? val : 0);
    }, 0);
  }, [watchedExpenses, fields]);

  const displayTotal = control ? computedTotal : (totalAmount ?? computedTotal);

  const handleAddRow = () => {
    append({
      category: 'MISC',
      merchant: '',
      amount: 0,
      expenseDate: departureDate || todayStr,
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
          Subtotal: {formatINR(displayTotal)}
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
            minDate={minExpenseDate}
            maxDate={maxExpenseDate}
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
