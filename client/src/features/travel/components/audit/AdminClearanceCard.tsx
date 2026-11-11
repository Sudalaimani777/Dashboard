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
    const defaultRemark = isCase1
      ? 'Corporate finance reimbursement payout authorized and settled.'
      : 'Executive travel authorization and budget clearance granted.';
    await onClearance(isCase1 ? 'SETTLE' : 'APPROVE', remarks || defaultRemark);
  };

  const handleRevisionSubmit = async () => {
    if (!remarks.trim()) return;
    await onRevision(routeTarget, remarks);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-5 flex flex-col gap-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
        Tier 2 Executive Governance Decision
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2B231D]">
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
          className="w-full bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl p-3 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        />
      </div>

      {isRevisionMode ? (
        <div className="flex flex-col gap-3 pt-2 border-t border-[#E8DFD3]">
          <DualRouteSelector value={routeTarget} onChange={setRouteTarget} />

          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => setIsRevisionMode(false)}
              className="py-2 px-3 rounded-lg border border-[#E8DFD3] text-xs text-[#756F68]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !remarks.trim()}
              onClick={handleRevisionSubmit}
              className="flex-1 py-2 px-4 rounded-xl bg-[#B9770E] hover:bg-[#9C650C] text-white text-xs font-semibold disabled:opacity-50"
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#256829] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            {isCase1 ? <Receipt className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {isCase1 ? 'Authorize Payout & Settle' : 'Grant Travel Clearance'}
          </button>
          <button
            type="button"
            onClick={() => setIsRevisionMode(true)}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[#B9770E] text-[#B9770E] hover:bg-[#FEF9E7] text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Request Alterations
          </button>
        </div>
      )}
    </div>
  );
};
