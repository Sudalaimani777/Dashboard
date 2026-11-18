import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { EmployeeMonthlyBurnChart } from '../components/charts/EmployeeMonthlyBurnChart';
import { EmployeeCategoryPieChart } from '../components/charts/EmployeeCategoryPieChart';
import { EmployeeReimbursementMeterCard } from '../components/employee/EmployeeReimbursementMeterCard';
import { EmployeeProjectVelocityCard } from '../components/employee/EmployeeProjectVelocityCard';
import { EmployeeSettlementLedgerCard } from '../components/employee/EmployeeSettlementLedgerCard';
import { formatINR } from '../utils/currency';
import {
  computeEmployeeCategoryShares,
  computeEmployeeMonthlyBurnSeries,
  computeEmployeeProjectAndRouteVelocity,
  computeEmployeeSpendOverview,
  computeEmployeeSettlementHealth,
} from '../utils/employeeAnalytics';

export const EmployeeSpendAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { requests, loadRequests } = useTravel();

  useEffect(() => {
    if (requests.length === 0) {
      loadRequests();
    }
  }, [loadRequests, requests.length]);

  const overview = useMemo(() => computeEmployeeSpendOverview(requests), [requests]);
  const monthlyBurn = useMemo(() => computeEmployeeMonthlyBurnSeries(requests), [requests]);
  const categoryShares = useMemo(() => computeEmployeeCategoryShares(requests), [requests]);
  const velocity = useMemo(() => computeEmployeeProjectAndRouteVelocity(requests), [requests]);
  const settlementHealth = useMemo(() => computeEmployeeSettlementHealth(requests), [requests]);

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
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              My Spend Analytics
            </h1>
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

      {/* Row 1: Executive KPI Strip */}
      <div className="bg-surface rounded-xl border border-border-warm p-4 sm:px-5 shadow-xs flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-border-warm">
          <div className="lg:pr-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              Total Cleared Spend
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-primary block mt-0.5">
              {formatINR(overview.totalClearedSpend)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              Settled & closed expense claims
            </span>
          </div>

          <div className="lg:px-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              Pending Commitments
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#533AFD] block mt-0.5">
              {formatINR(overview.pendingCommitments)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              In-flight & submitted approvals
            </span>
          </div>

          <div className="lg:px-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              Avg Cost / Trip
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-ink block mt-0.5">
              {formatINR(overview.avgSpendPerTrip)}
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              Across {overview.totalTrips} recorded journeys
            </span>
          </div>

          <div className="lg:pl-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
              Destinations Visited
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-800 block mt-0.5">
              {overview.uniqueDestinationsCount}{' '}
              <span className="text-xs font-normal text-muted font-sans">Cities</span>
            </span>
            <span className="text-[10px] text-muted block mt-0.5 font-mono">
              Active corporate journey routes
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Hero Visual 50/50 Duo (Burn Trend + Category Donut Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col justify-between">
          <EmployeeMonthlyBurnChart data={monthlyBurn} />
        </div>
        <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col justify-between">
          <EmployeeCategoryPieChart categories={categoryShares} />
        </div>
      </div>

      {/* Row 3: Balanced 50/50 Analytics Duo (Reimbursement Meter + Allocation Velocity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <EmployeeReimbursementMeterCard health={settlementHealth} />
        <EmployeeProjectVelocityCard velocity={velocity} />
      </div>

      {/* Row 4: Claims & Settlement Ledger */}
      <EmployeeSettlementLedgerCard requests={requests} />
    </motion.div>
  );
};
