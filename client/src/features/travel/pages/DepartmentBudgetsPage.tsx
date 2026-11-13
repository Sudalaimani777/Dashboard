import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, PencilLine, Check, X, Building2, Search } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { HeadroomRadialGauge } from '../components/charts/HeadroomRadialGauge';
import { CategorySpendDonut } from '../components/charts/CategorySpendDonut';
import { MonthlyBurnChart } from '../components/charts/MonthlyBurnChart';
import { DepartmentComparisonChart } from '../components/charts/DepartmentComparisonChart';
import { DepartmentBudgetRail } from '../components/DepartmentBudgetRail';
import { formatINR, formatINRCompact } from '../utils/currency';
import {
  computeCorporateLedgerStats,
  computeDepartmentDrilldown,
  computeMonthlyBurnSeries,
  filterBudgetsForPeriod,
} from '../utils/budgetAnalytics';
import type { FiscalQuarter } from '../types/travel.types';

const QUARTERS: FiscalQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
const FISCAL_YEARS = [2025, 2026, 2027];

export const DepartmentBudgetsPage: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const {
    budget,
    budgetOverview,
    adminQueue,
    loadBudget,
    loadBudgetOverview,
    loadAdminQueue,
    saveBudgetAllocation,
  } = useTravel();

  const [selectedDepartment, setSelectedDepartment] = useState('Engineering');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<FiscalQuarter>('Q4');
  const [poolSearch, setPoolSearch] = useState('');

  // Allocation Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [formDepartment, setFormDepartment] = useState('Engineering');
  const [formYear, setFormYear] = useState(2026);
  const [formQuarter, setFormQuarter] = useState<FiscalQuarter>('Q4');
  const [formAmount, setFormAmount] = useState('3500000');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBudgetOverview();
    if (adminQueue.length === 0) {
      loadAdminQueue();
    }
  }, [loadBudgetOverview, loadAdminQueue, adminQueue.length]);

  useEffect(() => {
    loadBudget(selectedDepartment, selectedYear, selectedQuarter);
  }, [selectedDepartment, selectedYear, selectedQuarter, loadBudget]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>(['Engineering']);
    if (budgetOverview?.departments) {
      for (const d of budgetOverview.departments) set.add(d);
    }
    if (selectedDepartment) set.add(selectedDepartment);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [budgetOverview, selectedDepartment]);

  const allBudgets = useMemo(() => budgetOverview?.budgets ?? [], [budgetOverview?.budgets]);

  const periodBudgets = useMemo(
    () => filterBudgetsForPeriod(allBudgets, selectedYear, selectedQuarter),
    [allBudgets, selectedYear, selectedQuarter]
  );

  const ledgerStats = useMemo(
    () => computeCorporateLedgerStats(allBudgets, adminQueue, selectedYear, selectedQuarter),
    [allBudgets, adminQueue, selectedYear, selectedQuarter]
  );

  const monthlyBurn = useMemo(
    () => computeMonthlyBurnSeries(adminQueue, selectedDepartment),
    [adminQueue, selectedDepartment]
  );

  const drilldown = useMemo(
    () => computeDepartmentDrilldown(adminQueue, selectedDepartment),
    [adminQueue, selectedDepartment]
  );

  const filteredPoolRows = useMemo(() => {
    const q = poolSearch.trim().toLowerCase();
    if (!q) return allBudgets;
    return allBudgets.filter(
      (b) =>
        b.department.toLowerCase().includes(q) ||
        `${b.fiscalQuarter} ${b.fiscalYear}`.toLowerCase().includes(q)
    );
  }, [allBudgets, poolSearch]);

  const openEditor = (
    dept = selectedDepartment,
    year = selectedYear,
    quarter: FiscalQuarter = selectedQuarter,
    currentAmount?: number
  ) => {
    setFormDepartment(dept);
    setFormYear(year);
    setFormQuarter(quarter);
    setFormAmount(String(currentAmount ?? budget?.totalAllocation ?? 3500000));
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditorOpen(true);
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const dept = formDepartment.trim();
    const amount = Number(formAmount);
    if (dept.length < 2) {
      setSaveError('Department name must be at least 2 characters.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setSaveError('Allocation must be a valid non-negative INR amount.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await saveBudgetAllocation({
        department: dept,
        fiscalYear: formYear,
        fiscalQuarter: formQuarter,
        totalAllocation: amount,
      });
      setSelectedDepartment(dept);
      setSelectedYear(formYear);
      setSelectedQuarter(formQuarter);
      setSaveSuccess(`Saved ${dept} ${formQuarter} ${formYear} allocation (${formatINR(amount)}).`);
      setIsEditorOpen(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save allocation.');
    } finally {
      setIsSaving(false);
    }
  };

  const categoryDisbursedSum = useMemo(
    () => (budget?.categoryBreakdown || []).reduce((sum, item) => sum + Number(item.total || 0), 0),
    [budget?.categoryBreakdown]
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-7xl mx-auto flex flex-col gap-5 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Department Budgets</h1>
        <p className="text-xs text-muted">
          Corporate travel allocations, monthly burn velocity, category mix, and member spend.
        </p>
      </div>

      {/* Period, Department & Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
          >
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by fiscal year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-border-warm bg-surface text-xs font-mono font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
          >
            {FISCAL_YEARS.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Filter by fiscal quarter"
            className="inline-flex rounded-lg border border-border-warm bg-surface p-0.5"
          >
            {QUARTERS.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={selectedQuarter === q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
                  selectedQuarter === q ? 'bg-primary text-white shadow-2xs' : 'text-muted hover:text-ink'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer shadow-xs shrink-0"
          >
            {budget ? <PencilLine className="size-3.5" /> : <Plus className="size-3.5" />}
            {budget ? 'Edit Allocation' : 'Configure Pool'}
          </button>
        </div>
      </div>

      {/* Unified Corporate Quarter Ledger Strip */}
      <div className="bg-surface rounded-xl border border-border-warm p-4 sm:px-5 shadow-xs flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-border-warm">
          <div className="lg:pr-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block">
              Corporate {selectedQuarter} Pool
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-primary block mt-0.5">
              {formatINR(ledgerStats.totalPool)}
            </span>
            <span className="text-[11px] text-muted">
              Across {ledgerStats.configuredCount} configured pool(s)
            </span>
          </div>

          <div className="lg:px-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block">
              Committed Spend
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-ink block mt-0.5">
              {formatINR(ledgerStats.totalCommitted)}
            </span>
            <span className="text-[11px] text-muted">
              Approved {formatINRCompact(ledgerStats.approvedSpend)} • Pending{' '}
              {formatINRCompact(ledgerStats.pendingCommitments)}
            </span>
          </div>

          <div className="lg:px-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block">
              Available Headroom
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#3F624D] block mt-0.5">
              {formatINR(ledgerStats.totalHeadroom)}
            </span>
            <span className="text-[11px] text-muted">
              {Math.max(0, 100 - ledgerStats.utilizationPct).toFixed(1)}% corporate buffer left
            </span>
          </div>

          <div className="lg:pl-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block">
              Pools Above 85%
            </span>
            <span
              className={`text-xl font-bold font-mono tabular-nums block mt-0.5 ${
                ledgerStats.atRiskCount > 0 ? 'text-amber-700' : 'text-[#3F624D]'
              }`}
            >
              {ledgerStats.atRiskCount} {ledgerStats.atRiskCount === 1 ? 'Pool' : 'Pools'}
            </span>
            <span className="text-[11px] text-muted">
              {ledgerStats.topAtRiskPool
                ? `${ledgerStats.topAtRiskPool.department} at ${ledgerStats.topAtRiskPool.utilizationPercentage.toFixed(1)}%`
                : 'All configured pools healthy'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
          <span className="font-mono font-bold text-ink shrink-0 tabular-nums">
            {ledgerStats.utilizationPct.toFixed(1)}% Utilized
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#EFE7D8] overflow-hidden flex">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, ledgerStats.approvedPct)}%` }}
              title="Approved Spend"
            />
            <div
              className="h-full bg-tertiary transition-all duration-300"
              style={{ width: `${Math.min(100, ledgerStats.pendingPct)}%` }}
              title="Pending Commitments"
            />
          </div>
          <span className="hidden sm:inline shrink-0">Approved vs. Pending against pool</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-[#3F624D]/30 bg-[#F0F7F2] px-4 py-2.5 text-xs text-[#2E4B3A] font-medium flex items-center justify-between">
          <span>{saveSuccess}</span>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            className="text-[#3F624D] hover:text-[#2E4B3A] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Allocation Upsert Drawer / Card */}
      {isEditorOpen && (
        <form
          onSubmit={handleSaveAllocation}
          className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b border-border-warm pb-3">
            <h2 className="text-sm font-semibold text-ink">
              Create or Update Quarterly Department Allocation
            </h2>
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              aria-label="Close allocation editor"
              className="text-muted hover:text-ink rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {saveError && (
            <div className="rounded-lg border border-destructive/30 bg-[#FFF0E8] px-3 py-2 text-xs text-destructive font-medium">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-dept" className="text-xs font-semibold text-ink">
                Department Name
              </label>
              <input
                id="alloc-dept"
                type="text"
                list="known-departments-list"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                placeholder="e.g. Engineering, Product, Sales"
                className="px-3 py-2 rounded-lg border border-border-warm bg-surface-subtle text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              />
              <datalist id="known-departments-list">
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-year" className="text-xs font-semibold text-ink">
                Fiscal Year
              </label>
              <select
                id="alloc-year"
                value={formYear}
                onChange={(e) => setFormYear(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-border-warm bg-surface-subtle text-xs font-mono text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                {FISCAL_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-quarter" className="text-xs font-semibold text-ink">
                Fiscal Quarter
              </label>
              <select
                id="alloc-quarter"
                value={formQuarter}
                onChange={(e) => setFormQuarter(e.target.value as FiscalQuarter)}
                className="px-3 py-2 rounded-lg border border-border-warm bg-surface-subtle text-xs font-mono text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="alloc-amount" className="text-xs font-semibold text-ink">
                Total Allocation (INR)
              </label>
              <input
                id="alloc-amount"
                type="number"
                min={0}
                step="1000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border-warm bg-surface-subtle text-xs font-mono text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-warm/60">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-border-warm text-xs font-semibold text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 cursor-pointer"
            >
              <Check className="size-3.5" />
              {isSaving ? 'Saving...' : 'Save Allocation'}
            </button>
          </div>
        </form>
      )}

      {/* Asymmetric 2-Column Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.75fr)_340px] gap-5 items-start">
        {/* LEFT MAIN COLUMN */}
        <div className="flex flex-col gap-5 min-w-0">
          {budget ? (
            <>
              {/* Cohesive Hero Card: Headroom Gauge + 6-Month Burn Velocity */}
              <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5 items-center">
                  <HeadroomRadialGauge budget={budget} embedded />
                  <div className="md:border-l md:border-border-warm md:pl-5">
                    <MonthlyBurnChart data={monthlyBurn} department={selectedDepartment} />
                  </div>
                </div>
                {budget.utilizedAmount > 0 && Math.abs(budget.utilizedAmount - categoryDisbursedSum) > 1 && (
                  <p className="text-[11px] text-muted border-t border-border-warm/60 pt-2.5">
                    Note: Committed pool ({formatINR(budget.utilizedAmount)}) includes prior/seeded
                    commitments for {budget.department} {budget.fiscalQuarter} {budget.fiscalYear},
                    while itemized approved/settled vouchers total {formatINR(categoryDisbursedSum)}.
                  </p>
                )}
              </div>

              {/* 2-Column Analytics Row: Category Spend Mix + Cross-Department Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                <CategorySpendDonut budget={budget} />
                <DepartmentComparisonChart
                  budgets={periodBudgets}
                  selectedDepartment={selectedDepartment}
                  selectedYear={selectedYear}
                  selectedQuarter={selectedQuarter}
                  onSelectDepartment={(dept, yr, q) => {
                    setSelectedDepartment(dept);
                    setSelectedYear(yr);
                    setSelectedQuarter(q);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="bg-surface rounded-xl border border-border-warm p-10 text-center flex flex-col items-center gap-3 shadow-xs">
              <div className="size-11 rounded-full bg-surface-subtle border border-border-warm flex items-center justify-center">
                <Building2 className="size-5 text-muted" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-ink">
                  No budget configured for {selectedDepartment} • {selectedQuarter} {selectedYear}
                </h3>
                <p className="text-xs text-muted max-w-md">
                  Set a quarterly pool to enforce headroom checks and track travel commitments for
                  this department.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEditor(selectedDepartment, selectedYear, selectedQuarter, 1500000)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
              >
                <Plus className="size-3.5" />
                Set {selectedQuarter} {selectedYear} Budget
              </button>
            </div>
          )}

          {/* Configured Department Pools Table */}
          <div className="bg-surface rounded-xl border border-border-warm overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border-warm bg-surface-subtle flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">All Configured Department Pools</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border-warm text-muted">
                  {filteredPoolRows.length}
                </span>
              </div>

              <div className="relative">
                <Search className="size-3.5 text-faint absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                  placeholder="Filter pools..."
                  aria-label="Filter configured department pools"
                  className="h-8 pl-8 pr-3 rounded-lg border border-border-warm bg-surface text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                />
              </div>
            </div>

            {filteredPoolRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No matching quarterly allocations found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-warm text-[11px] font-semibold uppercase tracking-wider text-muted bg-surface-subtle/60">
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Period</th>
                      <th className="p-3.5">Total Pool</th>
                      <th className="p-3.5">Committed</th>
                      <th className="p-3.5">Headroom</th>
                      <th className="p-3.5">Utilization</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-warm text-xs">
                    {filteredPoolRows.map((row) => {
                      const isSelected =
                        row.department.toLowerCase() === selectedDepartment.toLowerCase() &&
                        row.fiscalYear === selectedYear &&
                        row.fiscalQuarter === selectedQuarter;
                      const isLow = row.utilizationPercentage > 85;
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-surface-subtle/70 transition-colors ${
                            isSelected ? 'bg-[#FAF5EC]' : ''
                          }`}
                        >
                          <td className="p-3.5 font-semibold text-ink">{row.department}</td>
                          <td className="p-3.5 font-mono text-muted">
                            {row.fiscalQuarter} {row.fiscalYear}
                          </td>
                          <td className="p-3.5 font-mono tabular-nums font-semibold text-ink">
                            {formatINR(row.totalAllocation)}{' '}
                            <span className="text-[10px] text-faint">
                              ({formatINRCompact(row.totalAllocation)})
                            </span>
                          </td>
                          <td className="p-3.5 font-mono tabular-nums text-muted">
                            {formatINR(row.utilizedAmount)}
                          </td>
                          <td
                            className={`p-3.5 font-mono tabular-nums font-semibold ${
                              row.availableHeadroom < 0
                                ? 'text-destructive'
                                : isLow
                                ? 'text-amber-700'
                                : 'text-[#3F624D]'
                            }`}
                          >
                            {formatINR(row.availableHeadroom)}
                          </td>
                          <td className="p-3.5 font-mono tabular-nums text-ink">
                            {row.utilizationPercentage.toFixed(1)}%
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDepartment(row.department);
                                  setSelectedYear(row.fiscalYear);
                                  setSelectedQuarter(row.fiscalQuarter as FiscalQuarter);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-border-warm bg-surface text-[11px] font-semibold text-ink hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openEditor(
                                    row.department,
                                    row.fiscalYear,
                                    row.fiscalQuarter as FiscalQuarter,
                                    row.totalAllocation
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg border border-border-warm bg-surface text-[11px] font-semibold text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT INSIGHTS RAIL */}
        <DepartmentBudgetRail
          selectedDepartment={selectedDepartment}
          selectedYear={selectedYear}
          selectedQuarter={selectedQuarter}
          topAtRiskPool={ledgerStats.topAtRiskPool}
          drilldown={drilldown}
          onAdjustPool={(dept, yr, q, amt) => openEditor(dept, yr, q, amt)}
        />
      </div>
    </motion.div>
  );
};
