import React, { useMemo } from 'react';
import { Pie, PieChart, Cell, Label } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../../shared/components/ui/chart';
import { formatINR, formatINRCompact } from '../../utils/currency';
import type { ManagerCategoryShare } from '../../utils/managerAnalytics';

export interface ManagerCategoryPieChartProps {
  categories: ManagerCategoryShare[];
}

export const ManagerCategoryPieChart: React.FC<ManagerCategoryPieChartProps> = ({ categories }) => {
  const totalAmount = useMemo(
    () => categories.reduce((sum, c) => sum + c.amount, 0),
    [categories]
  );

  const chartConfig = useMemo(() => {
    const conf: ChartConfig = {};
    categories.forEach((cat) => {
      conf[cat.categoryKey] = {
        label: cat.label,
        color: cat.color,
      };
    });
    return conf;
  }, [categories]);

  const hasData = categories.length > 0 && totalAmount > 0;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-ink">
            Team Category Distribution
          </h3>
          <p className="text-[11px] text-faint">Proportional split of team travel claims</p>
        </div>
        {hasData && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-subtle border border-border-warm text-muted">
            {categories.length} {categories.length === 1 ? 'class' : 'classes'}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="h-[190px] rounded-xl border border-dashed border-border-warm bg-surface-subtle/60 flex items-center justify-center text-xs text-muted px-4 text-center">
          No team expense items logged yet.
        </div>
      ) : (
        <div className="h-[190px] w-full grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-3">
          {/* Donut Chart */}
          <ChartContainer config={chartConfig} className="h-[180px] w-[180px] mx-auto">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatINR(Number(value)),
                      name,
                    ]}
                    hideLabel
                  />
                }
              />
              <Pie
                data={categories}
                dataKey="amount"
                nameKey="label"
                innerRadius={48}
                outerRadius={70}
                stroke="#FAF7F2"
                strokeWidth={2}
                paddingAngle={2}
              >
                {categories.map((entry) => (
                  <Cell key={entry.categoryKey} fill={entry.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 4}
                            className="fill-ink text-sm font-bold font-mono tabular-nums"
                          >
                            {formatINRCompact(totalAmount)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 12}
                            className="fill-muted text-[10px] font-semibold"
                          >
                            Team Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Interactive Legend List */}
          <div className="flex flex-col justify-center divide-y divide-border-warm/60 overflow-y-auto max-h-[175px] pr-1">
            {categories.map((cat) => (
              <div
                key={cat.categoryKey}
                className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-ink truncate text-[11px]">
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-ink tabular-nums">
                    {formatINRCompact(cat.amount)}
                  </span>
                  <span className="text-[10px] text-muted font-normal">
                    ({cat.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
