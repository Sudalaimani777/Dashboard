import React from 'react';
import { Receipt, PlaneTakeoff } from 'lucide-react';
import type { TravelType } from '../../types/travel.types';

export interface TravelTypeToggleProps {
  value: TravelType;
  onChange: (type: TravelType) => void;
}

export const TravelTypeToggle: React.FC<TravelTypeToggleProps> = ({ value, onChange }) => {
  return (
    <div
      role="radiogroup"
      aria-label="Travel request category"
      className="flex bg-surface-subtle p-1 rounded-lg border border-border-warm gap-1.5 max-w-lg"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'UPCOMING'}
        onClick={() => onChange('UPCOMING')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] ${
          value === 'UPCOMING'
            ? 'bg-surface text-ink shadow-2xs border border-border-warm'
            : 'text-muted hover:text-ink'
        }`}
      >
        <PlaneTakeoff className="size-4 text-primary" />
        Upcoming Travel (Pre-Trip)
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === 'ALREADY_TRAVELLED'}
        onClick={() => onChange('ALREADY_TRAVELLED')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] ${
          value === 'ALREADY_TRAVELLED'
            ? 'bg-surface text-ink shadow-2xs border border-border-warm'
            : 'text-muted hover:text-ink'
        }`}
      >
        <Receipt className="size-4 text-primary" />
        Reimbursement (Post-Trip)
      </button>
    </div>
  );
};
