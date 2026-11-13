import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../shared/components/ui/card';
import { formatINRCompact } from '../../utils/currency';
import type { DepartmentBudget, FiscalQuarter } from '../../types/travel.types';

export interface DepartmentComparisonChartProps {
  budgets: DepartmentBudget[];
  selectedDepartment: string;
  selectedYear: number;
  selectedQuarter: FiscalQuarter;
  onSelectDepartment: (dept: string, year: number, quarter: FiscalQuarter) => void;
}

export const DepartmentComparisonChart: React.FC<DepartmentComparisonChartProps> = ({
  budgets,
  selectedDepartment,
  selectedYear,
  selectedQuarter,
  onSelectDepartment,
}) => {
  const sorted = [...budgets].sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

  return (
    <Card className="flex flex-col bg-surface border border-border-warm rounded-xl shadow-xs">
      <CardHeader className="items-start border-b border-border-warm pb-3">
        <CardTitle className="text-sm font-semibold text-ink">
          Department Pool Comparison
        </CardTitle>
        <CardDescription className="text-xs text-muted">
          Utilized share across pools ({selectedQuarter} {selectedYear})
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-center gap-3.5 pt-4">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">
            Configure department pools to compare utilization side-by-side.
          </p>
        ) : (
          sorted.slice(0, 5).map((row) => {
            const pct = Math.min(100, Math.max(0, row.utilizationPercentage));
            const isActive =
              row.department.toLowerCase() === selectedDepartment.toLowerCase() &&
              row.fiscalYear === selectedYear &&
              row.fiscalQuarter === selectedQuarter;
            const barColor =
              row.utilizationPercentage > 85
                ? 'bg-destructive'
                : row.utilizationPercentage >= 70
                ? 'bg-primary'
                : 'bg-[#3F624D]';

            return (
              <button
                key={row.id}
                type="button"
                onClick={() =>
                  onSelectDepartment(
                    row.department,
                    row.fiscalYear,
                    row.fiscalQuarter as FiscalQuarter
                  )
                }
                className={`w-full text-left rounded-lg p-2 -mx-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive ? 'bg-surface-subtle' : 'hover:bg-surface-subtle/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                  <span className="font-semibold text-ink truncate">
                    {row.department}{' '}
                    <span className="text-[10px] font-mono text-faint font-normal">
                      {row.fiscalQuarter} {row.fiscalYear}
                    </span>
                  </span>
                  <span
                    className={`font-mono tabular-nums text-[11px] font-semibold shrink-0 ${
                      row.utilizationPercentage > 85 ? 'text-destructive' : 'text-muted'
                    }`}
                  >
                    {row.utilizationPercentage.toFixed(1)}% ({formatINRCompact(row.utilizedAmount)} /{' '}
                    {formatINRCompact(row.totalAllocation)})
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#EFE7D8] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
