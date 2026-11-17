import React, { useState } from 'react';
import { FolderKanban, MapPin } from 'lucide-react';
import { formatINR, formatINRCompact } from '../../utils/currency';
import type { EmployeeProjectAndRouteVelocity } from '../../utils/employeeAnalytics';

export interface EmployeeProjectVelocityCardProps {
  velocity: EmployeeProjectAndRouteVelocity;
}

export const EmployeeProjectVelocityCard: React.FC<EmployeeProjectVelocityCardProps> = ({
  velocity,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'route'>('project');

  const maxProjectSpend = velocity.byProject[0]?.totalSpend || 1;
  const maxRouteSpend = velocity.byRoute[0]?.totalSpend || 1;

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-4">
      {/* Header with Mode Toggle */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-surface-subtle border border-border-warm text-ink">
              {activeTab === 'project' ? (
                <FolderKanban className="size-4 text-muted" />
              ) : (
                <MapPin className="size-4 text-muted" />
              )}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Spend Allocation</h3>
              <p className="text-[11px] text-faint">
                {activeTab === 'project' ? 'Aggregated by billing project' : 'Aggregated by travel destination'}
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Allocation drilldown mode"
            className="inline-flex rounded-lg border border-border-warm bg-surface-subtle p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => setActiveTab('project')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer transition-all ${
                activeTab === 'project'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              By Project
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('route')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer transition-all ${
                activeTab === 'route'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              By Route
            </button>
          </div>
        </div>
      </div>

      {/* Body List */}
      <div className="divide-y divide-border-warm/60">
        {activeTab === 'project' ? (
          velocity.byProject.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              No project-tagged trips recorded.
            </div>
          ) : (
            velocity.byProject.slice(0, 4).map((p) => {
              const sharePct = Math.max(8, Math.round((p.totalSpend / maxProjectSpend) * 100));
              return (
                <div key={p.code} className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-ink truncate">{p.code}</span>
                    <span className="font-mono font-bold text-primary tabular-nums shrink-0">
                      {formatINR(p.totalSpend)}{' '}
                      <span className="text-[10px] text-faint font-normal font-mono">
                        ({formatINRCompact(p.totalSpend)})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>{p.tripCount} trip(s) logged</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#EFE7D8] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${sharePct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )
        ) : velocity.byRoute.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted">
            No route destinations recorded.
          </div>
        ) : (
          velocity.byRoute.slice(0, 4).map((r) => {
            const sharePct = Math.max(8, Math.round((r.totalSpend / maxRouteSpend) * 100));
            return (
              <div key={`${r.departure}-${r.destination}`} className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink truncate">
                    {r.departure} → {r.destination}
                  </span>
                  <span className="font-mono font-bold text-primary tabular-nums shrink-0">
                    {formatINR(r.totalSpend)}{' '}
                    <span className="text-[10px] text-faint font-normal font-mono">
                      ({formatINRCompact(r.totalSpend)})
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>{r.tripCount} journey(s)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#EFE7D8] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#1D6F72]"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Takeaway */}
      <div className="mt-auto pt-3 border-t border-border-warm/70 flex items-center justify-between text-[11px] text-muted">
        <span>
          {activeTab === 'project'
            ? `${velocity.byProject.length} project codes tracked`
            : `${velocity.byRoute.length} distinct routes travelled`}
        </span>
      </div>
    </div>
  );
};
