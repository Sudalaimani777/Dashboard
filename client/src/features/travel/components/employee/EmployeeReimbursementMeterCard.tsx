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
    color: '#00D66F',
  },
  approved: {
    label: 'Pending Payout',
    color: '#7389FF',
  },
  review: {
    label: 'In Review',
    color: '#839BC8',
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
      return [{ key: 'settled', name: 'No claims', value: 1, color: '#E5EDF5' }];
    }
    const items = [];
    if (health.totalSettledAmount > 0) {
      items.push({
        key: 'settled',
        name: 'Disbursed',
        value: health.totalSettledAmount,
        color: '#00D66F',
      });
    }
    if (health.totalPendingSettlementAmount > 0) {
      items.push({
        key: 'approved',
        name: 'Pending Payout',
        value: health.totalPendingSettlementAmount,
        color: '#7389FF',
      });
    }
    if (health.totalInReviewAmount > 0) {
      items.push({
        key: 'review',
        name: 'In Review',
        value: health.totalInReviewAmount,
        color: '#839BC8',
      });
    }
    return items;
  }, [totalVolume, health.totalSettledAmount, health.totalPendingSettlementAmount, health.totalInReviewAmount]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-2 h-[300px] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 shrink-0">
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
      <div className="relative flex flex-col items-center justify-center -my-3 shrink-0">
        <ChartContainer config={chartConfig} className="h-[125px] w-full max-w-[260px]">
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
              innerRadius={58}
              outerRadius={80}
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
                          y={(viewBox.cy || 0) - 18}
                          className="fill-ink text-xl font-bold font-mono tabular-nums"
                        >
                          {health.settlementRatePct}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 3}
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

      {/* Clean Asymmetric Readout (No generic 3-box row) */}
      <div className="pt-2 border-t border-border-warm/70 grid grid-cols-3 gap-2 text-xs shrink-0">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#00D66F]" /> Disbursed
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
            <span className="size-2 rounded-full bg-[#7389FF]" /> Pending Payout
          </span>
          <span className="block font-mono text-xs font-bold text-[#533AFD] tabular-nums mt-0.5">
            {formatINRCompact(health.totalPendingSettlementAmount)}
          </span>
          <span className="text-[10px] text-faint font-mono">
            {health.pendingSettlementCount} claim{health.pendingSettlementCount === 1 ? '' : 's'}
          </span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#839BC8]" /> In Review
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
      <div className="pt-1.5 border-t border-border-warm/50 text-[11px] text-muted shrink-0">
        {health.pendingSettlementCount > 0
          ? `Finance is clearing ${formatINR(health.totalPendingSettlementAmount)} across ${health.pendingSettlementCount} approved claim(s).`
          : 'All approved expense claims have been settled to your account.'}
      </div>
    </div>
  );
};
