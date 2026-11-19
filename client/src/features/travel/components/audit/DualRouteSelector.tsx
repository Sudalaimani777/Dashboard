import React from 'react';
import { GitFork, User } from 'lucide-react';
import type { RevisionTarget } from '../../types/travel.types';

export interface DualRouteSelectorProps {
  value: RevisionTarget;
  onChange: (target: RevisionTarget) => void;
}

export const DualRouteSelector: React.FC<DualRouteSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-ink flex items-center gap-1.5" id="route-target-label">
        <GitFork className="size-3.5 text-primary" /> Dispatch Route Target
      </span>

      <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-labelledby="route-target-label">
        <button
          type="button"
          role="radio"
          aria-checked={value === 'MANAGER'}
          onClick={() => onChange('MANAGER')}
          className={`flex flex-col items-start p-3 rounded-xl border text-left cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.98] ${
            value === 'MANAGER'
              ? 'bg-primary/10 border-primary ring-1 ring-primary/20 text-ink'
              : 'bg-surface-subtle border-border-warm text-muted hover:bg-surface'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold flex items-center gap-1.5 text-primary">
              <User className="size-3.5" /> Route A: Via Manager
            </span>
            <span className={`size-3.5 rounded-full border flex items-center justify-center ${value === 'MANAGER' ? 'border-primary bg-primary' : 'border-border-warm bg-surface'}`}>
              {value === 'MANAGER' && <span className="size-1.5 rounded-full bg-white" />}
            </span>
          </div>
          <span className="text-[11px] text-muted mt-1.5 leading-relaxed">
            Manager coordinates revisions and assists employee.
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === 'EMPLOYEE'}
          onClick={() => onChange('EMPLOYEE')}
          className={`flex flex-col items-start p-3 rounded-xl border text-left cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.98] ${
            value === 'EMPLOYEE'
              ? 'bg-primary/10 border-primary ring-1 ring-primary/20 text-ink'
              : 'bg-surface-subtle border-border-warm text-muted hover:bg-surface'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold flex items-center gap-1.5 text-primary">
              <GitFork className="size-3.5" /> Route B: Direct to Employee
            </span>
            <span className={`size-3.5 rounded-full border flex items-center justify-center ${value === 'EMPLOYEE' ? 'border-primary bg-primary' : 'border-border-warm bg-surface'}`}>
              {value === 'EMPLOYEE' && <span className="size-1.5 rounded-full bg-white" />}
            </span>
          </div>
          <span className="text-[11px] text-muted mt-1.5 leading-relaxed">
            Employee updates expenses and proofs directly.
          </span>
        </button>
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        Resubmissions in either route return to the Line Manager first for re-verification.
      </p>
    </div>
  );
};
