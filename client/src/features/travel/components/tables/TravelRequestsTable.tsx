import React from 'react';
import { Inbox, ChevronRight } from 'lucide-react';
import type { TravelRequest } from '../../types/travel.types';
import { TravelTableRow } from './TravelTableRow';
import { TravelStatusBadge } from '../TravelStatusBadge';
import { RouteLabel } from '../shared/RouteLabel';
import { formatINR } from '../../utils/currency';

export interface TravelRequestsTableProps {
  title: string;
  requests: TravelRequest[];
  actionLabel?: string;
  onAction: (request: TravelRequest) => void;
  secondaryAction?: {
    label: string;
    onClick: (request: TravelRequest) => void;
  };
  showRequester?: boolean;
  showRemarksPreview?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  compactEmpty?: boolean;
  headerActions?: React.ReactNode;
}

export const TravelRequestsTable: React.FC<TravelRequestsTableProps> = ({
  title,
  requests,
  actionLabel = 'Inspect',
  onAction,
  secondaryAction,
  showRequester = false,
  showRemarksPreview = false,
  emptyMessage = 'No travel requests found in this view.',
  emptyDescription = 'Use Refresh to check for updates or adjust your active filters.',
  emptyAction,
  compactEmpty = false,
  headerActions,
}) => {
  return (
    <div className="bg-surface rounded-xl border border-border-warm overflow-hidden shadow-xs flex flex-col">
      <div className="p-4 border-b border-border-warm flex flex-wrap justify-between items-center gap-3 bg-surface-subtle">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border-warm text-muted">
            {requests.length}
          </span>
        </div>
        {headerActions && <div className="flex flex-wrap items-center gap-2">{headerActions}</div>}
      </div>

      {requests.length === 0 ? (
        <div className={`${compactEmpty ? 'py-8' : 'py-12'} px-4 flex flex-col items-center justify-center text-center`}>
          <div className="size-11 rounded-full bg-surface-subtle border border-border-warm flex items-center justify-center mb-2.5">
            <Inbox className="size-5 text-muted" />
          </div>
          <p className="text-sm font-medium text-ink">{emptyMessage}</p>
          <p className="text-xs text-muted mt-1 max-w-md">{emptyDescription}</p>
          {emptyAction && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{emptyAction}</div>}
        </div>
      ) : (
        <>
          {/* Mobile Card-Stack View (<md) */}
          <div className="md:hidden divide-y divide-border-warm">
            {requests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col gap-3 bg-surface hover:bg-surface-subtle/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-ink">{req.title}</span>
                    <span className="text-[10px] text-faint font-mono mt-0.5">
                      #{req.id.slice(0, 8)} • {req.projectCode}
                    </span>
                  </div>
                  <TravelStatusBadge status={req.status} size="sm" />
                </div>

                {showRequester && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span>
                      Requester: <strong className="text-ink font-medium">{req.requesterName}</strong>
                    </span>
                    {req.requesterRole === 'MANAGER' && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        Manager
                      </span>
                    )}
                    {req.requesterDepartment && (
                      <span className="text-[10px] text-faint">• {req.requesterDepartment}</span>
                    )}
                  </div>
                )}

                {showRemarksPreview && (req.adminRemarks || req.managerRemarks) && (
                  <p className="text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    Note: “{req.adminRemarks || req.managerRemarks}”
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-surface-subtle border border-border-warm/60">
                  <div>
                    <span className="text-[10px] text-muted block">Route</span>
                    <span className="font-medium text-ink truncate block">
                      <RouteLabel origin={req.origin} destination={req.destination} />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Dates</span>
                    <span className="font-mono text-ink text-[11px] block">{req.departureDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-muted block">Total Commitment</span>
                    <span className="text-sm font-mono font-bold tabular-nums text-primary">
                      {formatINR(req.totalExpenses)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {secondaryAction && (
                      <button
                        type="button"
                        onClick={() => secondaryAction.onClick(req)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-border-warm bg-surface-subtle text-xs font-semibold text-ink hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {secondaryAction.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onAction(req)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-primary hover:border-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {actionLabel}
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Tabular View (>=md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm text-[11px] uppercase font-semibold tracking-wider text-muted bg-surface-subtle/70">
                  <th className="p-3.5">Trip Title</th>
                  {showRequester && <th className="p-3.5">Requester</th>}
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Route / Destination</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {requests.map((req) => (
                  <TravelTableRow
                    key={req.id}
                    request={req}
                    actionLabel={actionLabel}
                    onAction={onAction}
                    secondaryAction={secondaryAction}
                    showRequester={showRequester}
                    showRemarksPreview={showRemarksPreview}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
