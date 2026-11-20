import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { formatINR, formatINRCompact } from '../utils/currency';
import { computeCategoryShares } from '../utils/budgetAnalytics';
import { DepartmentCategoryPieChart } from './charts/DepartmentCategoryPieChart';
import type { DepartmentBudget, FiscalQuarter } from '../types/travel.types';

export interface DepartmentCategoryBreakdownCardProps {
  budget: DepartmentBudget | null;
  selectedDepartment: string;
  selectedQuarter: FiscalQuarter;
  selectedYear: number;
}

export const DepartmentCategoryBreakdownCard: React.FC<DepartmentCategoryBreakdownCardProps> = ({
  budget,
  selectedDepartment,
  selectedQuarter,
  selectedYear,
}) => {
  const categoryShares = useMemo(() => {
    return computeCategoryShares(budget?.categoryBreakdown, budget?.utilizedAmount || 0);
  }, [budget?.categoryBreakdown, budget?.utilizedAmount]);

  const totalDisbursed = useMemo(() => {
    return categoryShares
      .filter((c) => c.categoryKey !== 'UNSPENT')
      .reduce((acc, c) => acc + c.amount, 0);
  }, [categoryShares]);

  const topCategory = useMemo(() => {
    const active = categoryShares.filter((c) => c.categoryKey !== 'UNSPENT' && c.amount > 0);
    return active.length > 0 ? active[0] : null;
  }, [categoryShares]);

  const activeCount = useMemo(() => {
    return categoryShares.filter((c) => c.categoryKey !== 'UNSPENT' && c.amount > 0).length;
  }, [categoryShares]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3 h-[300px] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border-warm/60 pb-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-surface-subtle border border-border-warm text-ink">
              <Layers className="size-4 text-muted" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Disbursement Mix by Category</h3>
              <p className="text-[11px] text-faint">
                {selectedDepartment} • {selectedQuarter} {selectedYear} itemized classes
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-medium text-muted uppercase">Total Disbursed</div>
            <div className="font-mono text-xs font-bold text-ink tabular-nums">
              {formatINR(totalDisbursed)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart + Itemized Category Duo */}
      {totalDisbursed > 0 ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-3.5 py-1">
          <DepartmentCategoryPieChart
            categories={categoryShares}
            totalDisbursed={totalDisbursed}
          />

          {/* Itemized Category List */}
          <div className="h-full divide-y divide-border-warm/60 overflow-y-auto min-h-0 pr-1.5">
            {categoryShares
              .filter((c) => c.categoryKey !== 'UNSPENT' && c.amount > 0)
              .map((cat) => (
                <div
                  key={cat.categoryKey}
                  className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-ink truncate block">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {cat.pct}% of period
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-ink tabular-nums">
                      {formatINR(cat.amount)}
                    </div>
                    <div className="text-[10px] text-faint font-mono">
                      ({formatINRCompact(cat.amount)})
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-muted py-4">
          No approved vouchers recorded for {selectedDepartment} in {selectedQuarter} {selectedYear}.
        </div>
      )}

      {/* Footer Takeaway */}
      <div className="pt-2 border-t border-border-warm/70 flex items-center justify-between text-[11px] text-muted shrink-0">
        <span>
          {topCategory ? (
            <strong className="text-ink font-semibold">{topCategory.label}</strong>
          ) : (
            'Zero commitments'
          )}{' '}
          {topCategory ? `leads spending with ${topCategory.pct}% share.` : 'currently against pool.'}
        </span>
        <span className="font-mono text-faint">
          {activeCount} {activeCount === 1 ? 'active class' : 'active classes'}
        </span>
      </div>
    </div>
  );
};
