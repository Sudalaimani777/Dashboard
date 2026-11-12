import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, AlertTriangle, XCircle } from 'lucide-react';
import type { TravelStatus } from '../../types/travel.types';
import { validateManagerDecisionRemarks } from '../../utils/managerQueue';

export interface ManagerDecisionCardProps {
  isSubmitting: boolean;
  status?: TravelStatus;
  onApprove: (remarks: string) => Promise<void>;
  onRequestRevision: (remarks: string) => Promise<void>;
  onReject: (remarks: string) => Promise<void>;
}

export const ManagerDecisionCard: React.FC<ManagerDecisionCardProps> = ({
  isSubmitting,
  status,
  onApprove,
  onRequestRevision,
  onReject,
}) => {
  const [remarks, setRemarks] = useState('');
  const [mode, setMode] = useState<'IDLE' | 'REVISION' | 'REJECT'>('IDLE');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isAdminRevision = status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER';

  const handleApprove = async () => {
    setValidationError(null);
    await onApprove(remarks.trim());
  };

  const handleRevision = async () => {
    const check = validateManagerDecisionRemarks('REQUEST_REVISION', remarks);
    if (!check.valid) {
      setValidationError(check.error || 'Revision remarks are required.');
      return;
    }
    setValidationError(null);
    await onRequestRevision(remarks.trim());
  };

  const handleReject = async () => {
    const check = validateManagerDecisionRemarks('REJECT', remarks);
    if (!check.valid) {
      setValidationError(check.error || 'Rejection rationale is required.');
      return;
    }
    setValidationError(null);
    await onReject(remarks.trim());
  };

  const trimmedLength = remarks.trim().length;
  const requiresRemarks = mode === 'REVISION' || mode === 'REJECT';

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {isAdminRevision ? 'Response to Admin Directive' : 'Tier 1 Manager Decision'}
        </h3>
        {isAdminRevision && (
          <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Action Required
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="manager-decision-remarks" className="text-xs font-semibold text-ink">
          {mode === 'REJECT'
            ? 'Rejection Rationale (Required, min 3 chars)'
            : mode === 'REVISION'
            ? isAdminRevision
              ? 'Instructions for Employee (Required, min 3 chars)'
              : 'Revision Instructions (Required, min 3 chars)'
            : isAdminRevision
            ? 'Clarification Notes for Admin (Optional)'
            : 'Review Remarks (Optional)'}
        </label>
        <textarea
          id="manager-decision-remarks"
          rows={3}
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder={
            mode === 'REJECT'
              ? 'Explain clearly why this travel request is rejected (e.g. Unapproved travel freeze or duplicate expense claim)...'
              : mode === 'REVISION'
              ? isAdminRevision
                ? 'Specify required changes for the employee (e.g. Downgrade hotel quote or attach missing receipt)...'
                : 'Specify required alterations (e.g. Downgrade flight quote, supply missing receipt)...'
              : isAdminRevision
              ? 'Explain operational justifications or additional details for corporate admin clearance...'
              : 'Add optional operational notes for the Admin...'
          }
          className="w-full bg-surface-subtle border border-border-warm rounded-lg p-3 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
        />
        {validationError && (
          <p className="text-[11px] font-medium text-destructive">{validationError}</p>
        )}
      </div>

      {mode === 'IDLE' && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleApprove}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30"
          >
            <CheckCircle2 className="size-4" />
            {isAdminRevision ? 'Clarify & Re-Forward to Admin' : 'Approve & Forward to Admin'}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setValidationError(null);
                setMode('REVISION');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-amber-600/40 text-amber-800 hover:bg-amber-50 active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/30"
            >
              <RotateCcw className="size-3.5" />
              {isAdminRevision ? 'Send to Employee' : 'Request Changes'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setValidationError(null);
                setMode('REJECT');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 bg-red-50/50 text-destructive hover:bg-red-50 active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            >
              <XCircle className="size-3.5" />
              Reject Request
            </button>
          </div>
        </div>
      )}

      {mode === 'REVISION' && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border-warm">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setValidationError(null);
                setMode('IDLE');
              }}
              className="py-2 px-3 rounded-lg border border-border-warm text-xs font-medium text-muted hover:bg-surface-subtle active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || (requiresRemarks && trimmedLength < 3)}
              onClick={handleRevision}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/30"
            >
              <AlertTriangle className="size-4" />
              {isAdminRevision ? 'Pass Revision to Employee' : 'Send Revision Instructions'}
            </button>
          </div>
        </div>
      )}

      {mode === 'REJECT' && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-red-200">
          <p className="text-[11px] text-destructive bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Rejecting permanently closes this request. The requester will see your remarks on the audit timeline.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setValidationError(null);
                setMode('IDLE');
              }}
              className="py-2 px-3 rounded-lg border border-border-warm text-xs font-medium text-muted hover:bg-surface-subtle active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || (requiresRemarks && trimmedLength < 3)}
              onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-destructive hover:bg-red-700 active:scale-[0.98] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            >
              <XCircle className="size-4" />
              Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
