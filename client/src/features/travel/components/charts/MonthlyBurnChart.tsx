import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../../shared/components/ui/chart';
import { formatINR } from '../../utils/currency';
import type { MonthlyBurnPoint } from '../../utils/budgetAnalytics';

export interface MonthlyBurnChartProps {
  data: MonthlyBurnPoint[];
  department: string;
}

const chartConfig = {
  approved: {
    label: 'Approved Spend',
    color: '#8A582B',
  },
  pending: {
    label: 'Pending Commitments',
    color: '#D4A373',
  },
} satisfies ChartConfig;

export const MonthlyBurnChart: React.FC<MonthlyBurnChartProps> = ({ data, department }) => {
  const hasActivity = useMemo(
    () => data.some((d) => d.approved > 0 || d.pending > 0),
    [data]
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold text-ink">
            6-Month Chart ({department})
          </h3>
          <p className="text-[11px] text-faint">Approved vs. pending INR commitments</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#8A582B]" />
            Approved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#D4A373]" />
            Pending
          </span>
        </div>
      </div>

      {!hasActivity ? (
        <div className="h-[190px] rounded-xl border border-dashed border-border-warm bg-surface-subtle/60 flex items-center justify-center text-xs text-muted px-4 text-center">
          No recent monthly travel spend recorded for {department}.
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-[190px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#EFE7D8" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: '#6E655C', fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(232, 223, 211, 0.35)' }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    formatINR(Number(value)),
                    name === 'approved' ? 'Approved' : 'Pending',
                  ]}
                />
              }
            />
            <Bar dataKey="approved" fill="var(--color-approved)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
};
