import React from 'react';
import { Trash2 } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { TravelFormValues } from '../../hooks/useTravelForm';

export interface ExpenseRowItemProps {
  index: number;
  register: UseFormRegister<TravelFormValues>;
  errors: FieldErrors<TravelFormValues>;
  onRemove: () => void;
  canRemove: boolean;
}

export const ExpenseRowItem: React.FC<ExpenseRowItemProps> = ({
  index,
  register,
  onRemove,
  canRemove,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center bg-surface-subtle p-3 rounded-xl border border-border-warm transition-all">
      <div className="sm:col-span-3">
        <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Category</label>
        <select
          {...register(`expenses.${index}.category`)}
          className="w-full bg-surface border border-border-warm rounded-lg px-2.5 py-2 text-xs font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all cursor-pointer"
        >
          <option value="FLIGHT">Flight</option>
          <option value="HOTEL">Hotel</option>
          <option value="MEALS_PER_DIEM">Meals / Per Diem</option>
          <option value="TRANSIT">Local Transit</option>
          <option value="MISC">Miscellaneous</option>
        </select>
      </div>

      <div className="sm:col-span-5">
        <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Merchant / Vendor</label>
        <input
          type="text"
          placeholder="Merchant (e.g. Air India, Marriott)"
          {...register(`expenses.${index}.merchant`)}
          className="w-full bg-surface border border-border-warm rounded-lg px-3 py-2 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
        />
      </div>

      <div className="sm:col-span-3">
        <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Amount (INR)</label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">₹</span>
          <input
            type="number"
            step="100"
            placeholder="0.00"
            {...register(`expenses.${index}.amount`, { valueAsNumber: true })}
            className="w-full bg-surface border border-border-warm rounded-lg pl-6 pr-2.5 py-2 text-xs font-mono tabular-nums text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          />
        </div>
      </div>

      <div className="sm:col-span-1 flex justify-end sm:justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove expense item ${index + 1}`}
          className="p-1.5 rounded-lg text-faint hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Remove row"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
};
