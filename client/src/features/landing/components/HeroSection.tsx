import React from 'react';
import { ArrowRight, CheckCircle2, TrendingUp, FileText, Building2 } from 'lucide-react';
import { HeroWithMockup } from './HeroWithMockup';

export const HeroSection: React.FC = () => {
  return (
    <HeroWithMockup
      title="Corporate travel approvals & expense reimbursement without friction."
      description="Empower employees with upfront quotation estimates and tax receipts, while managers and finance executives govern itineraries with real-time ₹35L budget headroom safeguards."
      primaryCta={{
        text: "Access Travel Portal",
        href: "/signin",
        icon: <ArrowRight className="size-4" />,
      }}
      secondaryCta={{
        text: "Explore 2-Tier Workflows",
        href: "#workflows",
      }}
      mockupContent={
        <div className="w-full bg-[#FFFFFF] p-4 sm:p-7 text-left font-sans">
          {/* Mockup Top Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E8DFD3] gap-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[#2B231D] flex items-center justify-center text-white font-bold text-xs">
                TF
              </div>
            </div>

           
          </div>

          {/* 4 Governance KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5">
            {/* KPI 1 */}
            <div className="p-4 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#756F68] text-xs">
                <span>Total Q4 Pool</span>
                <Building2 className="size-3.5 text-[#8A582B]" />
              </div>
              <div className="mt-2 font-mono tabular-nums text-xl font-bold text-[#2B231D]">
                ₹35,00,000.00
              </div>
              <span className="text-[10px] text-[#756F68] mt-1">Authorized Department Allocation</span>
            </div>

            {/* KPI 2 */}
            <div className="p-4 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#756F68] text-xs">
                <span>Available Headroom</span>
                <TrendingUp className="size-3.5 text-[#2E7D32]" />
              </div>
              <div className="mt-2 font-mono tabular-nums text-xl font-bold text-[#2E7D32]">
                ₹20,80,000.00
              </div>
              <div className="mt-1 w-full bg-[#E8DFD3] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#8A582B] h-full rounded-full w-[40.6%]" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-4 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#756F68] text-xs">
                <span>In-Flight Requests</span>
                <FileText className="size-3.5 text-[#996735]" />
              </div>
              <div className="mt-2 font-mono tabular-nums text-xl font-bold text-[#2B231D]">
                ₹1,02,500.00
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-[#756F68]">
                <span className="rounded border border-[#8A582B]/40 bg-[#8A582B]/10 px-1.5 py-0.5 text-[#8A582B] font-semibold text-[9.5px]">
                  Pending Manager Review
                </span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-4 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5]/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#756F68] text-xs">
                <span>Settled Claims</span>
                <CheckCircle2 className="size-3.5 text-[#2E7D32]" />
              </div>
              <div className="mt-2 font-mono tabular-nums text-xl font-bold text-[#2B231D]">
                ₹14,20,000.00
              </div>
              <span className="text-[10px] text-[#2E7D32] font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Audited tax proofs verified
              </span>
            </div>
          </div>

          {/* Sample Live Audit Row */}
          <div className="mt-5 rounded-xl border border-[#E8DFD3] bg-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A582B] mb-2 flex items-center justify-between">
              <span>Active Governance Audit Snapshot</span>
              <span className="text-[10px] font-normal normal-case text-[#756F68]">Post-trip claims & Pre-trip quotes</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-[#E8DFD3] bg-[#FAF8F5]/40 hover:bg-[#FAF8F5] transition-colors gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2B231D]">Client Architecture Summit - Singapore</span>
                    <span className="rounded border border-[#8A582B]/40 bg-[#8A582B]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8A582B]">
                      Pending Manager Review
                    </span>
                  </div>
                  <p className="text-[11px] text-[#756F68] mt-0.5">Requester: Arun Kumar (Engineering) • Flight & Hotel quotes attached</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-mono tabular-nums text-sm font-bold text-[#2B231D]">₹1,02,500.00</span>
                  <span className="text-[10px] font-semibold text-[#8A582B] rounded border border-[#8A582B] px-2 py-1 bg-white">
                    Audit Drawer
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-[#E8DFD3] bg-[#FAF8F5]/40 hover:bg-[#FAF8F5] transition-colors gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2B231D]">Annual APAC Tech Exchange - Tokyo</span>
                    <span className="rounded border border-[#2E7D32]/40 bg-[#2E7D32]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2E7D32]">
                      Settled & Paid
                    </span>
                  </div>
                  <p className="text-[11px] text-[#756F68] mt-0.5">Requester: Meera Patel (Product) • Itemized GST tax invoices verified</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-mono tabular-nums text-sm font-bold text-[#2B231D]">₹68,400.00</span>
                  <span className="text-[10px] font-semibold text-[#2E7D32] rounded border border-[#2E7D32] px-2 py-1 bg-white">
                    Payout Cleared
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};
