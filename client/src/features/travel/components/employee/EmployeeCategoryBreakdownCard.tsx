import React, { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { formatINR, formatINRCompact } from '../../utils/currency';
import type { EmployeeCategoryShare } from '../../utils/employeeAnalytics';

export interface EmployeeCategoryBreakdownCardProps {
  categories: EmployeeCategoryShare[];
}

export const EmployeeCategoryBreakdownCard: React.FC<EmployeeCategoryBreakdownCardProps> = ({
  categories,
}) => {
  const totalDisbursed = useMemo(() => {
    return categories.reduce((acc, c) => acc + c.amount, 0);
  }, [categories]);

  const topCategory = useMemo(() => {
    return categories.length > 0 ? categories[0] : null;
  }, [categories]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-surface-subtle border border-border-warm text-ink">
              <Layers className="size-4 text-muted" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Disbursement Mix by Category</h3>
              <p className="text-[11px] text-faint">
                Itemized personal travel spend classes
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium text-muted">Total Disbursed</div>
            <div className="font-mono text-sm font-bold text-ink tabular-nums">
              {formatINR(totalDisbursed)}
            </div>
          </div>
        </div>

        {/* Visual Stacked Proportion Bar */}
        <div className="mt-4">
          <div className="h-2.5 w-full rounded-full bg-[#EFE7D8] overflow-hidden flex shadow-2xs">
            {totalDisbursed > 0 ? (
              categories.map((cat) => (
                <div
                  key={cat.categoryKey}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                  title={`${cat.label}: ${cat.percentage}% (${formatINR(cat.amount)})`}
                />
              ))
            ) : (
              <div
                className="h-full w-full bg-[#E5EDF5]"
                title="No expenses logged"
              />
            )}
          </div>
        </div>
      </div>

      {/* Itemized Category Grid / List */}
      <div className="divide-y divide-border-warm/60">
        {totalDisbursed > 0 ? (
          categories.map((cat) => (
            <div
              key={cat.categoryKey}
              className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink truncate block">
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-muted font-mono">
                    {cat.percentage}% of total logged spend
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
          ))
        ) : (
          <div className="py-6 text-center text-xs text-muted">
            No itemized expenses recorded in submitted trips.
          </div>
        )}
      </div>

      {/* Footer Takeaway */}
      <div className="mt-auto pt-3 border-t border-border-warm/70 flex items-center justify-between text-[11px] text-muted">
        <span>
          {topCategory ? (
            <strong className="text-ink font-semibold">{topCategory.label}</strong>
          ) : (
            'Zero logged expenses'
          )}{' '}
          {topCategory ? `leads spending with ${topCategory.percentage}% share.` : 'currently.'}
        </span>
        <span className="font-mono text-faint">
          {categories.length} active classes
        </span>
      </div>
    </div>
  );
};
