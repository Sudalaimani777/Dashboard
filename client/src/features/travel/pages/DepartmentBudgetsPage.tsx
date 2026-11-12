import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, PencilLine, Check, X, Building2 } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { HeadroomRadialGauge } from '../components/charts/HeadroomRadialGauge';
import { CategorySpendDonut } from '../components/charts/CategorySpendDonut';
import { formatINR, formatINRCompact } from '../utils/currency';
import type { FiscalQuarter } from '../types/travel.types';

const QUARTERS: FiscalQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
const FISCAL_YEARS = [2025, 2026, 2027];

export const DepartmentBudgetsPage: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const {
    budget,
    budgetOverview,
    loadBudget,
    loadBudgetOverview,
    saveBudgetAllocation,
  } = useTravel();

  const [selectedDepartment, setSelectedDepartment] = useState('Engineering');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<FiscalQuarter>('Q4');

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
  }, [loadBudgetOverview]);

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
      className="max-w-7xl mx-auto flex flex-col gap-6"
    >
      {/* Header & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Department Budgets</h1>
          <p className="text-xs text-muted">
            Quarterly corporate travel expenditure allocations, utilized commitments, and headroom.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            {budget ? <PencilLine className="size-3.5" /> : <Plus className="size-3.5" />}
            {budget ? 'Edit Allocation' : 'Configure Allocation'}
          </button>
        </div>
      </div>

      {/* Period & Department Selector Bar */}
      <div className="bg-surface rounded-xl border border-border-warm p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="budget-dept-select" className="text-xs font-semibold text-muted">
              Department
            </label>
            <select
              id="budget-dept-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
            >
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="budget-year-select" className="text-xs font-semibold text-muted">
              Year
            </label>
            <select
              id="budget-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs font-mono font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 cursor-pointer"
            >
              {FISCAL_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

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
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer ${
                selectedQuarter === q ? 'bg-primary text-white shadow-2xs' : 'text-muted hover:text-ink'
              }`}
            >
              {q}
            </button>
          ))}
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
              className="text-muted hover:text-ink cursor-pointer"
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
              className="px-3 py-1.5 rounded-lg border border-border-warm text-xs font-semibold text-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Check className="size-3.5" />
              {isSaving ? 'Saving...' : 'Save Allocation'}
            </button>
          </div>
        </form>
      )}

      {/* Selected Quarter Visualization or Empty State */}
      {budget ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <HeadroomRadialGauge budget={budget} />
            <CategorySpendDonut budget={budget} />
          </div>
          {budget.utilizedAmount > 0 && Math.abs(budget.utilizedAmount - categoryDisbursedSum) > 1 && (
            <p className="text-[11px] text-muted px-1">
              Note: Committed pool ({formatINR(budget.utilizedAmount)}) includes prior/seeded commitments for{' '}
              {budget.department} {budget.fiscalQuarter} {budget.fiscalYear}, while the category breakdown reflects{' '}
              {formatINR(categoryDisbursedSum)} across itemized approved/settled vouchers in this period.
            </p>
          )}
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
              Set a quarterly pool to enforce headroom checks and track travel commitments for this department.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openEditor(selectedDepartment, selectedYear, selectedQuarter, 1500000)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
          >
            <Plus className="size-3.5" />
            Set {selectedQuarter} {selectedYear} Budget
          </button>
        </div>
      )}

      {/* Multi-Department Overview Table */}
      <div className="bg-surface rounded-xl border border-border-warm overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border-warm bg-surface-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">All Configured Department Pools</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border-warm text-muted">
              {budgetOverview?.budgets?.length || 0}
            </span>
          </div>
        </div>

        {!budgetOverview || budgetOverview.budgets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">
            No quarterly allocations configured yet.
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
                {budgetOverview.budgets.map((row) => {
                  const isSelected =
                    row.department.toLowerCase() === selectedDepartment.toLowerCase() &&
                    row.fiscalYear === selectedYear &&
                    row.fiscalQuarter === selectedQuarter;
                  const isLow = row.utilizationPercentage > 85;
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-surface-subtle/70 transition-colors ${
                        isSelected ? 'bg-surface-subtle/80' : ''
                      }`}
                    >
                      <td className="p-3.5 font-semibold text-ink">{row.department}</td>
                      <td className="p-3.5 font-mono text-muted">
                        {row.fiscalQuarter} {row.fiscalYear}
                      </td>
                      <td className="p-3.5 font-mono tabular-nums font-semibold text-ink">
                        {formatINR(row.totalAllocation)}{' '}
                        <span className="text-[10px] text-faint">({formatINRCompact(row.totalAllocation)})</span>
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
    </motion.div>
  );
};
