import React, { useState } from 'react';
import { ShieldCheck, Receipt, RotateCcw, Ban, AlertTriangle } from 'lucide-react';
import type { TravelType, RevisionTarget } from '../../types/travel.types';
import { DualRouteSelector } from './DualRouteSelector';
import { validateAdminDecisionRemarks } from '../../utils/adminQueue';

type AdminDecisionMode = 'DEFAULT' | 'REVISE' | 'REJECT';

export interface AdminClearanceCardProps {
  travelType: TravelType;
  isSubmitting: boolean;
  isBudgetOverflow?: boolean;
  onClearance: (action: 'APPROVE' | 'SETTLE', remarks: string, forceOverride?: boolean) => Promise<void>;
  onRevision: (revisionTarget: RevisionTarget, remarks: string) => Promise<void>;
  onReject: (remarks: string) => Promise<void>;
}

export const AdminClearanceCard: React.FC<AdminClearanceCardProps> = ({
  travelType,
  isSubmitting,
  isBudgetOverflow = false,
  onClearance,
  onRevision,
  onReject,
}) => {
  const [remarks, setRemarks] = useState('');
  const [mode, setMode] = useState<AdminDecisionMode>('DEFAULT');
  const [routeTarget, setRouteTarget] = useState<RevisionTarget>('MANAGER');
  const [forceOverride, setForceOverride] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isCase1 = travelType === 'ALREADY_TRAVELLED';

  const handleClearance = async () => {
    const action = isCase1 ? 'SETTLE' : 'APPROVE';
    const check = validateAdminDecisionRemarks(action, remarks, {
      isOverflow: isBudgetOverflow,
      forceOverride,
    });
    if (!check.valid) {
      setValidationError(check.message || 'Unable to authorize request.');
      return;
    }
    setValidationError(null);
    await onClearance(action, remarks.trim(), forceOverride);
  };

  const handleRevisionSubmit = async () => {
    const check = validateAdminDecisionRemarks('REQUEST_REVISION', remarks);
    if (!check.valid) {
      setValidationError(check.message || 'Revision instructions required.');
      return;
    }
    setValidationError(null);
    await onRevision(routeTarget, remarks.trim());
  };

  const handleRejectSubmit = async () => {
    const check = validateAdminDecisionRemarks('REJECT', remarks);
    if (!check.valid) {
      setValidationError(check.message || 'Rejection rationale required.');
      return;
    }
    setValidationError(null);
    await onReject(remarks.trim());
  };

  const resetMode = () => {
    setMode('DEFAULT');
    setValidationError(null);
  };

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border-warm pb-3">
        <h3 className="text-sm font-semibold text-ink">
          Tier 2 Executive Governance Decision
        </h3>
        <span className="text-[10px] font-mono text-muted">
          {isCase1 ? 'Reimbursement' : 'Pre-Trip'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-clearance-remarks" className="text-xs font-semibold text-ink">
          {mode === 'REVISE'
            ? 'Alteration Instructions (Required, min 3 chars)'
            : mode === 'REJECT'
            ? 'Rejection Rationale (Required, min 3 chars)'
            : 'Executive Remarks (Optional for clearance)'}
        </label>
        <textarea
          id="admin-clearance-remarks"
          rows={3}
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder={
            mode === 'REVISE'
              ? 'Specify requested changes to flight class, dates, or missing receipts...'
              : mode === 'REJECT'
              ? 'Explain policy breach or reason this request is declined...'
              : 'Add optional finance and governance notes...'
          }
          className="w-full bg-surface-subtle border border-border-warm rounded-xl p-3 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
        />
      </div>

      {validationError && (
        <div className="rounded-lg border border-destructive/30 bg-[#FFF0E8] px-3 py-2 text-xs text-destructive font-medium">
          {validationError}
        </div>
      )}

      {mode === 'DEFAULT' && isBudgetOverflow && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 flex flex-col gap-2">
          <div className="flex items-start gap-2 text-xs text-amber-900 font-semibold">
            <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Projected spend exceeds remaining quarterly department headroom. Standard clearance is blocked unless overridden.
            </span>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={forceOverride}
              onChange={(e) => {
                setForceOverride(e.target.checked);
                if (validationError) setValidationError(null);
              }}
              className="rounded border-border-warm accent-primary size-3.5 cursor-pointer"
            />
            <span className="font-medium">Confirm Executive Budget Overflow Override</span>
          </label>
        </div>
      )}

      {mode === 'REVISE' ? (
        <div className="flex flex-col gap-3 pt-2 border-t border-border-warm">
          <DualRouteSelector value={routeTarget} onChange={setRouteTarget} />

          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={resetMode}
              className="py-2 px-3 rounded-lg border border-border-warm text-xs text-muted hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRevisionSubmit}
              className="flex-1 py-2 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              Dispatch Revision
            </button>
          </div>
        </div>
      ) : mode === 'REJECT' ? (
        <div className="flex flex-col gap-3 pt-2 border-t border-border-warm">
          <p className="text-[11px] text-destructive">
            Rejecting permanently closes this request without deducting from the department budget.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetMode}
              className="py-2 px-3 rounded-lg border border-border-warm text-xs text-muted hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRejectSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-destructive hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Ban className="size-3.5" /> Confirm Rejection
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClearance}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#3F624D] hover:bg-[#33513F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {isCase1 ? <Receipt className="size-4" /> : <ShieldCheck className="size-4" />}
            {isCase1
              ? forceOverride
                ? 'Settle Payout (With Override)'
                : 'Authorize Payout & Settle'
              : forceOverride
              ? 'Grant Clearance (With Override)'
              : 'Grant Travel Clearance'}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setMode('REVISE');
                setValidationError(null);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-amber-700/35 text-amber-900 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" /> Request Alterations
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setMode('REJECT');
                setValidationError(null);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-destructive/35 text-destructive hover:bg-[#FFF0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Ban className="size-3.5" /> Reject Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
