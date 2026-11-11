import React, { useState } from 'react';
import { X, ExternalLink, Calendar, MapPin, Building, ShieldCheck, AlertCircle, Loader2, CheckCircle2, RotateCcw, AlertTriangle, FileText } from 'lucide-react';
import { TravelStatusBadge } from './TravelStatusBadge';
import { formatINR } from '../utils/currency';
import type { TravelRequest, DepartmentBudget } from '../types/travel.types';

export interface AdminGovernanceDrawerProps {
  request: TravelRequest | null;
  budget: DepartmentBudget | null;
  isOpen: boolean;
  onClose: () => void;
  onSettle: (id: string, remarks?: string) => Promise<void>;
  onApprove: (id: string, remarks?: string) => Promise<void>;
  onOpenRevisionModal: (req: TravelRequest) => void;
}

export const AdminGovernanceDrawer: React.FC<AdminGovernanceDrawerProps> = ({
  request,
  budget,
  isOpen,
  onClose,
  onSettle,
  onApprove,
  onOpenRevisionModal,
}) => {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const availableHeadroom = budget?.availableHeadroom ?? 3500000;
  const exceedsHeadroom = request.totalExpenses > availableHeadroom;

  const handleClearance = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (request.travelType === 'ALREADY_TRAVELLED') {
        await onSettle(request.id, remarks || 'Executive financial disbursement clearance granted. Expense reimbursement settled.');
      } else {
        await onApprove(request.id, remarks || 'Executive travel clearance granted. Corporate budget authorized.');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Executive clearance failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2B231D]/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-2xl h-full bg-white border-l border-[#E8DFD3] shadow-2xl flex flex-col justify-between overflow-y-auto text-left animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E8DFD3] bg-[#FAF8F5]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[#756F68]">
                  #{request.id.slice(0, 8)}
                </span>
                <span className="rounded-md border border-[#5C241C]/30 bg-[#5C241C]/10 px-2 py-0.5 text-[10px] font-bold text-[#5C241C]">
                  Tier 2 Executive Clearance
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-[#2B231D]">
                {request.title}
              </h2>
              <p className="text-xs text-[#756F68]">
                Requester: <span className="font-semibold text-[#2B231D]">{request.requesterName || 'Employee'}</span> ({request.requesterDepartment || 'Engineering'})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-1.5 text-[#756F68] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <TravelStatusBadge status={request.status} />
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-[#756F68] block">Disbursement Value</span>
              <span className="text-xl font-bold font-mono tabular-nums text-[#2B231D]">
                {formatINR(request.totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Budget Headroom Analysis Card */}
          <div className="rounded-2xl border border-[#E8DFD3] bg-[#FAF8F5] p-4 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
                Budget Headroom Impact
              </span>
              <span className="font-mono text-xs font-semibold text-[#2B231D]">
                Department Pool: {formatINR(budget?.totalAllocation ?? 3500000)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8DFD3] text-xs">
              <div>
                <span className="text-[11px] text-[#756F68] block">Current Available Headroom</span>
                <span className="font-mono font-bold text-emerald-700 tabular-nums">
                  {formatINR(availableHeadroom)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#756F68] block">Post-Approval Headroom</span>
                <span className={`font-mono font-bold tabular-nums ${exceedsHeadroom ? 'text-red-700' : 'text-[#2B231D]'}`}>
                  {formatINR(Math.max(0, availableHeadroom - request.totalExpenses))}
                </span>
              </div>
            </div>

            {exceedsHeadroom ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <AlertTriangle className="size-4 shrink-0 text-red-600" />
                <span>⚠️ Warning: This request exceeds the remaining department allocation.</span>
              </div>
            ) : null}
          </div>

          {/* Line Manager Endorsement */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="size-4 text-emerald-700" />
              <span>Tier 1 Line Manager Audit Endorsement</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              "{request.managerRemarks || 'Audited and verified. Expenses and proof match travel requirements.'}"
            </p>
            <p className="text-[10px] text-emerald-700">
              Manager: {request.managerName || 'Direct Manager'}
            </p>
          </div>

          {/* Verification Proof Link */}
          {request.supportingDocUrl ? (
            <div className="rounded-xl border border-[#E8DFD3] bg-white p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-[#8A582B]" />
                <div>
                  <span className="font-semibold text-[#2B231D] block">Attached Audit Proof Document</span>
                  <span className="font-mono text-[10px] text-[#756F68] block truncate max-w-xs">
                    {request.supportingDocUrl}
                  </span>
                </div>
              </div>
              <a
                href={request.supportingDocUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-[#E8DFD3] bg-[#F7F4EE] px-3 py-1.5 text-xs font-semibold text-[#8A582B] hover:border-[#8A582B] transition-colors"
              >
                <span>Inspect Proof</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          ) : null}

          {/* Logistics & Expenses */}
          <div className="rounded-xl border border-[#E8DFD3] bg-white p-4 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
              Itinerary Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
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
                <ShieldCheck className="size-4 text-[#8A582B]" />
                <span>Contact: {request.emergencyContactName}</span>
              </div>
            </div>
          </div>

          {/* Itemized Expenses Breakdown */}
          <div className="space-y-2 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
              Itemized Expenses Breakdown ({request.expenses?.length || 0})
            </h3>
            <div className="divide-y divide-[#E8DFD3] rounded-xl border border-[#E8DFD3] bg-white overflow-hidden">
              {request.expenses && request.expenses.length > 0 ? (
                request.expenses.map((exp, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-[#FAF8F5]">
                    <div>
                      <span className="font-semibold text-[#2B231D]">{exp.merchant}</span>
                      <p className="text-[11px] text-[#756F68]">{exp.category} · {exp.expenseDate}</p>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-[#2B231D]">
                      {formatINR(exp.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-[#756F68]">No expenses recorded</div>
              )}
            </div>
          </div>

          {/* Executive Remarks Input */}
          <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-4 space-y-1.5 text-xs">
            <label className="font-bold text-[#2B231D] block">Executive Clearance Notes (Optional)</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add final executive notes or ledger transaction memo..."
              className="w-full p-2.5 rounded-xl border border-[#E8DFD3] bg-white text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
            />
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="p-4 border-t border-[#E8DFD3] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[#E8DFD3] bg-white px-4 py-2 text-xs font-semibold text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenRevisionModal(request)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Request Alterations</span>
            </button>

            <button
              type="button"
              onClick={handleClearance}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              <span>
                {request.travelType === 'ALREADY_TRAVELLED'
                  ? 'Settle Reimbursement Payout'
                  : 'Grant Travel Clearance'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
