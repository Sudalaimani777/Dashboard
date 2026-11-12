import React, { useEffect } from 'react';
import { useTravel } from '../hooks/useTravel';
import { HeadroomRadialGauge } from '../components/charts/HeadroomRadialGauge';
import { CategorySpendDonut } from '../components/charts/CategorySpendDonut';
import { RefreshButton } from '../components/shared/RefreshButton';

export const DepartmentBudgetsPage: React.FC = () => {
  const { budget, loadBudget, isRefreshing, lastSyncedAt } = useTravel();

  const handleRefresh = async () => {
    await loadBudget('Engineering', 2026, 'Q4');
  };

  useEffect(() => {
    loadBudget('Engineering', 2026, 'Q4');
  }, [loadBudget]);

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Department Budgets</h1>
          <p className="text-xs text-muted">
            Quarterly corporate travel expenditure allocations, utilized commitments, and headroom.
          </p>
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastSyncedAt={lastSyncedAt}
        />
      </div>

      {/* Executive Visual Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <HeadroomRadialGauge budget={budget} />
        <CategorySpendDonut budget={budget} />
      </div>
    </div>
  );
};
