import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import {
  Label,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../../shared/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../../shared/components/ui/chart';
import { formatINR, formatINRCompact } from '../../utils/currency';
import type { DepartmentBudget } from '../../types/travel.types';

export interface HeadroomRadialGaugeProps {
  budget: DepartmentBudget | null;
}

export const HeadroomRadialGauge: React.FC<HeadroomRadialGaugeProps> = ({ budget }) => {
  const totalAllocation = budget?.totalAllocation ?? 0;
  const utilizedAmount = budget?.utilizedAmount ?? 0;
  const availableHeadroom = budget?.availableHeadroom ?? Math.max(0, totalAllocation - utilizedAmount);
  const utilizationPercentage = budget?.utilizationPercentage ?? (totalAllocation > 0 ? (utilizedAmount / totalAllocation) * 100 : 0);
  const isHeadroomLow = totalAllocation > 0 && utilizationPercentage > 85;

  const chartData = useMemo(() => [
    {
      quarter: `${budget?.fiscalQuarter || 'Q4'} ${budget?.fiscalYear || 2026}`,
      utilized: utilizedAmount,
      headroom: availableHeadroom,
    },
  ], [budget?.fiscalQuarter, budget?.fiscalYear, utilizedAmount, availableHeadroom]);

  const chartConfig = useMemo(() => ({
    utilized: {
      label: 'Utilized Spend',
      color: isHeadroomLow ? '#d97706' : '#8A582B',
    },
    headroom: {
      label: 'Available Headroom',
      color: '#059669',
    },
  }) satisfies ChartConfig, [isHeadroomLow]);

  return (
    <Card className="flex flex-col bg-surface border border-border-warm rounded-xl shadow-xs">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-base font-bold text-ink">Headroom Radial Gauge</CardTitle>
        <CardDescription className="text-xs text-muted">
          {budget?.department || 'Engineering'} • {budget?.fiscalQuarter || 'Q4'} {budget?.fiscalYear || 2026}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 items-center justify-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[240px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={75}
            outerRadius={105}
          >
            <RadialBar
              dataKey="utilized"
              fill="var(--color-utilized)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="headroom"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-headroom)"
              className="stroke-transparent stroke-2"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    formatINR(Number(value)),
                    name === 'utilized' ? 'Utilized Spend' : 'Available Headroom',
                  ]}
                  hideLabel
                />
              }
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 14}
                          className="fill-ink text-2xl font-bold font-mono tabular-nums"
                        >
                          {totalAllocation > 0 ? formatINRCompact(totalAllocation) : '₹0'}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 6}
                          className="fill-muted text-[11px] font-semibold"
                        >
                          Budget Pool
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-1.5 text-xs pt-2">
        <div className="flex items-center gap-1.5 leading-none font-semibold text-ink">
          {isHeadroomLow ? (
            <>
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span className="text-amber-700">Headroom Low ({utilizationPercentage.toFixed(1)}% utilized)</span>
            </>
          ) : (
            <>
              <span className="text-emerald-700">{(100 - utilizationPercentage).toFixed(1)}% Headroom Safe</span>
              <TrendingUp className="size-3.5 text-emerald-600" />
            </>
          )}
        </div>
        <div className="leading-none text-muted text-[11px]">
          Committed {formatINR(utilizedAmount)} of {formatINR(totalAllocation)}
        </div>
      </CardFooter>
    </Card>
  );
};
