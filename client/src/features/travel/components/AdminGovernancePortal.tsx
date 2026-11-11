import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle, Plane, ReceiptText } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelStatusBadge } from './TravelStatusBadge';
import { DepartmentBudgetCard } from './DepartmentBudgetCard';
import { AdminGovernanceDrawer } from './AdminGovernanceDrawer';
import { DualRouteRevisionModal } from './DualRouteRevisionModal';
import { formatINR } from '../utils/currency';
import type { TravelRequest, RevisionTarget } from '../types/travel.types';
import type { User } from '../../auth/types/auth.types';

export interface AdminGovernancePortalProps {
  user: User;
}

export const AdminGovernancePortal: React.FC<AdminGovernancePortalProps> = ({ user }) => {
  const { adminQueue, budget, isLoading, error, loadAdminQueue, loadBudget, reviewAsAdmin } = useTravel();

  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<TravelRequest | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    loadAdminQueue();
    loadBudget(user.department || 'Engineering', 2026, 'Q4');
  }, [loadAdminQueue, loadBudget, user.department]);

  const handleOpenReview = (req: TravelRequest) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
    setSuccessBanner(null);
  };

  const handleSettlePayout = async (id: string, remarks?: string) => {
    await reviewAsAdmin(id, {
      action: 'SETTLE',
      remarks: remarks || 'Corporate finance reimbursement settled.',
    });
    setSuccessBanner(`Reimbursement #${id.slice(0, 8)} successfully settled and disbursed.`);
    await loadAdminQueue();
    await loadBudget(user.department || 'Engineering', 2026, 'Q4');
  };

  const handleGrantClearance = async (id: string, remarks?: string) => {
    await reviewAsAdmin(id, {
      action: 'APPROVE',
      remarks: remarks || 'Tier 2 executive clearance granted.',
    });
    setSuccessBanner(`Travel authorization #${id.slice(0, 8)} approved with budget clearance.`);
    await loadAdminQueue();
    await loadBudget(user.department || 'Engineering', 2026, 'Q4');
  };

  const handleOpenRevision = (req: TravelRequest) => {
    setIsDrawerOpen(false);
    setRevisionTarget(req);
    setIsRevisionModalOpen(true);
  };

  const handleRevisionSubmit = async (id: string, route: RevisionTarget, remarks: string) => {
    await reviewAsAdmin(id, {
      action: 'REQUEST_REVISION',
      revisionTarget: route,
      remarks,
    });
    setSuccessBanner(`Revision dispatched for request #${id.slice(0, 8)} via ${route === 'MANAGER' ? 'Route A (Manager)' : 'Route B (Direct)'}.`);
    await loadAdminQueue();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F4EE] text-[#2B231D] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8DFD3] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#2B231D]">
                Executive Governance Hub
              </h1>
              <span className="rounded-md border border-[#5C241C]/30 bg-[#5C241C]/10 px-2 py-0.5 text-[10px] font-bold text-[#5C241C]">
                Tier 2 Clearance
              </span>
            </div>
            <p className="mt-1 text-xs text-[#756F68]">
              Executive authority for <span className="font-semibold text-[#2B231D]">{user.name}</span>. Enforce department budgets, settle post-trip reimbursements, and grant pre-trip clearances.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                loadAdminQueue();
                loadBudget(user.department || 'Engineering', 2026, 'Q4');
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8DFD3] bg-white px-3.5 py-2 text-xs font-semibold text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Governance Data</span>
            </button>
          </div>
        </div>

        {/* Success Notice */}
        {successBanner ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 text-left">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Error Notice */}
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 text-left">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Department Budget Card (Pooled ₹35,00,000 Allocation) */}
        <DepartmentBudgetCard budget={budget} departmentName={user.department || 'Engineering'} />

        {/* Executive Clearance Queue */}
        <div className="rounded-2xl border border-[#E8DFD3] bg-white shadow-xs overflow-hidden text-left">
          <div className="border-b border-[#E8DFD3] p-4 bg-[#FAF8F5] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#2B231D]">
                Executive Clearance Queue ({adminQueue.length})
              </h2>
              <p className="text-[11px] text-[#756F68]">
                Requests endorsed by Line Managers awaiting executive clearance or disbursement settlement.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#8A582B]">
              Dual-Tier Governance
            </span>
          </div>

          {adminQueue.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-3">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-[#2B231D]">All clear!</h3>
              <p className="mt-1 text-xs text-[#756F68] max-w-sm mx-auto">
                No travel requests are currently awaiting executive clearance. All audited items have been authorized or settled.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E8DFD3] bg-[#FAF8F5] text-[#756F68]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Requester</th>
                    <th className="py-3 px-4 font-semibold">Title & Project</th>
                    <th className="py-3 px-4 font-semibold">Operational Case</th>
                    <th className="py-3 px-4 font-semibold">Manager Endorsement</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD3]">
                  {adminQueue.map((req) => (
                    <tr key={req.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#2B231D] block">
                          {req.requesterName || 'Employee'}
                        </span>
                        <span className="text-[11px] text-[#756F68] block">
                          {req.requesterDepartment || req.projectCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#2B231D] block">
                          {req.title}
                        </span>
                        <span className="font-mono text-[10px] text-[#A59B90]">
                          #{req.id.slice(0, 8)} · {req.origin} → {req.destination}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#E8DFD3] bg-[#F7F4EE] px-2 py-0.5 text-[10px] font-semibold text-[#8A582B]">
                          {req.travelType === 'UPCOMING' ? (
                            <>
                              <Plane className="size-3" />
                              <span>Upcoming Clearance</span>
                            </>
                          ) : (
                            <>
                              <ReceiptText className="size-3" />
                              <span>Payout Settlement</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#756F68] max-w-xs truncate">
                        <span className="font-medium text-[#2B231D]">{req.managerName || 'Manager'}: </span>
                        "{req.managerRemarks || 'Verified'}"
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-[#2B231D] whitespace-nowrap">
                        {formatINR(req.totalExpenses)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TravelStatusBadge status={req.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(req)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#5C241C] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#3D140E] transition-colors cursor-pointer"
                        >
                          Review & Clear
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Admin Governance Drawer */}
      <AdminGovernanceDrawer
        request={selectedRequest}
        budget={budget}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRequest(null);
        }}
        onSettle={handleSettlePayout}
        onApprove={handleGrantClearance}
        onOpenRevisionModal={handleOpenRevision}
      />

      {/* Dual Route Revision Dispatch Modal */}
      <DualRouteRevisionModal
        request={revisionTarget}
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false);
          setRevisionTarget(null);
        }}
        onSubmit={handleRevisionSubmit}
      />
    </div>
  );
};
