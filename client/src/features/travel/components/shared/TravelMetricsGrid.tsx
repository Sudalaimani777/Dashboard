import React from 'react';
import { IndianRupee, Clock, CheckCircle2, AlertTriangle, FileEdit, Plane } from 'lucide-react';

export interface MetricPill {
  label: string;
  value: string | number;
}

export interface MetricProgressSegment {
  label: string;
  percentage: number;
  color: string;
}

export interface MetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  isCurrency?: boolean;
  tone?: 'default' | 'primary' | 'amber' | 'emerald';
  badge?: string;
  pills?: MetricPill[];
  progressSegments?: MetricProgressSegment[];
  onClick?: () => void;
}

export interface TravelMetricsGridProps {
  metrics: MetricItem[];
}

export const TravelMetricsGrid: React.FC<TravelMetricsGridProps> = ({ metrics }) => {
  const getIcon = (m: MetricItem) => {
    const lower = m.label.toLowerCase();
    const iconTone =
      m.isCurrency || m.tone === 'primary'
        ? 'text-primary'
        : m.tone === 'amber'
        ? 'text-amber-700'
        : 'text-muted';

    if (m.isCurrency) return <IndianRupee className={`size-4 ${iconTone}`} />;
    if (m.tone === 'amber' || lower.includes('revision') || lower.includes('attention')) {
      return <AlertTriangle className={`size-4 ${iconTone}`} />;
    }
    if (lower.includes('draft')) return <FileEdit className={`size-4 ${iconTone}`} />;
    if (lower.includes('pending') || lower.includes('active')) {
      return <Clock className={`size-4 ${iconTone}`} />;
    }
    if (lower.includes('project') || lower.includes('trip')) {
      return <Plane className={`size-4 ${iconTone}`} />;
    }
    return <CheckCircle2 className={`size-4 ${iconTone}`} />;
  };

  const gridCols =
    metrics.length >= 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : metrics.length === 2
      ? 'sm:grid-cols-2'
      : 'sm:grid-cols-3';

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
      {metrics.map((m, idx) => {
        const clickable = Boolean(m.onClick);
        const cardClassName = `relative rounded-xl border p-4 flex flex-col gap-2.5 text-left transition-all ${
          m.isCurrency || m.tone === 'primary'
            ? 'border-primary/35 bg-surface shadow-xs'
            : m.tone === 'amber'
            ? 'border-amber-200 bg-amber-50/40'
            : 'border-border-warm bg-surface shadow-2xs'
        } ${
          clickable
            ? 'cursor-pointer hover:border-primary/50 hover:bg-surface-subtle/60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
            : ''
        }`;

        const innerContent = (
          <>
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="text-xs font-medium text-muted truncate">{m.label}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {m.badge && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100/80 text-amber-800 border border-amber-200/80">
                    {m.badge}
                  </span>
                )}
                <span aria-hidden="true">{getIcon(m)}</span>
              </div>
            </div>

            <div className="w-full my-auto">
              <span
                className={`text-2xl font-bold tracking-tight block tabular-nums ${
                  m.isCurrency ? 'font-mono text-primary' : 'text-ink'
                }`}
              >
                {m.value}
              </span>
              {m.subtext && (
                <span className="text-[11px] text-faint block mt-0.5 truncate">{m.subtext}</span>
              )}
            </div>

            {m.pills && m.pills.length > 0 && (
              <div className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-border-warm/60 text-[11px] text-muted">
                {m.pills.map((pill) => (
                  <span key={pill.label} className="inline-flex items-center gap-1">
                    <span>{pill.label}</span>
                    <strong className="text-ink font-semibold font-mono tabular-nums">
                      {pill.value}
                    </strong>
                  </span>
                ))}
              </div>
            )}

            {m.progressSegments && m.progressSegments.length > 0 && (
              <div className="w-full flex flex-col gap-1.5 pt-2 border-t border-border-warm/60">
                <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden flex">
                  {m.progressSegments.map((seg) => (
                    <div
                      key={seg.label}
                      title={`${seg.label}: ${seg.percentage}%`}
                      style={{ width: `${Math.max(seg.percentage, 3)}%`, backgroundColor: seg.color }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-muted">
                  {m.progressSegments.slice(0, 3).map((seg) => (
                    <span key={seg.label} className="inline-flex items-center gap-1">
                      <span
                        className="size-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      {seg.label} {seg.percentage}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        );

        if (clickable) {
          return (
            <button key={idx} type="button" onClick={m.onClick} className={cardClassName}>
              {innerContent}
            </button>
          );
        }

        return (
          <div key={idx} className={cardClassName}>
            {innerContent}
          </div>
        );
      })}
    </div>
  );
};
