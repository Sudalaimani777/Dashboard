import React, { useState } from 'react';
import { X, ExternalLink, Calendar, MapPin, Building, ShieldCheck, AlertCircle, Loader2, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { TravelStatusBadge } from './TravelStatusBadge';
import { formatINR } from '../utils/currency';
import type { TravelRequest } from '../types/travel.types';

export interface ManagerAuditDrawerProps {
  request: TravelRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, remarks?: string) => Promise<void>;
  onRequestRevision: (id: string, remarks: string) => Promise<void>;
}

export const ManagerAuditDrawer: React.FC<ManagerAuditDrawerProps> = ({
  request,
  isOpen,
  onClose,
  onApprove,
  onRequestRevision,
}) => {
  const [remarks, setRemarks] = useState('');
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onApprove(request.id, remarks || 'Verified itinerary, expenses, and supporting invoice/quote proof. Forwarding for Tier 2 executive clearance.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!remarks.trim() || remarks.trim().length < 5) {
      setError('Please provide specific revision instructions (at least 5 characters).');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onRequestRevision(request.id, remarks.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to request revision');
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
                <span className="rounded-md border border-[#8A582B]/30 bg-[#8A582B]/10 px-2 py-0.5 text-[10px] font-bold text-[#8A582B]">
                  Tier 1 Manager Audit
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-[#2B231D]">
                {request.title}
              </h2>
              <p className="text-xs text-[#756F68]">
                Submitted by <span className="font-semibold text-[#2B231D]">{request.requesterName || 'Employee'}</span> ({request.requesterDepartment || 'Engineering'})
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
              <span className="text-[10px] uppercase font-mono text-[#756F68] block">Total Claimed</span>
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

          {/* Proof Inspector Section */}
          <div className="rounded-2xl border border-[#8A582B]/20 bg-[#FAF8F5] p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#8A582B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B231D]">
                  Proof Inspector & Verification Attachment
                </h3>
              </div>
              {request.supportingDocUrl ? (
                <a
                  href={request.supportingDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[#E8DFD3] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#8A582B] hover:border-[#8A582B] transition-colors"
                >
                  <span>Open Full Document</span>
                  <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>

            <p className="text-[11px] text-[#756F68]">
              {request.travelType === 'ALREADY_TRAVELLED'
                ? 'Verify vendor tax invoice, GST compliance, and actual date of incurring.'
                : 'Verify flight/hotel quotation estimates against department policy before clearance.'}
            </p>

            {request.supportingDocUrl ? (
              <div className="rounded-xl border border-[#E8DFD3] bg-white p-3 flex items-center justify-between text-xs">
                <div className="truncate max-w-sm">
                  <span className="font-semibold text-[#2B231D] block">Attached Proof URL:</span>
                  <span className="font-mono text-[11px] text-[#756F68] truncate block">
                    {request.supportingDocUrl}
                  </span>
                </div>
                <a
                  href={request.supportingDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-[#F7F4EE] px-3 py-1 text-xs font-semibold text-[#8A582B] hover:bg-[#8A582B]/10 transition-colors shrink-0"
                >
                  Inspect
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-3 text-xs text-amber-800">
                ⚠️ No verification attachment URL was provided. Request changes before approving.
              </div>
            )}
          </div>

          {/* Logistics & Purpose */}
          <div className="rounded-xl border border-[#E8DFD3] bg-white p-4 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
              Trip Itinerary & Governance Data
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
                <span>Project Code: {request.projectCode}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2B231D]">
                <ShieldCheck className="size-4 text-[#8A582B]" />
                <span>Emergency: {request.emergencyContactName} ({request.emergencyContactPhone})</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E8DFD3]">
              <span className="font-semibold text-[#756F68]">Business Purpose:</span>
              <p className="mt-1 text-xs text-[#2B231D] leading-relaxed">{request.purpose}</p>
            </div>
          </div>

          {/* Itemized Expenses Table */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
                Itemized Expenses Audit ({request.expenses?.length || 0})
              </h3>
              <span className="text-[11px] font-mono text-[#756F68]">
                Currency: Indian Rupees (INR)
              </span>
            </div>

            <div className="divide-y divide-[#E8DFD3] rounded-xl border border-[#E8DFD3] bg-white overflow-hidden">
              {request.expenses && request.expenses.length > 0 ? (
                request.expenses.map((exp, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between hover:bg-[#FAF8F5]">
                    <div>
                      <span className="font-semibold text-[#2B231D]">{exp.merchant}</span>
                      <p className="text-[11px] text-[#756F68]">
                        {exp.category} · {exp.expenseDate}
                      </p>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-[#2B231D]">
                      {formatINR(exp.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#756F68]">
                  No itemized lines recorded.
                </div>
              )}
            </div>
          </div>

          {/* Auditor Remarks / Feedback Composer */}
          <div className="rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-4 space-y-2 text-xs">
            <label className="font-bold text-[#2B231D] block">
              {isRevisionMode ? 'Revision Instructions (Required)' : 'Auditor Review Remarks (Optional)'}
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                isRevisionMode
                  ? 'Specify required revisions (e.g., attach GST hotel receipt, adjust meals allowance)...'
                  : 'Add notes for executive clearance...'
              }
              className="w-full p-2.5 rounded-xl border border-[#E8DFD3] bg-white text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
            />
            {isRevisionMode ? (
              <p className="text-[11px] text-rose-700">
                * When requested, request transitions to REVISION_REQUESTED_BY_MANAGER. Upon resubmission, it will return to you first for re-verification.
              </p>
            ) : null}
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
            {!isRevisionMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsRevisionMode(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  <span>Approve & Forward to Admin</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsRevisionMode(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-[#E8DFD3] px-3.5 py-2 text-xs font-semibold text-[#756F68] hover:bg-white transition-colors cursor-pointer"
                >
                  Back to Review
                </button>

                <button
                  type="button"
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                  <span>Submit Revision Request</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
