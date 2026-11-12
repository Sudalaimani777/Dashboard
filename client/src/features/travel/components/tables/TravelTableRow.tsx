import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TravelStatusBadge } from '../TravelStatusBadge';
import { RouteLabel } from '../shared/RouteLabel';
import { formatINR } from '../../utils/currency';
import type { TravelRequest } from '../../types/travel.types';

export interface TravelTableRowProps {
  request: TravelRequest;
  actionLabel?: string;
  onAction: (request: TravelRequest) => void;
  secondaryAction?: {
    label: string;
    onClick: (request: TravelRequest) => void;
  };
  showRequester?: boolean;
  showRemarksPreview?: boolean;
}

export const TravelTableRow: React.FC<TravelTableRowProps> = ({
  request,
  actionLabel = 'Inspect',
  onAction,
  secondaryAction,
  showRequester = false,
  showRemarksPreview = false,
}) => {
  const latestRemark = request.adminRemarks || request.managerRemarks;

  return (
    <tr className="border-b border-border-warm hover:bg-surface-subtle/80 transition-colors">
      <td className="p-3.5">
        <div className="flex flex-col gap-0.5">
          <strong className="text-xs text-ink font-semibold">{request.title}</strong>
          <span className="text-[10px] text-faint font-mono">
            #{request.id.slice(0, 8)} • {request.projectCode}
          </span>
          {showRemarksPreview && latestRemark && (
            <span className="text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded-md px-2 py-0.5 mt-1 max-w-xs truncate">
              Note: “{latestRemark}”
            </span>
          )}
        </div>
      </td>

      {showRequester && (
        <td className="p-3.5 text-xs text-muted">
          <span className="font-semibold text-ink">{request.requesterName}</span>
          <div className="text-[10px] text-faint">{request.requesterEmail}</div>
        </td>
      )}

      <td className="p-3.5">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-subtle border border-border-warm text-muted">
          {request.travelType === 'UPCOMING' ? 'Upcoming' : 'Reimbursement'}
        </span>
      </td>

      <td className="p-3.5 text-xs text-muted">
        <RouteLabel origin={request.origin} destination={request.destination} />
      </td>

      <td className="p-3.5 text-xs text-muted font-mono whitespace-nowrap">
        {request.departureDate}
        {request.returnDate && request.returnDate !== request.departureDate ? (
          <span className="text-[10px] text-faint block">to {request.returnDate}</span>
        ) : null}
      </td>

      <td className="p-3.5 text-xs font-mono tabular-nums font-bold text-primary whitespace-nowrap">
        {formatINR(request.totalExpenses)}
      </td>

      <td className="p-3.5">
        <TravelStatusBadge status={request.status} />
      </td>

      <td className="p-3.5 text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          {secondaryAction && (
            <button
              type="button"
              onClick={() => secondaryAction.onClick(request)}
              className="inline-flex items-center px-2.5 py-1 rounded-lg border border-border-warm bg-surface-subtle text-[11px] font-semibold text-ink hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              {secondaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => onAction(request)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-primary hover:border-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            {actionLabel}
            <ChevronRight className="size-3 text-primary/70" />
          </button>
        </div>
      </td>
    </tr>
  );
};
