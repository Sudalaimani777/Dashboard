import React, { useState } from 'react';
import { Users, FolderKanban } from 'lucide-react';
import { formatINR, formatINRCompact } from '../../utils/currency';
import type { ManagerSpendersAndProjectVelocity } from '../../utils/managerAnalytics';

export interface ManagerSpendersVelocityCardProps {
  velocity: ManagerSpendersAndProjectVelocity;
}

export const ManagerSpendersVelocityCard: React.FC<ManagerSpendersVelocityCardProps> = ({
  velocity,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'projects'>('members');

  const maxMemberSpend = velocity.byMember[0]?.totalSpend || 1;
  const maxProjectSpend = velocity.byProject[0]?.totalSpend || 1;

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col justify-between gap-4">
      {/* Header with Mode Toggle */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-surface-subtle border border-border-warm text-ink">
              {activeTab === 'members' ? (
                <Users className="size-4 text-muted" />
              ) : (
                <FolderKanban className="size-4 text-muted" />
              )}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Spend Allocation</h3>
              <p className="text-[11px] text-faint">
                {activeTab === 'members'
                  ? 'Ranked team member travel spend'
                  : 'Allocation grouped by billing project'}
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Spenders drilldown mode"
            className="inline-flex rounded-lg border border-border-warm bg-surface-subtle p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer transition-all ${
                activeTab === 'members'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Team Members
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer transition-all ${
                activeTab === 'projects'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              By Project
            </button>
          </div>
        </div>
      </div>

      {/* Body List */}
      <div className="divide-y divide-border-warm/60">
        {activeTab === 'members' ? (
          velocity.byMember.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              No team member spend recorded yet.
            </div>
          ) : (
            velocity.byMember.slice(0, 4).map((m) => {
              const sharePct = Math.max(8, Math.round((m.totalSpend / maxMemberSpend) * 100));
              return (
                <div key={m.name} className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-ink truncate">{m.name}</span>
                    <span className="font-mono font-bold text-primary tabular-nums shrink-0">
                      {formatINR(m.totalSpend)}{' '}
                      <span className="text-[10px] text-faint font-normal font-mono">
                        ({formatINRCompact(m.totalSpend)})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>{m.tripCount} journey(s) logged</span>
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
        ) : velocity.byProject.length === 0 ? (
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
          {activeTab === 'members'
            ? `${velocity.byMember.length} direct report(s) with travel activity`
            : `${velocity.byProject.length} project codes tracked`}
        </span>
      </div>
    </div>
  );
};
