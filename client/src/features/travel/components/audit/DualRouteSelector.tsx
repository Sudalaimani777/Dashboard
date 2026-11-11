import React from 'react';
import { GitFork, User, ShieldAlert } from 'lucide-react';
import type { RevisionTarget } from '../../types/travel.types';

export interface DualRouteSelectorProps {
  value: RevisionTarget;
  onChange: (target: RevisionTarget) => void;
}

export const DualRouteSelector: React.FC<DualRouteSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-[#2B231D] flex items-center gap-1.5">
        <GitFork className="w-3.5 h-3.5 text-[#8A582B]" /> Dispatch Route Target
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onChange('MANAGER')}
          className={`flex flex-col items-start p-3 rounded-xl border text-left cursor-pointer transition-all ${
            value === 'MANAGER'
              ? 'bg-[#F5EBE1] border-[#8A582B] text-[#2B231D]'
              : 'bg-[#FAF8F5] border-[#E8DFD3] text-[#756F68] hover:bg-white'
          }`}
        >
          <span className="text-xs font-bold flex items-center gap-1.5 text-[#8A582B]">
            <User className="w-3.5 h-3.5" /> Route A: Via Manager
          </span>
          <span className="text-[10px] text-[#756F68] mt-1">
            Manager coordinates revisions and assists employee.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange('EMPLOYEE')}
          className={`flex flex-col items-start p-3 rounded-xl border text-left cursor-pointer transition-all ${
            value === 'EMPLOYEE'
              ? 'bg-[#F5EBE1] border-[#8A582B] text-[#2B231D]'
              : 'bg-[#FAF8F5] border-[#E8DFD3] text-[#756F68] hover:bg-white'
          }`}
        >
          <span className="text-xs font-bold flex items-center gap-1.5 text-[#8A582B]">
            <GitFork className="w-3.5 h-3.5" /> Route B: Direct to Employee
          </span>
          <span className="text-[10px] text-[#756F68] mt-1">
            Employee updates expenses and proofs directly.
          </span>
        </button>
      </div>

      <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#E8DFD3] flex items-center gap-2 text-[10px] text-[#756F68]">
        <ShieldAlert className="w-3.5 h-3.5 text-[#B9770E] shrink-0" />
        <span>
          <strong>Invariant:</strong> In both routes, resubmissions strictly return to the Line Manager first for re-verification.
        </span>
      </div>
    </div>
  );
};
