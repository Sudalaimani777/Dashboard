import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import type { TravelStatus } from '../../types/travel.types';

export interface ManagerDecisionCardProps {
  isSubmitting: boolean;
  status?: TravelStatus;
  onApprove: (remarks: string) => Promise<void>;
  onRequestRevision: (remarks: string) => Promise<void>;
}

export const ManagerDecisionCard: React.FC<ManagerDecisionCardProps> = ({
  isSubmitting,
  status,
  onApprove,
  onRequestRevision,
}) => {
  const [remarks, setRemarks] = useState('');
  const [mode, setMode] = useState<'IDLE' | 'REVISION'>('IDLE');

  const isAdminRevision = status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER';

  const handleApprove = async () => {
    await onApprove(remarks.trim());
  };

  const handleRevision = async () => {
    if (!remarks.trim()) return;
    await onRequestRevision(remarks);
  };

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
        <label className="text-xs font-semibold text-ink">
          {mode === 'REVISION'
            ? isAdminRevision
              ? 'Instructions for Employee (Required)'
              : 'Revision Instructions (Required)'
            : isAdminRevision
            ? 'Clarification Notes for Admin (Optional)'
            : 'Review Remarks (Optional)'}
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={
            mode === 'REVISION'
              ? isAdminRevision
                ? 'Specify required changes for the employee (e.g. Please downgrade hotel quote or attach missing receipt)...'
                : 'Specify required alterations (e.g. Downgrade flight quote, supply missing receipt)...'
              : isAdminRevision
              ? 'Explain operational justifications or additional details for corporate admin clearance...'
              : 'Add optional operational notes for the Admin...'
          }
          className="w-full bg-surface-subtle border border-border-warm rounded-xl p-3 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
        />
      </div>

      {mode === 'IDLE' ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <CheckCircle2 className="size-4" />
            {isAdminRevision ? 'Clarify & Re-Forward to Admin' : 'Approve & Forward to Admin'}
          </button>
          <button
            type="button"
            onClick={() => setMode('REVISION')}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-amber-600/40 text-amber-800 hover:bg-amber-50 active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="size-4" />
            {isAdminRevision ? 'Pass Revision to Employee' : 'Request Changes'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-2 border-t border-border-warm">
          <button
            type="button"
            onClick={() => setMode('IDLE')}
            className="py-2 px-3 rounded-lg border border-border-warm text-xs text-muted hover:bg-surface-subtle transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !remarks.trim()}
            onClick={handleRevision}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer"
          >
            <AlertTriangle className="size-4" />
            {isAdminRevision ? 'Pass Revision to Employee' : 'Send Revision Instructions'}
          </button>
        </div>
      )}
    </div>
  );
};
