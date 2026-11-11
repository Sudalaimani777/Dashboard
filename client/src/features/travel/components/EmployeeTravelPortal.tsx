import React, { useEffect, useState } from 'react';
import { Plus, Plane, ReceiptText, ShieldAlert, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { TravelStatusBadge } from './TravelStatusBadge';
import { NewTravelRequestModal } from './NewTravelRequestModal';
import { ResubmitRequestModal } from './ResubmitRequestModal';
import { TravelDetailDrawer } from './TravelDetailDrawer';
import { formatINR } from '../utils/currency';
import type { TravelRequest, CreateTravelRequestInput, ResubmitRequestInput } from '../types/travel.types';
import type { User } from '../../auth/types/auth.types';

export interface EmployeeTravelPortalProps {
  user: User;
}

export const EmployeeTravelPortal: React.FC<EmployeeTravelPortalProps> = ({ user }) => {
  const { requests, isLoading, error, loadRequests, createRequest, resubmitRequest } = useTravel();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resubmitTarget, setResubmitTarget] = useState<TravelRequest | null>(null);
  const [isResubmitOpen, setIsResubmitOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_REVIEW' | 'APPROVED' | 'REVISION'>('ALL');

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleOpenDetail = (req: TravelRequest) => {
    setSelectedRequest(req);
    setIsDetailOpen(true);
  };

  const handleOpenResubmit = (req: TravelRequest) => {
    setIsDetailOpen(false);
    setResubmitTarget(req);
    setIsResubmitOpen(true);
  };

  const handleCreateSubmit = async (input: CreateTravelRequestInput) => {
    await createRequest(input);
    await loadRequests();
  };

  const handleResubmitSubmit = async (id: string, input: ResubmitRequestInput) => {
    await resubmitRequest(id, input);
    await loadRequests();
  };

  // Metrics calculations
  const totalTrips = requests.length;
  const inReviewCount = requests.filter(
    (r) => r.status === 'PENDING_MANAGER_REVIEW' || r.status === 'PENDING_ADMIN_APPROVAL'
  ).length;
  const approvedCount = requests.filter(
    (r) => r.status === 'APPROVED' || r.status === 'SETTLED'
  ).length;
  const totalExpenditure = requests.reduce((sum, r) => sum + (Number(r.totalExpenses) || 0), 0);

  // Active revision alerts
  const revisionRequests = requests.filter(
    (r) =>
      r.status === 'REVISION_REQUESTED_BY_MANAGER' ||
      r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' ||
      r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
  );

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'IN_REVIEW') {
      return r.status === 'PENDING_MANAGER_REVIEW' || r.status === 'PENDING_ADMIN_APPROVAL';
    }
    if (statusFilter === 'APPROVED') {
      return r.status === 'APPROVED' || r.status === 'SETTLED';
    }
    if (statusFilter === 'REVISION') {
      return (
        r.status === 'REVISION_REQUESTED_BY_MANAGER' ||
        r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_MANAGER' ||
        r.status === 'REVISION_REQUESTED_BY_ADMIN_TO_EMPLOYEE'
      );
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F4EE] text-[#2B231D] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Portal Header & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8DFD3] pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2B231D]">
              Employee Travel Portal
            </h1>
            <p className="mt-1 text-xs text-[#756F68]">
              Welcome back, <span className="font-semibold text-[#2B231D]">{user.name}</span>. Manage upcoming business travel clearances and post-trip reimbursements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadRequests()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8DFD3] bg-white px-3 py-2 text-xs font-semibold text-[#756F68] hover:bg-[#F7F4EE] transition-colors cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#8A582B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#754820] transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              <span>New Travel Request</span>
            </button>
          </div>
        </div>

        {/* Revision Alert Banner */}
        {revisionRequests.length > 0 ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 sm:p-5 shadow-xs text-left">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 text-rose-700 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-rose-900">
                    Action Required: {revisionRequests.length} Request(s) Need Revisions
                  </h3>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Your reviewer requested modifications on recent travel requests. Please review the comments and resubmit; requests will route directly back to your Line Manager for re-verification.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  {revisionRequests.map((rev) => (
                    <button
                      key={rev.id}
                      type="button"
                      onClick={() => handleOpenResubmit(rev)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition-colors cursor-pointer"
                    >
                      <span>Fix #{rev.id.slice(0, 8)} ({rev.title})</span>
                      <ArrowUpRight className="size-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4 shadow-xs text-left">
            <span className="text-[11px] font-semibold text-[#756F68] uppercase tracking-wider">
              Total Requests
            </span>
            <p className="mt-1 text-2xl font-bold font-mono text-[#2B231D]">
              {totalTrips}
            </p>
            <p className="text-[10px] text-[#A59B90] mt-0.5">Lifetime corporate travel</p>
          </div>

          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4 shadow-xs text-left">
            <span className="text-[11px] font-semibold text-[#756F68] uppercase tracking-wider">
              In Review
            </span>
            <p className="mt-1 text-2xl font-bold font-mono text-amber-700">
              {inReviewCount}
            </p>
            <p className="text-[10px] text-[#A59B90] mt-0.5">Manager / Admin queue</p>
          </div>

          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4 shadow-xs text-left">
            <span className="text-[11px] font-semibold text-[#756F68] uppercase tracking-wider">
              Approved & Settled
            </span>
            <p className="mt-1 text-2xl font-bold font-mono text-emerald-700">
              {approvedCount}
            </p>
            <p className="text-[10px] text-[#A59B90] mt-0.5">Cleared or reimbursed</p>
          </div>

          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4 shadow-xs text-left">
            <span className="text-[11px] font-semibold text-[#756F68] uppercase tracking-wider">
              Total Expenditure
            </span>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#2B231D]">
              {formatINR(totalExpenditure)}
            </p>
            <p className="text-[10px] text-[#A59B90] mt-0.5">Calculated in Indian Rupees</p>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 text-left">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Requests Table Container */}
        <div className="rounded-2xl border border-[#E8DFD3] bg-white shadow-xs overflow-hidden text-left">
          {/* Table Controls */}
          <div className="flex items-center justify-between border-b border-[#E8DFD3] p-4 bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#2B231D]">Filter:</span>
              <div className="flex items-center gap-1 rounded-xl bg-[#EFEBE4] p-1 text-xs">
                {(['ALL', 'IN_REVIEW', 'APPROVED', 'REVISION'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-white text-[#2B231D] shadow-xs'
                        : 'text-[#756F68] hover:text-[#2B231D]'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-[#756F68]">
              Showing <span className="font-semibold text-[#2B231D]">{filteredRequests.length}</span> of {requests.length}
            </span>
          </div>

          {/* Table */}
          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#F7F4EE] text-[#8A582B] mb-3">
                <Plane className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-[#2B231D]">No travel requests found</h3>
              <p className="mt-1 text-xs text-[#756F68] max-w-sm mx-auto">
                Submit your first travel request for upcoming trips or submit actual expenses for past trip reimbursement.
              </p>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#8A582B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#754820] transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Create Request</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E8DFD3] bg-[#FAF8F5] text-[#756F68]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Request</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Destination</th>
                    <th className="py-3 px-4 font-semibold">Dates</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD3]">
                  {filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[#FAF8F5]/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#2B231D] block">
                          {req.title}
                        </span>
                        <span className="font-mono text-[10px] text-[#A59B90]">
                          #{req.id.slice(0, 8)} · {req.projectCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#E8DFD3] bg-[#F7F4EE] px-2 py-0.5 text-[10px] font-semibold text-[#8A582B]">
                          {req.travelType === 'UPCOMING' ? (
                            <>
                              <Plane className="size-3" />
                              <span>Upcoming</span>
                            </>
                          ) : (
                            <>
                              <ReceiptText className="size-3" />
                              <span>Reimbursement</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#2B231D] whitespace-nowrap">
                        {req.origin} → {req.destination}
                      </td>

                      <td className="py-3.5 px-4 text-[#756F68] whitespace-nowrap">
                        {req.departureDate ? req.departureDate.split('T')[0] : ''} to{' '}
                        {req.returnDate ? req.returnDate.split('T')[0] : ''}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-[#2B231D] whitespace-nowrap">
                        {formatINR(req.totalExpenses)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TravelStatusBadge status={req.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        {req.status.includes('REVISION') ? (
                          <button
                            type="button"
                            onClick={() => handleOpenResubmit(req)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            Resubmit
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleOpenDetail(req)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E8DFD3] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#756F68] hover:border-[#D4C4B5] hover:text-[#2B231D] transition-colors cursor-pointer"
                        >
                          View Details
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

      {/* Modals & Slide-over Drawers */}
      <NewTravelRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <TravelDetailDrawer
        request={selectedRequest}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequest(null);
        }}
        onOpenResubmit={handleOpenResubmit}
      />

      <ResubmitRequestModal
        request={resubmitTarget}
        isOpen={isResubmitOpen}
        onClose={() => {
          setIsResubmitOpen(false);
          setResubmitTarget(null);
        }}
        onSubmit={handleResubmitSubmit}
      />
    </div>
  );
};
