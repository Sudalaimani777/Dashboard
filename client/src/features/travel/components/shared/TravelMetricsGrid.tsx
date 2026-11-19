import React from 'react';
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  Plane,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';

export interface MetricPill {
  label: string;
  value: string | number;
  onClick?: (e: React.MouseEvent) => void;
  isActive?: boolean;
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
  icon?: React.ReactNode;
  isCurrency?: boolean;
  tone?: 'default' | 'primary' | 'amber' | 'emerald';
  badge?: string;
  pills?: MetricPill[];
  progressSegments?: MetricProgressSegment[];
  onClick?: () => void;
  isActive?: boolean;
}

export interface TravelMetricsGridProps {
  metrics: MetricItem[];
}

export const TravelMetricsGrid: React.FC<TravelMetricsGridProps> = ({ metrics }) => {
  const getIcon = (m: MetricItem) => {
    if (m.icon) return m.icon;

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
    if (lower.includes('unassigned')) {
      return Number(m.value) > 0 ? (
        <UserX className="size-4 text-amber-700" />
      ) : (
        <UserCheck className="size-4 text-emerald-700" />
      );
    }
    if (
      lower.includes('manager') ||
      lower.includes('admin') ||
      lower.includes('clearance') ||
      lower.includes('governance')
    ) {
      return <ShieldCheck className={`size-4 ${iconTone}`} />;
    }
    if (lower.includes('member') || lower.includes('employee') || lower.includes('user')) {
      return <Users className={`size-4 ${iconTone}`} />;
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
        const cardClassName = `relative rounded-xl border p-3.5 sm:p-4 flex flex-col justify-between text-left transition-all ${
          m.isActive
            ? m.tone === 'amber'
              ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/30'
              : 'border-primary bg-primary/[0.04] shadow-sm ring-2 ring-primary/30'
            : m.isCurrency || m.tone === 'primary'
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
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-semibold text-slate-700 truncate">{m.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {m.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    {m.badge}
                  </span>
                )}
                <span aria-hidden="true" className="text-slate-500">{getIcon(m)}</span>
              </div>
            </div>

            <div className="w-full my-auto mt-1">
              <span
                className={`text-2xl font-bold tracking-tight block tabular-nums ${
                  m.isCurrency ? 'font-mono text-primary' : 'text-ink'
                }`}
              >
                {m.value}
              </span>

              {m.pills && m.pills.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mt-0.5 truncate">
                  {m.pills.map((pill, pIdx) => (
                    <span
                      key={pill.label}
                      onClick={
                        pill.onClick
                          ? (e) => {
                              e.stopPropagation();
                              pill.onClick!(e);
                            }
                          : undefined
                      }
                      className={`inline-flex items-center gap-1 transition-colors ${
                        pill.isActive
                          ? 'font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/25'
                          : pill.onClick
                          ? 'hover:text-ink cursor-pointer'
                          : ''
                      }`}
                    >
                      {pIdx > 0 && !pill.isActive && <span className="text-slate-400 mr-0.5">·</span>}
                      <span>{pill.label}</span>
                      <strong className="text-ink font-semibold font-mono tabular-nums">
                        {pill.value}
                      </strong>
                    </span>
                  ))}
                </div>
              ) : m.subtext ? (
                <span className="text-[11px] text-slate-600 font-medium block mt-0.5 truncate">{m.subtext}</span>
              ) : null}
            </div>
          </>
        );

        if (clickable) {
          return (
            <button
              key={idx}
              type="button"
              onClick={m.onClick}
              aria-pressed={Boolean(m.isActive)}
              className={cardClassName}
            >
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
