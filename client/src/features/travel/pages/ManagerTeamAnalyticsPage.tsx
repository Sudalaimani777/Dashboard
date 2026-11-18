import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { PieChart, Plus } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { ManagerMonthlyBurnChart } from '../components/charts/ManagerMonthlyBurnChart';
import { ManagerCategoryPieChart } from '../components/charts/ManagerCategoryPieChart';
import { ManagerApprovalMeterCard } from '../components/manager/ManagerApprovalMeterCard';
import { ManagerSpendersVelocityCard } from '../components/manager/ManagerSpendersVelocityCard';
import { ManagerTeamAuditLedgerCard } from '../components/manager/ManagerTeamAuditLedgerCard';
import { formatINR } from '../utils/currency';
import {
  computeManagerApprovalHealth,
  computeManagerCategoryShares,
  computeManagerMonthlyBurnSeries,
  computeManagerSpendersAndProjectVelocity,
  computeManagerTeamOverview,
} from '../utils/managerAnalytics';

export const ManagerTeamAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { managerQueue, loadManagerQueue } = useTravel();

  useEffect(() => {
    if (managerQueue.length === 0) {
      loadManagerQueue();
    }
  }, [loadManagerQueue, managerQueue.length]);

  const overview = useMemo(() => computeManagerTeamOverview(managerQueue), [managerQueue]);
  const monthlyBurn = useMemo(() => computeManagerMonthlyBurnSeries(managerQueue), [managerQueue]);
  const categoryShares = useMemo(() => computeManagerCategoryShares(managerQueue), [managerQueue]);
  const approvalHealth = useMemo(() => computeManagerApprovalHealth(managerQueue), [managerQueue]);
  const velocity = useMemo(
    () => computeManagerSpendersAndProjectVelocity(managerQueue),
    [managerQueue]
  );

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      {/* Executive Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-warm/70 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-surface-subtle border border-border-warm text-primary shadow-2xs">
            <PieChart className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Team Travel Analytics
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Team expenditure velocity, category distribution, and approval queue performance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/travel/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          <Plus className="size-3.5" />
          New Request
        </button>
      </div>

      {/* Row 1: Executive Team KPI Strip */}
      <div className="bg-surface rounded-xl border border-border-warm p-4 sm:px-5 shadow-xs flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-border-warm">
          <div className="lg:pr-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              Team Cleared Spend
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-primary block mt-0.5">
              {formatINR(overview.teamTotalClearedSpend)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              Settled team reimbursement claims
            </span>
          </div>

          <div className="lg:px-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              In Approval Pipeline
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#7389FF] block mt-0.5">
              {formatINR(overview.teamPendingApprovals)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              Active authorizations &amp; submitted vouchers
            </span>
          </div>

          <div className="lg:px-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              Manager Review SLA
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-ink block mt-0.5">
              {overview.avgReviewDays !== null
                ? overview.avgReviewDays < 1
                  ? '< 1 day'
                  : `~${overview.avgReviewDays} days`
                : '—'}
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              {overview.avgReviewDays !== null ? 'Avg turnaround from staff submission' : 'No reviewed claims yet'}
            </span>
          </div>

          <div className="lg:pl-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              Active Travelers
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-800 block mt-0.5">
              {overview.activeSpendersCount}{' '}
              <span className="text-xs font-normal text-muted font-sans">Members</span>
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              Across {overview.totalTeamTrips} team journeys
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 50/50 Hero Visual Duo (Team Burn + Team Category Donut Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col justify-between">
          <ManagerMonthlyBurnChart data={monthlyBurn} />
        </div>
        <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col justify-between">
          <ManagerCategoryPieChart categories={categoryShares} />
        </div>
      </div>

      {/* Row 3: Balanced 50/50 Management Intelligence Duo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <ManagerApprovalMeterCard health={approvalHealth} />
        <ManagerSpendersVelocityCard velocity={velocity} />
      </div>

      {/* Row 4: Master Team Audit Ledger */}
      <ManagerTeamAuditLedgerCard requests={managerQueue} />
    </motion.div>
  );
};
