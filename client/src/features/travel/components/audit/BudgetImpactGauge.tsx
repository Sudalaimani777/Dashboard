import React from 'react';
import { PieChart } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import type { DepartmentBudget } from '../../types/travel.types';

export interface BudgetImpactGaugeProps {
  budget: DepartmentBudget | null;
  requestAmount: number;
}

export const BudgetImpactGauge: React.FC<BudgetImpactGaugeProps> = ({ budget, requestAmount }) => {
  const allocation = budget?.totalAllocation ?? 0;
  const currentUtilized = budget?.utilizedAmount ?? 0;
  const projectedUtilized = currentUtilized + requestAmount;
  const currentPct = allocation > 0 ? Math.min(100, Math.round((currentUtilized / allocation) * 100)) : 0;
  const rawProjectedPct = allocation > 0 ? Math.round((projectedUtilized / allocation) * 100) : 0;
  const isOverflow = allocation > 0 ? projectedUtilized > allocation : false;
  const barCurrentPct = isOverflow ? Math.min(currentPct, 92) : currentPct;
  const deltaPct = isOverflow
    ? Math.max(8, 100 - barCurrentPct)
    : Math.max(0, Math.min(100, rawProjectedPct) - barCurrentPct);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <PieChart className="size-4 text-primary" />
          Department Quarterly Budget Impact ({budget?.department || 'Department'})
        </h3>
        {allocation > 0 ? (
          <span className={`text-xs font-semibold font-mono tabular-nums ${isOverflow ? 'text-destructive' : 'text-[#3F624D]'}`}>
            {isOverflow ? 'Budget Exceeded Warning' : 'Within Quarterly Allocation'}
          </span>
        ) : (
          <span className="text-xs text-muted font-medium">Unbudgeted Department</span>
        )}
      </div>

      {allocation > 0 ? (
        <div className="w-full bg-canvas border border-border-warm h-3 rounded-full overflow-hidden flex relative">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${barCurrentPct}%` }}
            title={`Current: ${currentPct}%`}
          />
          <div
            className={`h-full transition-all duration-300 ${isOverflow ? 'bg-destructive' : 'bg-primary/40'}`}
            style={{ width: `${deltaPct}%` }}
            title={`This Trip: +${Math.max(0, rawProjectedPct - currentPct)}%`}
          />
        </div>
      ) : (
        <div className="h-2 w-full bg-canvas border border-border-warm rounded-full" />
      )}

      <div className="flex flex-wrap justify-between items-center text-xs text-muted pt-1 border-t border-border-warm/50 gap-2">
        <span>Current: <strong className="font-mono tabular-nums text-ink">{formatINR(currentUtilized)}</strong> ({currentPct}%)</span>
        <span className="text-primary font-bold">+ {formatINR(requestAmount)}</span>
        <span>Projected: <strong className={`font-mono tabular-nums ${isOverflow ? 'text-destructive' : 'text-ink'}`}>{formatINR(projectedUtilized)}</strong> ({rawProjectedPct}%)</span>
        <span>Pool: <strong className="font-mono tabular-nums text-ink">{formatINR(allocation)}</strong></span>
      </div>
    </div>
  );
};
