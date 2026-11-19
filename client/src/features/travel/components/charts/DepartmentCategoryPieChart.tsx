import React, { useMemo } from 'react';
import { Pie, PieChart, Cell, Label } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../../shared/components/ui/chart';
import { formatINR, formatINRCompact } from '../../utils/currency';
import type { CategoryShareItem } from '../../utils/budgetAnalytics';

export interface DepartmentCategoryPieChartProps {
  categories: CategoryShareItem[];
  totalDisbursed?: number;
}

export const DepartmentCategoryPieChart: React.FC<DepartmentCategoryPieChartProps> = ({
  categories,
  totalDisbursed,
}) => {
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.categoryKey !== 'UNSPENT' && c.amount > 0);
  }, [categories]);

  const computedTotal = useMemo(() => {
    if (typeof totalDisbursed === 'number') return totalDisbursed;
    return activeCategories.reduce((sum, c) => sum + c.amount, 0);
  }, [totalDisbursed, activeCategories]);

  const chartConfig = useMemo(() => {
    const conf: ChartConfig = {};
    activeCategories.forEach((cat) => {
      conf[cat.categoryKey] = {
        label: cat.label,
        color: cat.color,
      };
    });
    return conf;
  }, [activeCategories]);

  const hasData = activeCategories.length > 0 && computedTotal > 0;

  if (!hasData) {
    return (
      <div className="h-[180px] w-full rounded-xl border border-dashed border-border-warm bg-surface-subtle/60 flex items-center justify-center text-xs text-muted px-4 text-center">
        No active disbursements logged for this period.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <ChartContainer config={chartConfig} className="h-[180px] w-[180px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, name) => [formatINR(Number(value)), name]}
                hideLabel
              />
            }
          />
          <Pie
            data={activeCategories}
            dataKey="amount"
            nameKey="label"
            innerRadius={48}
            outerRadius={70}
            stroke="#FAF7F2"
            strokeWidth={2}
            paddingAngle={2}
          >
            {activeCategories.map((entry) => (
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
                        {formatINRCompact(computedTotal)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 12}
                        className="fill-muted text-[10px] font-semibold"
                      >
                        Disbursed
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
};
