import React from 'react';
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
    <tr className="border-b border-[#E8DFD3] hover:bg-[#FAF8F5]/60 transition-colors">
      <td className="p-3.5">
        <div className="flex flex-col">
          <strong className="text-xs text-[#2B231D] font-semibold">{request.title}</strong>
          <span className="text-[10px] text-[#A0988E] font-mono">
            #{request.id.slice(0, 8)} • {request.projectCode}
          </span>
        </div>
      </td>

      {showRequester && (
        <td className="p-3.5 text-xs text-[#756F68]">
          <span className="font-semibold text-[#2B231D]">{request.requesterName}</span>
          <div className="text-[10px] text-[#A0988E]">{request.requesterEmail}</div>
        </td>
      )}

      <td className="p-3.5">
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF8F5] border border-[#E8DFD3] text-[#756F68]">
          {request.travelType === 'UPCOMING' ? 'Upcoming' : 'Reimbursement'}
        </span>
      </td>

      <td className="p-3.5 text-xs text-[#756F68]">
        {request.destination}
      </td>

      <td className="p-3.5 text-xs text-[#756F68] font-mono">
        {request.departureDate}
      </td>

      <td className="p-3.5 text-xs font-mono tabular-nums font-bold text-[#8A582B]">
        {formatINR(request.totalExpenses)}
      </td>

      <td className="p-3.5">
        <TravelStatusBadge status={request.status} />
      </td>

      <td className="p-3.5 text-right">
        <button
          type="button"
          onClick={() => onAction(request)}
          className="text-xs font-semibold text-[#8A582B] hover:text-[#754820] hover:underline cursor-pointer"
        >
          {actionLabel}
        </button>
      </td>
    </tr>
  );
};
