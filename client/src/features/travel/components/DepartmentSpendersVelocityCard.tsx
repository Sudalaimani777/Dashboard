import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plane, ArrowUpRight } from 'lucide-react';
import { formatINR, formatINRCompact } from '../utils/currency';
import type { DepartmentDrilldown } from '../utils/budgetAnalytics';
import type { FiscalQuarter } from '../types/travel.types';

export interface DepartmentSpendersVelocityCardProps {
  drilldown: DepartmentDrilldown;
  selectedDepartment: string;
  selectedQuarter: FiscalQuarter;
  selectedYear: number;
}

export const DepartmentSpendersVelocityCard: React.FC<DepartmentSpendersVelocityCardProps> = ({
  drilldown,
  selectedDepartment,
  selectedQuarter,
  selectedYear,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'members' | 'trips'>('members');

  const maxMemberSpend = drilldown.topMembers[0]?.totalSpend || 1;

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-4">
      {/* Header with Mode Toggle */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-surface-subtle border border-border-warm text-ink">
              <Users className="size-4 text-muted" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Team Spenders</h3>
              <p className="text-[11px] text-faint">
                {selectedDepartment} • {selectedQuarter} {selectedYear} active spenders
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Velocity drilldown mode"
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
              Top Spenders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trips')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer transition-all ${
                activeTab === 'trips'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Key Vouchers
            </button>
          </div>
        </div>

        {/* Dual Request Type Split Bar */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-muted font-medium">
              Upcoming: <strong className="font-mono text-ink">{formatINRCompact(drilldown.upcomingTotal)}</strong> ({drilldown.upcomingPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted font-medium">
              Claims: <strong className="font-mono text-ink">{formatINRCompact(drilldown.claimsTotal)}</strong> ({drilldown.claimsPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#EFE7D8] overflow-hidden flex shadow-2xs">
            {drilldown.upcomingPct > 0 && (
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${drilldown.upcomingPct}%` }}
                title={`Upcoming: ${drilldown.upcomingPct}%`}
              />
            )}
            {drilldown.claimsPct > 0 && (
              <div
                className="h-full bg-[#1D6F72] transition-all duration-300"
                style={{ width: `${drilldown.claimsPct}%` }}
                title={`Claims: ${drilldown.claimsPct}%`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Body List */}
      <div className="divide-y divide-border-warm/60">
        {activeTab === 'members' ? (
          drilldown.topMembers.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              No individual spenders recorded in {selectedDepartment}.
            </div>
          ) : (
            drilldown.topMembers.slice(0, 4).map((m) => {
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
                    <span>{m.tripCount} trip(s) • {formatINRCompact(m.approvedSpend)} approved</span>
                    {m.pendingSpend > 0 && (
                      <span className="text-amber-700 font-mono text-[10px]">
                        +{formatINRCompact(m.pendingSpend)} pending
                      </span>
                    )}
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
        ) : drilldown.topTrips.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted">
            No active travel vouchers in {selectedDepartment}.
          </div>
        ) : (
          drilldown.topTrips.slice(0, 3).map((trip) => (
            <button
              key={trip.id}
              type="button"
              onClick={() => navigate(`/travel/requests/${trip.id}?tab=governance`)}
              className="w-full text-left py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1 rounded bg-surface-subtle border border-border-warm text-muted group-hover:text-primary transition-colors">
                  <Plane className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink truncate block group-hover:text-primary transition-colors">
                    {trip.title}
                  </span>
                  <span className="text-[10px] text-muted truncate block">
                    {trip.requesterName} • {trip.destination}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-1.5">
                <div>
                  <div className="font-mono text-xs font-bold text-ink tabular-nums">
                    {formatINRCompact(trip.totalExpenses)}
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-surface-subtle border border-border-warm text-muted">
                    {trip.status === 'APPROVED' ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <ArrowUpRight className="size-3.5 text-faint group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer Takeaway */}
      <div className="mt-auto pt-3 border-t border-border-warm/70 flex items-center justify-between text-[11px] text-muted">
        <span>
          {drilldown.topMembers.length} active spender(s) in {selectedDepartment} pool.
        </span>
        <span className="font-mono text-faint">
          {drilldown.topTrips.length} tracked voucher(s)
        </span>
      </div>
    </div>
  );
};
