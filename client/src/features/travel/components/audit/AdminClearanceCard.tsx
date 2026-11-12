import React, { useState } from 'react';
import { ShieldCheck, Receipt, RotateCcw } from 'lucide-react';
import type { TravelType, RevisionTarget } from '../../types/travel.types';
import { DualRouteSelector } from './DualRouteSelector';

export interface AdminClearanceCardProps {
  travelType: TravelType;
  isSubmitting: boolean;
  onClearance: (action: 'APPROVE' | 'SETTLE', remarks: string) => Promise<void>;
  onRevision: (revisionTarget: RevisionTarget, remarks: string) => Promise<void>;
}

export const AdminClearanceCard: React.FC<AdminClearanceCardProps> = ({
  travelType,
  isSubmitting,
  onClearance,
  onRevision,
}) => {
  const [remarks, setRemarks] = useState('');
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [routeTarget, setRouteTarget] = useState<RevisionTarget>('MANAGER');

  const isCase1 = travelType === 'ALREADY_TRAVELLED';

  const handleClearance = async () => {
    await onClearance(isCase1 ? 'SETTLE' : 'APPROVE', remarks.trim());
  };

  const handleRevisionSubmit = async () => {
    if (!remarks.trim()) return;
    await onRevision(routeTarget, remarks);
  };

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 flex flex-col gap-4 shadow-xs">
      <h3 className="text-sm font-semibold text-ink">
        Tier 2 Executive Governance Decision
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink">
          {isRevisionMode ? 'Alteration Instructions (Required)' : 'Executive Remarks (Optional)'}
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={
            isRevisionMode
              ? 'Specify requested changes to flight class, dates, or missing receipts...'
              : 'Add optional finance and governance notes...'
          }
          className="w-full bg-surface-subtle border border-border-warm rounded-xl p-3 text-xs text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
        />
      </div>

      {isRevisionMode ? (
        <div className="flex flex-col gap-3 pt-2 border-t border-border-warm">
          <DualRouteSelector value={routeTarget} onChange={setRouteTarget} />

          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => setIsRevisionMode(false)}
              className="py-2 px-3 rounded-lg border border-border-warm text-xs text-muted hover:bg-surface-subtle transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !remarks.trim()}
              onClick={handleRevisionSubmit}
              className="flex-1 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              Dispatch Revision
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClearance}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {isCase1 ? <Receipt className="size-4" /> : <ShieldCheck className="size-4" />}
            {isCase1 ? 'Authorize Payout & Settle' : 'Grant Travel Clearance'}
          </button>
          <button
            type="button"
            onClick={() => setIsRevisionMode(true)}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-amber-600/40 text-amber-800 hover:bg-amber-50 active:scale-[0.98] text-xs font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="size-4" /> Request Alterations
          </button>
        </div>
      )}
    </div>
  );
};
