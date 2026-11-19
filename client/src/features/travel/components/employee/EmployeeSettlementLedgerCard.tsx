import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowUpRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import type { TravelRequest } from '../../types/travel.types';

export interface EmployeeSettlementLedgerCardProps {
  requests: TravelRequest[];
}

export const EmployeeSettlementLedgerCard: React.FC<EmployeeSettlementLedgerCardProps> = ({
  requests,
}) => {
  const navigate = useNavigate();

  // Show recent active or settled claims (non-drafts)
  const claimRequests = requests
    .filter((r) => r.status !== 'DRAFT')
    .slice(0, 6);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="size-3" /> Settled
          </span>
        );
      case 'CLAIM_SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="size-3" /> Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <CheckCircle2 className="size-3" /> Approved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-border-warm">
            <AlertCircle className="size-3" /> {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border-warm p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border-warm/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-surface-subtle border border-border-warm text-ink">
            <Receipt className="size-4 text-muted" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Claims & Reimbursement Ledger</h3>
            <p className="text-[11px] text-faint">
              Audit trail of recent expense submissions and disbursement states
            </p>
          </div>
        </div>
      </div>

      {claimRequests.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted">
          No expense vouchers or claims submitted yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-warm text-[11px] text-faint uppercase font-mono tracking-wider">
                <th className="pb-2.5 font-medium">Voucher #</th>
                <th className="pb-2.5 font-medium">Destination</th>
                <th className="pb-2.5 font-medium">Project</th>
                <th className="pb-2.5 font-medium text-right">Amount</th>
                <th className="pb-2.5 font-medium text-center">Settlement Status</th>
                <th className="pb-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm/60">
              {claimRequests.map((req) => {
                const amount = Number(req.totalExpenses) || 0;

                return (
                  <tr key={req.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 font-mono font-semibold text-ink">
                      TRV-{req.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 text-ink font-medium">
                      {req.destination || 'Travel'}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-muted">
                      {req.projectCode || 'General'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-ink tabular-nums">
                      {formatINR(amount)}
                    </td>
                    <td className="py-3 text-center">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/travel/requests/${req.id}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Details <ArrowUpRight className="size-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
