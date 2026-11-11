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
  departmentName = 'Engineering',
}) => {
  const totalAllocation = budget?.totalAllocation ?? 3500000;
  const utilizedAmount = budget?.utilizedAmount ?? 0;
  const availableHeadroom = budget?.availableHeadroom ?? Math.max(0, totalAllocation - utilizedAmount);
  const utilizationPercentage = budget?.utilizationPercentage ?? (totalAllocation > 0 ? (utilizedAmount / totalAllocation) * 100 : 0);

  const isHeadroomLow = utilizationPercentage > 85;

  return (
    <div className="rounded-2xl border border-[#E8DFD3] bg-white p-5 sm:p-6 shadow-xs text-left space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E8DFD3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#756F68]">
              {departmentName} · FY2026 Q4
            </span>
            <span className="rounded-md border border-[#8A582B]/30 bg-[#8A582B]/10 px-2 py-0.5 text-[10px] font-bold text-[#8A582B]">
              Pooled Allocation
            </span>
          </div>
          <h2 className="text-base font-bold tracking-tight text-[#2B231D] mt-0.5">
            Quarterly Travel Budget & Headroom
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#756F68]">Total Pool:</span>
          <span className="font-mono font-bold text-sm text-[#2B231D] tabular-nums">
            {formatINR(totalAllocation)}
          </span>
          <span className="text-[11px] text-[#A59B90]">({formatINRCompact(totalAllocation)})</span>
        </div>
      </div>

      {/* Numerical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-3.5">
          <span className="text-[11px] font-semibold text-[#756F68] block">Available Headroom</span>
          <span className={`text-xl font-bold font-mono tabular-nums block mt-1 ${isHeadroomLow ? 'text-amber-700' : 'text-emerald-700'}`}>
            {formatINR(availableHeadroom)}
          </span>
          <span className="text-[10px] text-[#A59B90] block mt-0.5">
            {(100 - utilizationPercentage).toFixed(1)}% remaining
          </span>
        </div>

        <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-3.5">
          <span className="text-[11px] font-semibold text-[#756F68] block">Utilized to Date</span>
          <span className="text-xl font-bold font-mono tabular-nums text-[#2B231D] block mt-1">
            {formatINR(utilizedAmount)}
          </span>
          <span className="text-[10px] text-[#A59B90] block mt-0.5">
            {utilizationPercentage.toFixed(1)}% committed
          </span>
        </div>

        <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-3.5">
          <span className="text-[11px] font-semibold text-[#756F68] block">Governance Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingUp className="size-4 text-[#8A582B]" />
            <span className="text-xs font-bold text-[#2B231D]">
              {isHeadroomLow ? 'Headroom Low' : 'Within Budget'}
            </span>
          </div>
          <span className="text-[10px] text-[#A59B90] block mt-0.5">
            Real-time multi-tier enforcement
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#756F68]">Pool Utilization</span>
          <span className="font-mono font-bold text-[#2B231D]">
            {utilizationPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#F7F4EE] border border-[#E8DFD3] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isHeadroomLow ? 'bg-amber-600' : 'bg-[#8A582B]'
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
