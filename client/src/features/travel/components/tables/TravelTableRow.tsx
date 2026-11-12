import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TravelStatusBadge } from '../TravelStatusBadge';
import { formatINR } from '../../utils/currency';
import type { TravelRequest } from '../../types/travel.types';

export interface TravelTableRowProps {
  request: TravelRequest;
  actionLabel?: string;
  onAction: (request: TravelRequest) => void;
  showRequester?: boolean;
}

export const TravelTableRow: React.FC<TravelTableRowProps> = ({
  request,
  actionLabel = 'Inspect',
  onAction,
  showRequester = false,
}) => {
  return (
    <tr className="border-b border-border-warm hover:bg-surface-subtle/80 transition-colors">
      <td className="p-3.5">
        <div className="flex flex-col">
          <strong className="text-xs text-ink font-semibold">{request.title}</strong>
          <span className="text-[10px] text-faint font-mono">
            #{request.id.slice(0, 8)} • {request.projectCode}
          </span>
        </div>
      </td>

      {showRequester && (
        <td className="p-3.5 text-xs text-muted">
          <span className="font-semibold text-ink">{request.requesterName}</span>
          <div className="text-[10px] text-faint">{request.requesterEmail}</div>
        </td>
      )}

      <td className="p-3.5">
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-subtle border border-border-warm text-muted">
          {request.travelType === 'UPCOMING' ? 'Upcoming' : 'Reimbursement'}
        </span>
      </td>

      <td className="p-3.5 text-xs text-muted">
        {request.destination}
      </td>

      <td className="p-3.5 text-xs text-muted font-mono">
        {request.departureDate}
      </td>

      <td className="p-3.5 text-xs font-mono tabular-nums font-bold text-primary">
        {formatINR(request.totalExpenses)}
      </td>

      <td className="p-3.5">
        <TravelStatusBadge status={request.status} />
      </td>

      <td className="p-3.5 text-right">
        <button
          type="button"
          onClick={() => onAction(request)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border-warm bg-surface text-xs font-semibold text-primary hover:border-primary/50 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
        >
          {actionLabel}
          <ChevronRight className="size-3 text-primary/70" />
        </button>
      </td>
    </tr>
  );
};
