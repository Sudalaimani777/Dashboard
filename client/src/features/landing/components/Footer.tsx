import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <>
      <footer className="relative bg-[#201914] text-[#FAF8F5] pt-14 pb-10 border-t border-[#3D332B] rounded-t-[20px] sm:rounded-t-[24px] overflow-hidden transition-colors duration-300">
        <div className="container relative z-10 mx-auto px-6 max-w-7xl">
          {/* Main Content Grid: Streamlined into Brand & Purpose + Essential Enterprise Actions */}
          <div className="grid gap-10 md:grid-cols-12 pb-12 border-b border-[#2E241D]">
            {/* Left Column: Brand, Description & Trust Badges (Span 6) */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#8A582B] text-white font-bold text-xs shadow-sm">
                  TF
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base leading-none tracking-tight text-[#FAF8F5]">
                    TripFlow
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#A59B90] max-w-md">
                Two-tier corporate travel approval and expense reimbursement engine. Enforces upfront quotations, GST receipts, and real-time ₹35L department budget headroom safeguards.
              </p>
            </div>

            {/* Right Columns: Enterprise Navigation & Support (Span 6) */}
            <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-2 gap-8">
              {/* Column 1: Governance Portals */}
              <div>
                <h4 className="text-[11px] font-semibold tracking-wider text-[#E8DFD3] uppercase mb-3.5">
                  Role Portals
                </h4>
                <nav className="space-y-2.5 text-xs text-[#A59B90]">
                  <Link
                    to="/signin"
                    className="flex items-center justify-between text-[#C8BDB0] hover:text-[#FAF8F5] transition-colors"
                  >
                    <span>Employee Portal</span>
                    <ArrowUpRight className="size-3 opacity-60" />
                  </Link>
                  <Link
                    to="/signin"
                    className="flex items-center justify-between text-[#C8BDB0] hover:text-[#FAF8F5] transition-colors"
                  >
                    <span>Line Manager Queue</span>
                    <ArrowUpRight className="size-3 opacity-60" />
                  </Link>
                  <Link
                    to="/signin"
                    className="flex items-center justify-between text-[#C8BDB0] hover:text-[#FAF8F5] transition-colors"
                  >
                    <span>Executive Finance Hub</span>
                    <ArrowUpRight className="size-3 opacity-60" />
                  </Link>
                </nav>
              </div>

              {/* Column 2: Governance & Helpdesk */}
              <div>
                <h4 className="text-[11px] font-semibold tracking-wider text-[#E8DFD3] uppercase mb-3.5">
                  Compliance & Support
                </h4>
                <nav className="space-y-2.5 text-xs text-[#A59B90]">
                  <a
                    href="#workflows"
                    className="block text-[#C8BDB0] hover:text-[#FAF8F5] transition-colors"
                  >
                    Two-Tier Approval Workflows
                  </a>
                  <a
                    href="#budgets"
                    className="block text-[#C8BDB0] hover:text-[#FAF8F5] transition-colors"
                  >
                    Department Budget Safeguards
                  </a>
                  <a
                    href="#policy"
                    className="block text-[#C8BDB0] hover:text-[#FAF8F5] transition-colors"
                  >
                    Corporate Travel Policy
                  </a>
                </nav>
              </div>
            </div>
          </div>

          {/* Bottom Legal & Security Strip */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center text-[11px] text-[#8A8177] gap-3">
            <p>© 2026 TripFlow. Corporate Travel & Expense Governance. Internal Enterprise Use Only.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export const AnimatedWaveFooter = Footer;
export default Footer;
