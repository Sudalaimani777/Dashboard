import React from 'react';
import type { TravelRequest } from '../../types/travel.types';
import { TravelTableRow } from './TravelTableRow';

export interface TravelRequestsTableProps {
  title: string;
  requests: TravelRequest[];
  actionLabel?: string;
  onAction: (request: TravelRequest) => void;
  showRequester?: boolean;
  emptyMessage?: string;
}

export const TravelRequestsTable: React.FC<TravelRequestsTableProps> = ({
  title,
  requests,
  actionLabel = 'Inspect',
  onAction,
  showRequester = false,
  emptyMessage = 'No travel requests found in this view.',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 border-b border-[#E8DFD3] flex justify-between items-center bg-[#FAF8F5]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
          {title}
        </h3>
        <span className="text-xs font-mono text-[#A0988E]">
          {requests.length} {requests.length === 1 ? 'Request' : 'Requests'}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#A0988E]">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD3] text-[11px] uppercase font-semibold text-[#756F68] bg-[#FAF8F5]/50">
                <th className="p-3.5">Trip Title</th>
                {showRequester && <th className="p-3.5">Requester</th>}
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Departure</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFD3]">
              {requests.map((req) => (
                <TravelTableRow
                  key={req.id}
                  request={req}
                  actionLabel={actionLabel}
                  onAction={onAction}
                  showRequester={showRequester}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
