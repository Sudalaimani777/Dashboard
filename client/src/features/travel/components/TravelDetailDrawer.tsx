import React from 'react';
import { X, ExternalLink, Calendar, MapPin, Building, ShieldAlert, Clock } from 'lucide-react';
import { TravelStatusBadge } from './TravelStatusBadge';
import { formatINR } from '../utils/currency';
import type { TravelRequest } from '../types/travel.types';

export interface TravelDetailDrawerProps {
  request: TravelRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenResubmit?: (req: TravelRequest) => void;
}

export const TravelDetailDrawer: React.FC<TravelDetailDrawerProps> = ({
  request,
  isOpen,
  onClose,
  onOpenResubmit,
}) => {
  if (!isOpen || !request) return null;

  const isRevisionRequested =
    request.status === 'REVISION_REQUESTED_BY_MANAGER' ||
    request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' ||
    request.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2B231D]/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-xl h-full bg-white border-l border-[#E8DFD3] shadow-2xl flex flex-col justify-between overflow-y-auto text-left animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-6 border-b border-[#E8DFD3] bg-[#FAF8F5]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[#756F68]">
                  #{request.id.slice(0, 8)}
                </span>
                <span className="rounded-md border border-[#E8DFD3] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#8A582B]">
                  {request.travelType === 'UPCOMING' ? 'Case 2: Upcoming' : 'Case 1: Reimbursed'}
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-[#2B231D]">
                {request.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#756F68] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <TravelStatusBadge status={request.status} />
            <span className="text-xl font-bold font-mono tabular-nums text-[#2B231D]">
              {formatINR(request.totalExpenses)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Revision Banner if required */}
          {isRevisionRequested ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <ShieldAlert className="size-4" />
                <span>Revision Requested by Auditor</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                {request.adminRemarks || request.managerRemarks || 'Please review itemized receipts and resubmit for verification.'}
              </p>
              {onOpenResubmit ? (
                <button
                  type="button"
                  onClick={() => onOpenResubmit(request)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition-colors cursor-pointer"
                >
                  Edit & Resubmit Request
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Itinerary & Logistics */}
          <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
              Logistics & Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#2B231D]">
                <MapPin className="size-4 text-[#8A582B]" />
                <span>{request.origin} → {request.destination}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2B231D]">
                <Calendar className="size-4 text-[#8A582B]" />
                <span>{request.departureDate} to {request.returnDate}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2B231D]">
                <Building className="size-4 text-[#8A582B]" />
                <span>Project: {request.projectCode}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2B231D]">
                <ShieldAlert className="size-4 text-[#8A582B]" />
                <span>{request.emergencyContactName} ({request.emergencyContactPhone})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E8DFD3]">
              <p className="text-[11px] font-semibold text-[#756F68]">Purpose</p>
              <p className="text-xs text-[#2B231D] mt-0.5">{request.purpose}</p>
            </div>

            {request.supportingDocUrl ? (
              <div className="pt-2 border-t border-[#E8DFD3] flex items-center justify-between">
                <span className="text-xs font-medium text-[#756F68]">Attached Verification Proof</span>
                <a
                  href={request.supportingDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A582B] hover:underline"
                >
                  <span>View Document</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            ) : null}
          </div>

          {/* Itemized Expenses Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
              Itemized Expenses ({request.expenses?.length || 0})
            </h3>
            <div className="divide-y divide-[#E8DFD3] rounded-xl border border-[#E8DFD3] bg-white overflow-hidden text-xs">
              {request.expenses && request.expenses.length > 0 ? (
                request.expenses.map((exp, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors">
                    <div>
                      <span className="font-semibold text-[#2B231D]">{exp.merchant}</span>
                      <p className="text-[11px] text-[#756F68] capitalize">
                        {exp.category.toLowerCase().replace('_', ' ')} · {exp.expenseDate}
                      </p>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-[#2B231D]">
                      {formatINR(exp.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#756F68]">
                  No itemized expenses recorded.
                </div>
              )}
            </div>
          </div>

          {/* Timeline Audit History */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
              Timeline & Audit Ledger
            </h3>
            <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-4 space-y-3">
              {request.timeline && request.timeline.length > 0 ? (
                request.timeline.map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <Clock className="size-3.5 mt-0.5 text-[#8A582B] shrink-0" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#2B231D]">
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-[#A59B90]">
                          {new Date(evt.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#756F68]">
                        Actor: <span className="font-medium text-[#2B231D]">{evt.actorName || evt.actorRole}</span>
                        {evt.remarks ? ` — "${evt.remarks}"` : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#756F68]">Initial submission pending review.</p>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#E8DFD3] bg-[#FAF8F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E8DFD3] bg-white px-4 py-2 text-xs font-semibold text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
