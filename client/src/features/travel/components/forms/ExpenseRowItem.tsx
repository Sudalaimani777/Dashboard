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
    <div className="grid grid-cols-12 gap-3 items-center bg-[#FAF8F5] p-3 rounded-xl border border-[#E8DFD3]">
      <div className="col-span-3">
        <select
          {...register(`expenses.${index}.category`)}
          className="w-full bg-white border border-[#E8DFD3] rounded-lg px-2.5 py-2 text-xs font-medium text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        >
          <option value="FLIGHT">Flight</option>
          <option value="HOTEL">Hotel</option>
          <option value="MEALS_PER_DIEM">Meals / Per Diem</option>
          <option value="TRANSIT">Local Transit</option>
          <option value="MISC">Miscellaneous</option>
        </select>
      </div>

      <div className="col-span-5">
        <input
          type="text"
          placeholder="Merchant (e.g. Air India, Marriott)"
          {...register(`expenses.${index}.merchant`)}
          className="w-full bg-white border border-[#E8DFD3] rounded-lg px-3 py-2 text-xs text-[#2B231D] placeholder:text-[#A0988E] focus:outline-none focus:border-[#8A582B]"
        />
      </div>

      <div className="col-span-3">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#756F68]">₹</span>
          <input
            type="number"
            step="100"
            placeholder="0.00"
            {...register(`expenses.${index}.amount`, { valueAsNumber: true })}
            className="w-full bg-white border border-[#E8DFD3] rounded-lg pl-6 pr-2.5 py-2 text-xs font-mono tabular-nums text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
          />
        </div>
      </div>

      <div className="col-span-1 flex justify-center">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1.5 rounded text-[#A0988E] hover:text-[#9E2A2B] hover:bg-[#FDF2F2] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Remove row"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
