import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Calendar, MapPin } from 'lucide-react';
import { useTravel } from '../hooks/useTravel';
import { useAuditDecision } from '../hooks/useAuditDecision';
import { ProofInspectorViewer } from '../components/audit/ProofInspectorViewer';
import { ManagerDecisionCard } from '../components/audit/ManagerDecisionCard';
import { AuditTimelineLog } from '../components/audit/AuditTimelineLog';
import { TravelStatusBadge } from '../components/TravelStatusBadge';
import { formatINR } from '../utils/currency';
import type { TravelRequest } from '../types/travel.types';

export const ManagerAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadRequestDetails } = useTravel();
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isSubmitting, error, managerApprove, managerRequestRevision } = useAuditDecision(id || '');

  useEffect(() => {
    if (id) {
      loadRequestDetails(id)
        .then(setRequest)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [id, loadRequestDetails]);

  if (isLoading || !request) {
    return (
      <div className="p-8 text-center text-xs text-[#756F68]">
        Loading audit workstation...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-[#756F68] hover:text-[#2B231D] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Team Queue
        </button>
        <div className="flex items-center gap-3">
          <TravelStatusBadge status={request.status} />
          <span className="text-sm font-mono tabular-nums font-bold text-[#8A582B] bg-[#F5EBE1] px-3 py-1 rounded-full border border-[#E8DFD3]">
            {formatINR(request.totalExpenses)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#2B231D] tracking-tight">{request.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#756F68] mt-1">
          <span className="flex items-center gap-1 font-semibold text-[#2B231D]">
            <UserIcon className="w-3.5 h-3.5 text-[#8A582B]" />
            {request.requesterName || 'Employee'} ({request.requesterEmail})
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {request.origin} → {request.destination}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" /> {request.departureDate} to {request.returnDate}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-[#9E2A2B] font-medium">
          {error}
        </div>
      )}

      {/* Split Audit Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Proof Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ProofInspectorViewer proofUrl={request.supportingDocUrl} title={request.title} />
          <AuditTimelineLog timeline={request.timeline} />
        </div>

        {/* Right: Decision Panel & Expenses */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <ManagerDecisionCard
            isSubmitting={isSubmitting}
            onApprove={managerApprove}
            onRequestRevision={managerRequestRevision}
          />

          {/* Itemized Expenses Card */}
          <div className="bg-white rounded-2xl border border-[#E8DFD3] p-5 flex flex-col gap-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#756F68]">
              Itemized Expenses ({request.expenses?.length || 0})
            </h3>
            <div className="flex flex-col gap-2">
              {request.expenses?.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center text-xs p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8DFD3]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#2B231D]">{exp.merchant}</span>
                    <span className="text-[10px] text-[#756F68]">{exp.category.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-[#8A582B]">
                    {formatINR(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
