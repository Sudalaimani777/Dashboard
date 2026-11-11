import React from 'react';
import { Receipt, PlaneTakeoff } from 'lucide-react';
import type { TravelType } from '../../types/travel.types';

export interface TravelTypeToggleProps {
  value: TravelType;
  onChange: (type: TravelType) => void;
}

export const TravelTypeToggle: React.FC<TravelTypeToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex bg-[#FAF8F5] p-1.5 rounded-xl border border-[#E8DFD3] gap-2 max-w-lg">
      <button
        type="button"
        onClick={() => onChange('UPCOMING')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          value === 'UPCOMING'
            ? 'bg-white text-[#2B231D] shadow-sm border border-[#E8DFD3]'
            : 'text-[#756F68] hover:text-[#2B231D]'
        }`}
      >
        <PlaneTakeoff className="w-4 h-4 text-[#8A582B]" />
        Upcoming Travel (Pre-Trip)
      </button>

      <button
        type="button"
        onClick={() => onChange('ALREADY_TRAVELLED')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          value === 'ALREADY_TRAVELLED'
            ? 'bg-white text-[#2B231D] shadow-sm border border-[#E8DFD3]'
            : 'text-[#756F68] hover:text-[#2B231D]'
        }`}
      >
        <Receipt className="w-4 h-4 text-[#8A582B]" />
        Reimbursement (Post-Trip)
      </button>
    </div>
  );
};
