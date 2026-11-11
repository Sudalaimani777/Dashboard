import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle, Loader2, Users, User, ShieldAlert } from 'lucide-react';
import type { TravelRequest, RevisionTarget } from '../types/travel.types';

export interface DualRouteRevisionModalProps {
  request: TravelRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, route: RevisionTarget, remarks: string) => Promise<void>;
}

export const DualRouteRevisionModal: React.FC<DualRouteRevisionModalProps> = ({
  request,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<RevisionTarget>('MANAGER');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim() || remarks.trim().length < 5) {
      setError('Please provide specific revision instructions (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(request.id, selectedRoute, remarks.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B231D]/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#E8DFD3] bg-white p-6 shadow-xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFD3] pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#2B231D]">
              Dispatch Revision Instructions
            </h2>
            <p className="text-xs text-[#756F68] mt-0.5">
              Trip #{request.id.slice(0, 8)}: {request.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Dual Route Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#756F68] block">
              Select Revision Dispatch Route
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Route A */}
              <button
                type="button"
                onClick={() => setSelectedRoute('MANAGER')}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  selectedRoute === 'MANAGER'
                    ? 'border-[#8A582B] bg-[#8A582B]/5 ring-1 ring-[#8A582B]/20'
                    : 'border-[#E8DFD3] hover:border-[#D4C4B5] bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedRoute === 'MANAGER' ? 'bg-[#8A582B] text-white' : 'bg-[#F7F4EE] text-[#756F68]'}`}>
                  <Users className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2B231D]">Route A: Via Line Manager</span>
                    <span className="text-[10px] bg-[#F7F4EE] border border-[#E8DFD3] px-1.5 rounded text-[#756F68] font-semibold">Recommended</span>
                  </div>
                  <p className="text-[11px] text-[#756F68] mt-0.5">
                    Instructions route to Line Manager first to audit and collaborate with employee.
                  </p>
                </div>
              </button>

              {/* Route B */}
              <button
                type="button"
                onClick={() => setSelectedRoute('EMPLOYEE')}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  selectedRoute === 'EMPLOYEE'
                    ? 'border-[#8A582B] bg-[#8A582B]/5 ring-1 ring-[#8A582B]/20'
                    : 'border-[#E8DFD3] hover:border-[#D4C4B5] bg-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedRoute === 'EMPLOYEE' ? 'bg-[#8A582B] text-white' : 'bg-[#F7F4EE] text-[#756F68]'}`}>
                  <User className="size-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2B231D]">Route B: Direct to Employee</span>
                  <p className="text-[11px] text-[#756F68] mt-0.5">
                    Instructions route straight to Employee to correct itemized receipts or travel details.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Invariant Guarantee Callout */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="size-4 shrink-0 text-amber-700 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Manager Re-verification Invariant:</strong> In both Route A and Route B, once the employee resubmits, the request <strong>always returns to the Line Manager first</strong> for re-audit before reaching your clearance queue again.
            </p>
          </div>

          {/* Revision Remarks */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#2B231D]">Executive Revision Remarks (Required)</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Explain the required revisions (e.g., flight quote exceeds standard policy, attach boarding passes)..."
              className="w-full p-2.5 rounded-xl border border-[#E8DFD3] text-xs text-[#2B231D] focus:border-[#8A582B] outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#E8DFD3] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#E8DFD3] px-4 py-2 text-xs font-semibold text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              <span>Dispatch Revision</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
