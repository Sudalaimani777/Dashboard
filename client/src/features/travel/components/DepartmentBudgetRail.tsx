import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { formatINR, formatINRCompact } from '../utils/currency';
import type { DepartmentDrilldown } from '../utils/budgetAnalytics';
import type { DepartmentBudget, FiscalQuarter } from '../types/travel.types';

export interface DepartmentBudgetRailProps {
  selectedDepartment: string;
  selectedYear: number;
  selectedQuarter: FiscalQuarter;
  topAtRiskPool: DepartmentBudget | null;
  drilldown: DepartmentDrilldown;
  onAdjustPool: (
    department: string,
    year: number,
    quarter: FiscalQuarter,
    currentAmount: number
  ) => void;
}

export const DepartmentBudgetRail: React.FC<DepartmentBudgetRailProps> = ({
  selectedDepartment,
  selectedYear,
  selectedQuarter,
  topAtRiskPool,
  drilldown,
  onAdjustPool,
}) => {
  const navigate = useNavigate();
  const [railTab, setRailTab] = useState<'members' | 'trips'>('members');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drilldown.topMembers;
    return drilldown.topMembers.filter((m) => m.name.toLowerCase().includes(q));
  }, [drilldown.topMembers, searchQuery]);

  const filteredTrips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drilldown.topTrips;
    return drilldown.topTrips.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q)
    );
  }, [drilldown.topTrips, searchQuery]);

  return (
    <aside className="flex flex-col gap-5">
      {/* 1. Threshold Watch Alert */}
      {topAtRiskPool ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <AlertTriangle className="size-3.5 shrink-0" />
              Threshold Watch • {topAtRiskPool.department}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {topAtRiskPool.utilizationPercentage.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-ink leading-relaxed">
            {topAtRiskPool.department} ({topAtRiskPool.fiscalQuarter} {topAtRiskPool.fiscalYear}) has{' '}
            <strong className="font-mono">{formatINR(topAtRiskPool.availableHeadroom)}</strong>{' '}
            headroom remaining out of {formatINRCompact(topAtRiskPool.totalAllocation)}.
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() =>
                onAdjustPool(
                  topAtRiskPool.department,
                  topAtRiskPool.fiscalYear,
                  topAtRiskPool.fiscalQuarter as FiscalQuarter,
                  topAtRiskPool.totalAllocation
                )
              }
              className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700/40 cursor-pointer transition-colors"
            >
              Adjust {topAtRiskPool.department} Pool
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#CFE3D5] bg-[#F0F7F2] p-4 flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="size-4 text-[#3F624D] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-[#2E4B3A]">All Pools Within Threshold</div>
            <p className="text-[11px] text-[#3F624D] mt-0.5">
              No configured department pools exceed 85% utilization in {selectedQuarter} {selectedYear}.
            </p>
          </div>
        </div>
      )}

      {/* 2. Request Type Split */}
      <div className="bg-surface rounded-xl border border-border-warm p-4 shadow-xs flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Request Type Split</h3>
          <p className="text-[11px] text-faint">
            {selectedDepartment} • Approved &amp; pending travel
          </p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#EFE7D8] overflow-hidden flex">
          {drilldown.upcomingPct > 0 && (
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${drilldown.upcomingPct}%` }}
              title={`Upcoming Trips: ${drilldown.upcomingPct}%`}
            />
          )}
          {drilldown.claimsPct > 0 && (
            <div
              className="h-full bg-[#1D6F72] transition-all duration-300"
              style={{ width: `${drilldown.claimsPct}%` }}
              title={`Post-Trip Claims: ${drilldown.claimsPct}%`}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="inline-flex items-center gap-1.5 text-muted text-[11px]">
              <span className="size-2 rounded-full bg-primary" />
              Upcoming Trips
            </span>
            <div className="font-mono font-bold text-ink mt-0.5 tabular-nums">
              {formatINRCompact(drilldown.upcomingTotal)}{' '}
              <span className="text-[10px] text-faint font-normal">({drilldown.upcomingPct}%)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 text-muted text-[11px]">
              <span className="size-2 rounded-full bg-[#1D6F72]" />
              Post-Trip Claims
            </span>
            <div className="font-mono font-bold text-ink mt-0.5 tabular-nums">
              {formatINRCompact(drilldown.claimsTotal)}{' '}
              <span className="text-[10px] text-faint font-normal">({drilldown.claimsPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Drilldown Card (Members | Top Trips) */}
      <div className="bg-surface rounded-xl border border-border-warm p-4 shadow-xs flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">{selectedDepartment} Drilldown</h3>
            <p className="text-[11px] text-faint">Top spenders &amp; highest-value trips</p>
          </div>
          <div
            role="group"
            aria-label="Drilldown mode"
            className="inline-flex rounded-lg border border-border-warm bg-surface-subtle p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => setRailTab('members')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer transition-all ${
                railTab === 'members'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Members
            </button>
            <button
              type="button"
              onClick={() => setRailTab('trips')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer transition-all ${
                railTab === 'trips'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Top Trips
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="size-3.5 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={railTab === 'members' ? 'Search member...' : 'Search trip or city...'}
            aria-label="Filter department drilldown"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-border-warm bg-surface-subtle text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </div>

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-0.5">
          {railTab === 'members' ? (
            filteredMembers.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">
                No matching member spend in {selectedDepartment}.
              </p>
            ) : (
              filteredMembers.map((m) => {
                const maxSpend = drilldown.topMembers[0]?.totalSpend || 1;
                const sharePct = Math.max(8, Math.round((m.totalSpend / maxSpend) * 100));
                return (
                  <div
                    key={m.name}
                    className="rounded-lg border border-border-warm bg-surface-subtle p-2.5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-ink truncate">{m.name}</span>
                      <span className="font-mono font-bold text-primary tabular-nums shrink-0">
                        {formatINRCompact(m.totalSpend)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted">
                      {m.tripCount} trip(s) • {formatINRCompact(m.approvedSpend)} approved
                      {m.pendingSpend > 0 ? ` • ${formatINRCompact(m.pendingSpend)} pending` : ''}
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
          ) : filteredTrips.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              No matching trips in {selectedDepartment}.
            </p>
          ) : (
            filteredTrips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => navigate(`/travel/${trip.id}`)}
                className="w-full text-left rounded-lg border border-border-warm bg-surface-subtle hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 p-2.5 flex flex-col gap-1 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink truncate">{trip.title}</span>
                  <span className="font-mono font-bold text-ink tabular-nums shrink-0">
                    {formatINRCompact(trip.totalExpenses)}
                  </span>
                </div>
                <div className="text-[11px] text-muted truncate">
                  {trip.requesterName} • {trip.destination} •{' '}
                  {trip.travelType === 'UPCOMING' ? 'Upcoming' : 'Claim'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
