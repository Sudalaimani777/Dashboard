import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import type { CategorySummary } from '../../utils/travelAnalytics';

export interface CategorySpendBreakdownCardProps {
  title?: string;
  subtitle?: string;
  totalSpend: number;
  categories: CategorySummary[];
  emptyMessage?: string;
}

export const CategorySpendBreakdownCard: React.FC<CategorySpendBreakdownCardProps> = ({
  title = 'Spend by Category',
  subtitle = 'Itemized breakdown across expense classes',
  totalSpend,
  categories,
  emptyMessage = 'No itemized expenses recorded yet.',
}) => {
  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-2 border-b border-border-warm pb-3">
        <div>
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <PieChartIcon className="size-4 text-primary" />
            {title}
          </h3>
          <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>
        </div>
        <span className="text-sm font-mono font-bold tabular-nums text-primary shrink-0">
          {formatINR(totalSpend)}
        </span>
      </div>

      {categories.length === 0 || totalSpend <= 0 ? (
        <p className="text-xs text-muted py-4 text-center">{emptyMessage}</p>
      ) : (
        <>
          <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden flex">
            {categories.map((cat) => (
              <div
                key={cat.category}
                title={`${cat.label}: ${formatINR(cat.total)} (${cat.percentage}%)`}
                style={{ width: `${Math.max(cat.percentage, 3)}%`, backgroundColor: cat.color }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {categories.map((cat) => (
              <div key={cat.category} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-ink font-medium">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.label}
                  </span>
                  <span className="font-mono tabular-nums text-ink font-semibold">
                    {formatINR(cat.total)}{' '}
                    <span className="text-[10px] text-muted font-normal">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
