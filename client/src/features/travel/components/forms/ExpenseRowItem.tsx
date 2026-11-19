import React, { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { UseFormRegister, FieldErrors, Control, UseFormSetValue } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import type { TravelFormValues } from '../../hooks/useTravelForm';
import { parseExpenseAmount } from '../../hooks/useTravelForm';
import { useFxRate } from '../../hooks/useFxRate';

export interface ExpenseRowItemProps {
  index: number;
  register: UseFormRegister<TravelFormValues>;
  errors: FieldErrors<TravelFormValues>;
  onRemove: () => void;
  canRemove: boolean;
  minDate?: string;
  maxDate?: string;
  control?: Control<TravelFormValues>;
  setValue?: UseFormSetValue<TravelFormValues>;
}

const SUPPORTED_CURRENCIES = [
  { code: 'INR', label: 'INR (₹)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'AED', label: 'AED (د.إ)' },
  { code: 'SGD', label: 'SGD (S$)' },
  { code: 'JPY', label: 'JPY (¥)' },
  { code: 'CAD', label: 'CAD (C$)' },
  { code: 'AUD', label: 'AUD (A$)' },
  { code: 'CHF', label: 'CHF' },
];

export const ExpenseRowItem: React.FC<ExpenseRowItemProps> = ({
  index,
  register,
  errors,
  onRemove,
  canRemove,
  minDate,
  maxDate,
  control,
  setValue,
}) => {
  const rowErrors = errors.expenses?.[index];

  const watchedCurrency = useWatch({
    control,
    name: `expenses.${index}.originalCurrency`,
    defaultValue: 'INR',
  }) || 'INR';

  const watchedOriginalAmount = useWatch({
    control,
    name: `expenses.${index}.originalAmount`,
    defaultValue: 0,
  }) || 0;

  const watchedDate = useWatch({
    control,
    name: `expenses.${index}.expenseDate`,
  });

  const { rate, loading, error: fxError } = useFxRate(watchedCurrency, watchedDate);

  // Synchronize normalized INR amount and exchange rate into form state
  useEffect(() => {
    if (!setValue) return;
    const origAmt = Number(watchedOriginalAmount) || 0;
    const computedInr = watchedCurrency === 'INR'
      ? origAmt
      : Math.round(origAmt * rate * 100) / 100;

    setValue(`expenses.${index}.amount`, computedInr, { shouldValidate: true, shouldDirty: true });
    setValue(`expenses.${index}.inrAmount`, computedInr);
    setValue(`expenses.${index}.exchangeRate`, rate);
  }, [watchedCurrency, watchedOriginalAmount, rate, index, setValue]);

  return (
    <div className="flex flex-col gap-2 py-3 transition-all">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-start">
        {/* Category (2 cols) */}
        <div className="sm:col-span-2">
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

        {/* Merchant / Vendor (3 cols) */}
        <div className="sm:col-span-3 flex flex-col gap-1">
          <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Merchant / Vendor</label>
          <input
            type="text"
            placeholder="Merchant name"
            {...register(`expenses.${index}.merchant`)}
            className="w-full bg-surface border border-border-warm rounded-lg px-3 py-2 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          />
          {rowErrors?.merchant && (
            <span className="text-[10px] text-destructive">{rowErrors.merchant.message}</span>
          )}
        </div>

        {/* Expense Date (2 cols) */}
        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Date</label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            {...register(`expenses.${index}.expenseDate`)}
            className="w-full bg-surface border border-border-warm rounded-lg px-2 py-2 text-xs text-ink font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all cursor-pointer"
          />
          {rowErrors?.expenseDate && (
            <span className="text-[10px] text-destructive">{rowErrors.expenseDate.message}</span>
          )}
        </div>

        {/* Unified Machined Currency & Amount Input Group (4 cols) */}
        <div className="sm:col-span-4 flex flex-col gap-1">
          <label className="sm:hidden text-[10px] font-semibold text-muted mb-1 block">Currency & Amount</label>
          <div className="flex items-center rounded-lg border border-border-warm bg-surface shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden h-9">
            {/* Integrated Currency Dropdown */}
            <select
              {...register(`expenses.${index}.originalCurrency`)}
              className="h-full bg-surface-subtle hover:bg-secondary/40 px-2.5 text-xs font-semibold text-ink border-r border-border-warm focus:outline-none cursor-pointer shrink-0 transition-colors"
              aria-label="Currency"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Seamless Borderless Monospace Amount Input */}
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              {...register(`expenses.${index}.originalAmount`, {
                setValueAs: parseExpenseAmount,
              })}
              onKeyDown={(e) => {
                if (
                  ['Backspace', 'Tab', 'Enter', 'Escape', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
                  e.ctrlKey ||
                  e.metaKey
                ) {
                  return;
                }
                if (!/^[0-9.]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              className="h-full flex-1 min-w-0 bg-transparent px-3 text-xs font-mono font-bold tabular-nums text-ink placeholder:text-faint focus:outline-none"
            />
          </div>

          {/* Hidden inputs to preserve form submission schema */}
          <input type="hidden" {...register(`expenses.${index}.amount`)} />
          <input type="hidden" {...register(`expenses.${index}.inrAmount`)} />
          <input type="hidden" {...register(`expenses.${index}.exchangeRate`)} />

          {/* Live FX conversion strip (Responsive, zero-clipping financial metadata) */}
          {watchedCurrency !== 'INR' && (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10.5px] font-mono text-muted">
              <span className="text-[#50617A] shrink-0">
                1 {watchedCurrency} = ₹{loading ? '...' : rate.toFixed(2)}
              </span>
              <span
                className="font-semibold text-primary tabular-nums shrink-0 ml-auto"
                title={`≈ ₹${((Number(watchedOriginalAmount) || 0) * rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR`}
              >
                ≈ ₹{((Number(watchedOriginalAmount) || 0) * rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {rowErrors?.amount && (
            <span className="text-[10px] text-destructive">{rowErrors.amount.message}</span>
          )}
          {fxError && (
            <span className="text-[10px] text-amber-600">Rate lookup warning: using fallback</span>
          )}
        </div>

        {/* Action button (1 col) */}
        <div className="sm:col-span-1 flex justify-end sm:justify-center pt-1.5">
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Remove expense item ${index + 1}`}
            className="p-1.5 rounded-lg text-faint hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            title="Remove row"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <input
          type="text"
          placeholder="Expense details or invoice reference"
          {...register(`expenses.${index}.notes`)}
          className="w-full bg-surface border border-border-warm rounded-lg px-3 py-1.5 text-[11px] text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
        />
      </div>
    </div>
  );
};
