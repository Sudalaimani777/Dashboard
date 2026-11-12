import React from 'react';
import { IndianRupee, Clock, CheckCircle2 } from 'lucide-react';

export interface MetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  isCurrency?: boolean;
}

export interface TravelMetricsGridProps {
  metrics: MetricItem[];
}

export const TravelMetricsGrid: React.FC<TravelMetricsGridProps> = ({ metrics }) => {
  const getIcon = (label: string, isCurrency?: boolean) => {
    if (isCurrency) return <IndianRupee className="size-4 text-primary" />;
    if (label.toLowerCase().includes('pending') || label.toLowerCase().includes('active')) {
      return <Clock className="size-4 text-amber-700" />;
    }
    return <CheckCircle2 className="size-4 text-emerald-700" />;
  };

  return (
    <div className={`grid grid-cols-1 gap-4 ${metrics.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className={`relative rounded-xl border p-4.5 flex flex-col justify-between transition-all ${
            m.isCurrency
              ? 'border-primary/30 bg-surface shadow-xs ring-1 ring-primary/10'
              : 'border-border-warm bg-surface-subtle/80 hover:bg-surface-subtle'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">
              {m.label}
            </span>
            <span className={`p-1 rounded-md ${m.isCurrency ? 'bg-primary/10' : 'bg-surface'}`}>
              {getIcon(m.label, m.isCurrency)}
            </span>
          </div>

          <div className="mt-2">
            <span
              className={`text-2xl font-bold tracking-tight block ${
                m.isCurrency
                  ? 'font-mono tabular-nums text-primary'
                  : 'text-ink'
              }`}
            >
              {m.value}
            </span>
            {m.subtext && (
              <span className="text-[11px] text-faint block mt-0.5">
                {m.subtext}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
