import React from 'react';
import { ChevronRight, ClipboardList, Clock, ShieldCheck } from 'lucide-react';
import type { TravelRequest } from '../../types/travel.types';
import { formatINR } from '../../utils/currency';
import type { ClassifiedManagerQueue, ManagerHistoryBucket } from '../../utils/managerQueue';

export const TeamPipelineSummaryCard: React.FC<{
  classified: ClassifiedManagerQueue;
  onNavigateTab: (tabId: string, bucket?: ManagerHistoryBucket) => void;
}> = ({ classified, onNavigateTab }) => {
  const awaitingAdmin = classified.teamHistoryAndTracking.filter(
    (r) => r.status === 'PENDING_ADMIN_APPROVAL'
  );
  const waitingEmployee = classified.teamHistoryAndTracking.filter(
    (r) =>
      r.status === 'REVISION_REQUESTED_BY_MANAGER' ||
      r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
  );
  const concluded = classified.teamHistoryAndTracking.filter((r) =>
    ['APPROVED', 'SETTLED', 'REJECTED', 'CANCELLED'].includes(r.status)
  );

  const rows: Array<{
    label: string;
    count: number;
    tab: string;
    bucket?: ManagerHistoryBucket;
  }> = [
    { label: 'Initial Audit Needed', count: classified.initialAudit.length, tab: 'present' },
    { label: 'Resubmissions & Directives', count: classified.revisions.length, tab: 'revisions' },
    { label: 'Awaiting Admin Clearance', count: awaitingAdmin.length, tab: 'past', bucket: 'AWAITING_ADMIN' },
    { label: 'Waiting on Employee', count: waitingEmployee.length, tab: 'past', bucket: 'WAITING_EMPLOYEE' },
    { label: 'Completed & Closed', count: concluded.length, tab: 'past', bucket: 'APPROVED_SETTLED' },
  ];

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" /> Team Pipeline Overview
        </h3>
        <span className="text-[11px] font-mono text-muted tabular-nums">
          {classified.teamQueue.length} total
        </span>
      </div>

      <div className="divide-y divide-border-warm/80">
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={() => onNavigateTab(row.tab, row.bucket)}
            className="w-full flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg text-xs hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span className="font-medium text-ink">{row.label}</span>
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-ink tabular-nums">
              {row.count}
              <ChevronRight className="size-3.5 text-muted" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const WaitingOnEmployeeCard: React.FC<{
  requests: TravelRequest[];
  onInspect: (req: TravelRequest) => void;
}> = ({ requests, onInspect }) => {
  const waiting = React.useMemo(
    () =>
      requests
        .filter(
          (r) =>
            r.status === 'REVISION_REQUESTED_BY_MANAGER' ||
            r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
        )
        .slice(0, 5),
    [requests]
  );

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <Clock className="size-4 text-primary" /> Waiting on Employee Edits
        </h3>
        <span className="text-[11px] font-mono text-muted tabular-nums">{waiting.length}</span>
      </div>

      {waiting.length === 0 ? (
        <p className="text-xs text-muted py-2">
          No open revision requests are waiting on direct reports.
        </p>
      ) : (
        <div className="divide-y divide-border-warm/80">
          {waiting.map((req) => (
            <button
              key={req.id}
              type="button"
              onClick={() => onInspect(req)}
              className="w-full text-left py-2.5 px-2 -mx-2 rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold text-ink block truncate">{req.title}</span>
                <span className="text-[11px] text-muted block truncate">
                  {req.requesterName || 'Employee'} • {req.destination}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-primary tabular-nums shrink-0">
                {formatINR(req.totalExpenses)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TeamDecisionBreakdownCard: React.FC<{
  requests: TravelRequest[];
}> = ({ requests }) => {
  const summary = React.useMemo(() => {
    const approved = requests.filter((r) => r.status === 'APPROVED' || r.status === 'SETTLED');
    const awaitingAdmin = requests.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL');
    const rejectedOrCancelled = requests.filter(
      (r) => r.status === 'REJECTED' || r.status === 'CANCELLED'
    );

    const clearedTotal = approved.reduce((s, r) => s + (Number(r.totalExpenses) || 0), 0);
    const awaitingTotal = awaitingAdmin.reduce((s, r) => s + (Number(r.totalExpenses) || 0), 0);
    const decidedCount = approved.length + rejectedOrCancelled.length;
    const approvalRate =
      decidedCount > 0 ? `${Math.round((approved.length / decidedCount) * 100)}%` : '—';

    return {
      approvedCount: approved.length,
      awaitingCount: awaitingAdmin.length,
      closedOtherCount: rejectedOrCancelled.length,
      clearedTotal,
      awaitingTotal,
      approvalRate,
    };
  }, [requests]);

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border-warm pb-2.5">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" /> Team Outcome Ledger
        </h3>
        <span className="text-[11px] font-mono font-bold text-ink tabular-nums">
          {summary.approvalRate} cleared
        </span>
      </div>

      <div className="divide-y divide-border-warm/80 text-xs">
        <div className="flex items-center justify-between py-2">
          <span className="text-muted">Approved &amp; Settled ({summary.approvedCount})</span>
          <span className="font-mono font-bold text-primary tabular-nums">
            {formatINR(summary.clearedTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-muted">Awaiting Admin ({summary.awaitingCount})</span>
          <span className="font-mono font-semibold text-ink tabular-nums">
            {formatINR(summary.awaitingTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-muted">Rejected &amp; Cancelled</span>
          <span className="font-mono font-semibold text-ink tabular-nums">
            {summary.closedOtherCount}
          </span>
        </div>
      </div>
    </div>
  );
};
