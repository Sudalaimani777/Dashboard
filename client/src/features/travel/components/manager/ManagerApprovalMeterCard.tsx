import React, { useMemo } from 'react';
import { Pie, PieChart, Cell, Label } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../../shared/components/ui/chart';
import type { ManagerApprovalHealth } from '../../utils/managerAnalytics';

export interface ManagerApprovalMeterCardProps {
  health: ManagerApprovalHealth;
}

const chartConfig = {
  forwarded: {
    label: 'Forwarded / Approved',
    color: '#00D66F',
  },
  pending: {
    label: 'Pending Review',
    color: '#7389FF',
  },
  returned: {
    label: 'Needs Revision',
    color: '#FF6118',
  },
} satisfies ChartConfig;

export const ManagerApprovalMeterCard: React.FC<ManagerApprovalMeterCardProps> = ({ health }) => {
  const totalVolume =
    health.forwardedCount + health.pendingManagerCount + health.returnedCount;

  const pieData = useMemo(() => {
    if (totalVolume === 0) {
      return [{ key: 'forwarded', name: 'No requests', value: 1, color: '#E5EDF5' }];
    }
    const items = [];
    if (health.forwardedCount > 0) {
      items.push({
        key: 'forwarded',
        name: 'Forwarded / Approved',
        value: health.forwardedCount,
        color: '#00D66F',
      });
    }
    if (health.pendingManagerCount > 0) {
      items.push({
        key: 'pending',
        name: 'Pending Manager Action',
        value: health.pendingManagerCount,
        color: '#7389FF',
      });
    }
    if (health.returnedCount > 0) {
      items.push({
        key: 'returned',
        name: 'Returned for Revision',
        value: health.returnedCount,
        color: '#FF6118',
      });
    }
    return items;
  }, [totalVolume, health.forwardedCount, health.pendingManagerCount, health.returnedCount]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Approval Queue Health</h3>
          <p className="text-[11px] text-faint">Team review velocity and dispatch SLA</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold text-ink">
            {health.avgReviewDays !== null
              ? health.avgReviewDays < 1
                ? '< 1d'
                : `~${health.avgReviewDays}d`
              : '—'}
          </span>
          <span className="block text-[10px] text-muted font-medium">
            {health.avgReviewDays !== null ? 'Avg response time' : 'No reviews logged'}
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
                    `${value} request${Number(value) === 1 ? '' : 's'}`,
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
                          {health.approvalRatePct}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 4}
                          className="fill-muted text-[11px] font-semibold"
                        >
                          Actioned
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

      {/* Clean Asymmetric Readout */}
      <div className="pt-2 border-t border-border-warm/70 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#00D66F]" /> Forwarded
          </span>
          <span className="block font-mono text-xs font-bold text-ink tabular-nums mt-0.5">
            {health.forwardedCount}
          </span>
          <span className="text-[10px] text-faint">Approved to Admin</span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#7389FF]" /> Pending Action
          </span>
          <span className="block font-mono text-xs font-bold text-[#533AFD] tabular-nums mt-0.5">
            {health.pendingManagerCount}
          </span>
          <span className="text-[10px] text-faint">Awaiting review</span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className="size-2 rounded-full bg-[#FF6118]" /> Corrections
          </span>
          <span className="block font-mono text-xs font-bold text-ink tabular-nums mt-0.5">
            {health.returnedCount}
          </span>
          <span className="text-[10px] text-faint">Returned to staff</span>
        </div>
      </div>

      {/* Footer Takeaway */}
      <div className="pt-2 border-t border-border-warm/50 text-[11px] text-muted">
        {health.pendingManagerCount > 0
          ? `${health.pendingManagerCount} team request(s) waiting for line manager review.`
          : 'All team travel requests have been reviewed and forwarded.'}
      </div>
    </div>
  );
};
