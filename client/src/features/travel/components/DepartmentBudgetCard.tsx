import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { formatINR, formatINRCompact } from '../utils/currency';
import type { DepartmentBudget } from '../types/travel.types';

export interface DepartmentBudgetCardProps {
  budget: DepartmentBudget | null;
  departmentName?: string;
}

export const DepartmentBudgetCard: React.FC<DepartmentBudgetCardProps> = ({
  budget,
}) => {
  const totalAllocation = budget?.totalAllocation ?? 0;
  const utilizedAmount = budget?.utilizedAmount ?? 0;
  const availableHeadroom = budget?.availableHeadroom ?? Math.max(0, totalAllocation - utilizedAmount);
  const utilizationPercentage = budget?.utilizationPercentage ?? (totalAllocation > 0 ? (utilizedAmount / totalAllocation) * 100 : 0);

  const isHeadroomLow = totalAllocation > 0 && utilizationPercentage > 85;

  return (
    <div className="rounded-xl border border-border-warm bg-surface p-5 sm:p-6 shadow-xs text-left space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border-warm pb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink mt-0.5">
            Quarterly Travel Budget & Headroom
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Total Pool:</span>
          <span className="font-mono font-bold text-sm text-ink tabular-nums">
            {totalAllocation > 0 ? formatINR(totalAllocation) : 'Unallocated'}
          </span>
          {totalAllocation > 0 && (
            <span className="text-[11px] text-faint">({formatINRCompact(totalAllocation)})</span>
          )}
        </div>
      </div>

      {/* Numerical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border-warm bg-surface-subtle p-3.5">
          <span className="text-[11px] font-semibold text-muted block">Available Headroom</span>
          <span className={`text-xl font-bold font-mono tabular-nums block mt-1 ${isHeadroomLow ? 'text-amber-700' : 'text-emerald-700'}`}>
            {formatINR(availableHeadroom)}
          </span>
          <span className="text-[10px] text-faint block mt-0.5">
            {(100 - utilizationPercentage).toFixed(1)}% remaining
          </span>
        </div>

        <div className="rounded-xl border border-border-warm bg-surface-subtle p-3.5">
          <span className="text-[11px] font-semibold text-muted block">Utilized to Date</span>
          <span className="text-xl font-bold font-mono tabular-nums text-ink block mt-1">
            {formatINR(utilizedAmount)}
          </span>
          <span className="text-[10px] text-faint block mt-0.5">
            {utilizationPercentage.toFixed(1)}% committed
          </span>
        </div>

        <div className="rounded-xl border border-border-warm bg-surface-subtle p-3.5">
          <span className="text-[11px] font-semibold text-muted block">Governance Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-xs font-bold text-ink">
              {isHeadroomLow ? 'Headroom Low' : 'Within Budget'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted">Pool Utilization</span>
          <span className="font-mono font-bold text-ink">
            {utilizationPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-canvas border border-border-warm overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isHeadroomLow ? 'bg-amber-600' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, utilizationPercentage))}%` }}
          />
        </div>
      </div>

      {isHeadroomLow ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          <span>Department quarterly travel allocation is over 85% utilized. Exercise executive scrutiny on remaining disbursements.</span>
        </div>
      ) : null}
    </div>
  );
};
