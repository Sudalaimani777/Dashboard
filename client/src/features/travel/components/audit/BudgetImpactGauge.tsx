import React from 'react';
import { PieChart } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import type { DepartmentBudget } from '../../types/travel.types';

export interface BudgetImpactGaugeProps {
  budget: DepartmentBudget | null;
  requestAmount: number;
}

export const BudgetImpactGauge: React.FC<BudgetImpactGaugeProps> = ({ budget, requestAmount }) => {
  const allocation = budget?.totalAllocation || 3500000;
  const currentUtilized = budget?.utilizedAmount || 0;
  const projectedUtilized = currentUtilized + requestAmount;
  const currentPct = Math.min(100, Math.round((currentUtilized / allocation) * 100));
  const projectedPct = Math.min(100, Math.round((projectedUtilized / allocation) * 100));
  const isOverflow = projectedUtilized > allocation;

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68] flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#8A582B]" />
          Department Quarterly Budget Impact ({budget?.department || 'Engineering'})
        </h3>
        <span className={`text-xs font-bold font-mono tabular-nums ${isOverflow ? 'text-[#9E2A2B]' : 'text-[#2E7D32]'}`}>
          {isOverflow ? 'Budget Exceeded Warning' : 'Within Quarterly Allocation'}
        </span>
      </div>

      <div className="w-full bg-[#FAF8F5] border border-[#E8DFD3] h-3.5 rounded-full overflow-hidden p-0.5 relative">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isOverflow ? 'bg-[#9E2A2B]' : 'bg-[#8A582B]'}`}
          style={{ width: `${projectedPct}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-[#756F68] pt-1 border-t border-[#FAF8F5]">
        <span>Current: <strong className="font-mono tabular-nums">{formatINR(currentUtilized)}</strong> ({currentPct}%)</span>
        <span className="text-[#8A582B] font-bold">+ {formatINR(requestAmount)}</span>
        <span>Projected: <strong className={`font-mono tabular-nums ${isOverflow ? 'text-[#9E2A2B]' : 'text-[#2B231D]'}`}>{formatINR(projectedUtilized)}</strong> ({projectedPct}%)</span>
        <span>Pool: <strong className="font-mono tabular-nums text-[#2B231D]">{formatINR(allocation)}</strong></span>
      </div>
    </div>
  );
};
