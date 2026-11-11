import React, { useEffect } from 'react';
import { useTravel } from '../hooks/useTravel';
import { DepartmentBudgetCard } from '../components/DepartmentBudgetCard';
import { formatINR } from '../utils/currency';

export const DepartmentBudgetsPage: React.FC = () => {
  const { budget, loadBudget } = useTravel();

  useEffect(() => {
    loadBudget('Engineering', 2026, 'Q4');
  }, [loadBudget]);

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#2B231D] tracking-tight">Department Budgets</h1>
        <p className="text-xs text-[#756F68]">
          Quarterly corporate travel expenditure allocations, utilized commitments, and headroom.
        </p>
      </div>

      <DepartmentBudgetCard budget={budget} />

      <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#E8DFD3] flex justify-between items-center bg-[#FAF8F5]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
            Quarterly Fiscal Breakdown
          </h3>
          <span className="text-xs font-mono text-[#A0988E]">Fiscal Year 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD3] text-[11px] uppercase font-semibold text-[#756F68] bg-[#FAF8F5]/50">
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Quarter</th>
                <th className="p-3.5">Total Allocation</th>
                <th className="p-3.5">Utilized Spend</th>
                <th className="p-3.5">Remaining Headroom</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#E8DFD3]">
              <tr>
                <td className="p-3.5 font-semibold text-[#2B231D]">Engineering</td>
                <td className="p-3.5 font-mono">Q4 2026</td>
                <td className="p-3.5 font-mono tabular-nums">{formatINR(budget?.totalAllocation || 3500000)}</td>
                <td className="p-3.5 font-mono tabular-nums">{formatINR(budget?.utilizedAmount || 0)}</td>
                <td className="p-3.5 font-mono tabular-nums text-[#2E7D32] font-bold">
                  {formatINR(budget?.availableHeadroom || 3500000)}
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]">
                    Healthy
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
