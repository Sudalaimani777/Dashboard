import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

export interface ManagerDecisionCardProps {
  isSubmitting: boolean;
  onApprove: (remarks: string) => Promise<void>;
  onRequestRevision: (remarks: string) => Promise<void>;
}

export const ManagerDecisionCard: React.FC<ManagerDecisionCardProps> = ({
  isSubmitting,
  onApprove,
  onRequestRevision,
}) => {
  const [remarks, setRemarks] = useState('');
  const [mode, setMode] = useState<'IDLE' | 'REVISION'>('IDLE');

  const handleApprove = async () => {
    await onApprove(remarks || 'Operational necessity and expenses verified by Line Manager.');
  };

  const handleRevision = async () => {
    if (!remarks.trim()) return;
    await onRequestRevision(remarks);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] p-5 flex flex-col gap-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
        Tier 1 Manager Decision
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2B231D]">
          {mode === 'REVISION' ? 'Revision Instructions (Required)' : 'Review Remarks (Optional)'}
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={
            mode === 'REVISION'
              ? 'Specify required alterations (e.g. Downgrade flight quote, supply missing receipt)...'
              : 'Add optional operational notes for the Admin...'
          }
          className="w-full bg-[#FAF8F5] border border-[#E8DFD3] rounded-xl p-3 text-xs text-[#2B231D] focus:outline-none focus:border-[#8A582B]"
        />
      </div>

      {mode === 'IDLE' ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#256829] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve & Forward to Admin
          </button>
          <button
            type="button"
            onClick={() => setMode('REVISION')}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-[#B9770E] text-[#B9770E] hover:bg-[#FEF9E7] text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Request Changes
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-2 border-t border-[#E8DFD3]">
          <button
            type="button"
            onClick={() => setMode('IDLE')}
            className="py-2 px-3 rounded-lg border border-[#E8DFD3] text-xs text-[#756F68]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !remarks.trim()}
            onClick={handleRevision}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#B9770E] hover:bg-[#9C650C] text-white text-xs font-semibold disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" /> Send Revision Instructions
          </button>
        </div>
      )}
    </div>
  );
};
