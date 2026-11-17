import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowUpRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import type { TravelRequest } from '../../types/travel.types';

export interface ManagerTeamAuditLedgerCardProps {
  requests: TravelRequest[];
}

export const ManagerTeamAuditLedgerCard: React.FC<ManagerTeamAuditLedgerCardProps> = ({
  requests,
}) => {
  const navigate = useNavigate();

  const teamRequests = requests.slice(0, 6);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="size-3" /> Settled
          </span>
        );
      case 'PENDING_MANAGER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="size-3" /> Needs Review
          </span>
        );
      case 'PENDING_ADMIN_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <Clock className="size-3" /> With Admin
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <CheckCircle2 className="size-3" /> Approved
          </span>
        );
      case 'REVISION_REQUESTED_BY_MANAGER':
      case 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER':
      case 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="size-3" /> Revision
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
            <Users className="size-4 text-muted" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Team Approvals &amp; Audit Ledger</h3>
            <p className="text-[11px] text-faint">
              Direct reports' recent travel requests and approval states
            </p>
          </div>
        </div>
      </div>

      {teamRequests.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted">
          No team travel requests on record yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-warm text-[11px] text-faint uppercase font-mono tracking-wider">
                <th className="pb-2.5 font-medium">Requester</th>
                <th className="pb-2.5 font-medium">Destination</th>
                <th className="pb-2.5 font-medium">Project</th>
                <th className="pb-2.5 font-medium text-right">Amount</th>
                <th className="pb-2.5 font-medium text-center">Status</th>
                <th className="pb-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm/60">
              {teamRequests.map((req) => {
                const amount = Number(req.totalExpenses) || 0;

                return (
                  <tr key={req.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 font-semibold text-ink">
                      {req.requesterName || 'Team Member'}
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
                        onClick={() => navigate(`/travel/requests/${req.id}?tab=team`)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Inspect <ArrowUpRight className="size-3" />
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
