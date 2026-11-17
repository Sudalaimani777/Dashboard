import React, { useMemo } from 'react';
import { Pie, PieChart, Cell, Label } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../../shared/components/ui/chart';
import { formatINR, formatINRCompact } from '../../utils/currency';
import type { EmployeeSettlementHealth } from '../../utils/employeeAnalytics';

export interface EmployeeReimbursementMeterCardProps {
  health: EmployeeSettlementHealth;
}

const chartConfig = {
  settled: {
    label: 'Disbursed',
    color: '#15803D',
  },
  approved: {
    label: 'Pending Payout',
    color: '#D4A373',
  },
  review: {
    label: 'In Review',
    color: '#E8DFD3',
  },
} satisfies ChartConfig;

export const EmployeeReimbursementMeterCard: React.FC<EmployeeReimbursementMeterCardProps> = ({
  health,
}) => {
  const totalVolume =
    health.totalSettledAmount +
    health.totalPendingSettlementAmount +
    health.totalInReviewAmount;

  const pieData = useMemo(() => {
    if (totalVolume === 0) {
      return [{ key: 'settled', name: 'No claims', value: 1, color: '#E8DFD3' }];
    }
    const items = [];
    if (health.totalSettledAmount > 0) {
      items.push({
        key: 'settled',
        name: 'Disbursed',
        value: health.totalSettledAmount,
        color: '#15803D',
      });
    }
    if (health.totalPendingSettlementAmount > 0) {
      items.push({
        key: 'approved',
        name: 'Pending Payout',
        value: health.totalPendingSettlementAmount,
        color: '#D4A373',
      });
    }
    if (health.totalInReviewAmount > 0) {
      items.push({
        key: 'review',
        name: 'In Review',
        value: health.totalInReviewAmount,
        color: '#C2B8AC',
      });
    }
    return items;
  }, [totalVolume, health.totalSettledAmount, health.totalPendingSettlementAmount, health.totalInReviewAmount]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Reimbursement Progress</h3>
          <p className="text-[11px] text-faint">Payout across submitted expense claims</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold text-ink">
            {health.avgTurnaroundDays !== null
              ? health.avgTurnaroundDays < 1
                ? '< 1d'
                : `~${health.avgTurnaroundDays}d`
              : '—'}
          </span>
          <span className="block text-[10px] text-muted font-medium">
            {health.avgTurnaroundDays !== null ? 'Avg settlement' : 'No settled claims'}
          </span>
        </div>
      </div>

      {/* 180-Degree Half-Pie Meter */}
      <div className="relative flex flex-col items-center justify-center -my-3">
        <ChartContainer config={chartConfig} className="h-[145px] w-full max-w-[280px]">
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
              data={pieData}
              dataKey="value"
              nameKey="name"
              startAngle={180}
              endAngle={0}
              innerRadius={68}
              outerRadius={92}
              cy="95%"
              paddingAngle={pieData.length > 1 ? 3 : 0}
            >
              {pieData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 20}
                          className="fill-ink text-2xl font-bold font-mono tabular-nums"
                        >
                          {health.settlementRatePct}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 4}
                          className="fill-muted text-[11px] font-semibold"
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

      {/* Clean Asymmetric Readout (No generic 3-box row) */}
      <div className="pt-2 border-t border-border-warm/70 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#15803D]" /> Disbursed
          </span>
          <span className="block font-mono text-xs font-bold text-ink tabular-nums mt-0.5">
            {formatINRCompact(health.totalSettledAmount)}
          </span>
          <span className="text-[10px] text-faint font-mono">
            {health.settledCount} claim{health.settledCount === 1 ? '' : 's'}
          </span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#D4A373]" /> Pending Payout
          </span>
          <span className="block font-mono text-xs font-bold text-[#8A582B] tabular-nums mt-0.5">
            {formatINRCompact(health.totalPendingSettlementAmount)}
          </span>
          <span className="text-[10px] text-faint font-mono">
            {health.pendingSettlementCount} claim{health.pendingSettlementCount === 1 ? '' : 's'}
          </span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#C2B8AC]" /> In Review
          </span>
          <span className="block font-mono text-xs font-bold text-ink tabular-nums mt-0.5">
            {formatINRCompact(health.totalInReviewAmount)}
          </span>
          <span className="text-[10px] text-faint font-mono">
            {health.inReviewCount} claim{health.inReviewCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Footer Takeaway */}
      <div className="pt-2 border-t border-border-warm/50 text-[11px] text-muted">
        {health.pendingSettlementCount > 0
          ? `Finance is clearing ${formatINR(health.totalPendingSettlementAmount)} across ${health.pendingSettlementCount} approved claim(s).`
          : 'All approved expense claims have been settled to your account.'}
      </div>
    </div>
  );
};
