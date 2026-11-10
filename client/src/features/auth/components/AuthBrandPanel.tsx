import React from 'react';

export const AuthBrandPanel: React.FC = () => {
  return (
    <aside aria-label="About TripFlow" className="hidden min-h-screen p-6 lg:flex">
      <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[24px] border border-[#E8DFD3] bg-[#FAF8F5] p-10 shadow-sm text-left">
        {/* Ambient Warm Dot Pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#D8CDBE 1px, transparent 1.2px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Interactive Travel Governance Workbench Visual */}
        <div className="relative my-6 space-y-4">
          <div className="w-full rounded-[18px] border border-[#E8DFD3] bg-white p-5 shadow-sm text-left">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#A59B90]">
                  Engineering Q4 Travel Pool
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#2B231D]">
                    ₹20,80,000.00
                  </span>
                  <span className="text-xs text-[#756F68]">headroom remaining</span>
                </div>
              </div>
              <span className="rounded-md border border-[#8A582B]/30 bg-[#8A582B]/10 px-2 py-0.5 text-[10px] font-bold text-[#8A582B]">
                ₹35,00,000 Total
              </span>
            </div>

            {/* Visual Headroom Bar */}
            <div className="mt-3.5 w-full h-2 rounded-full bg-[#FAF8F5] border border-[#E8DFD3] overflow-hidden">
              <div className="h-full bg-[#8A582B] rounded-full w-[40.6%]" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10.5px] font-mono tabular-nums text-[#756F68]">
              <span>Utilized: ₹14,20,000.00 (40.6%)</span>
              <span className="font-semibold text-[#2B231D]">Available: 59.4%</span>
            </div>
          </div>

          {/* Audit Ledger Snippet Card */}
          <div className="w-full rounded-[16px] border border-[#E8DFD3] bg-[#2B231D] p-4 text-white shadow-md text-left">
            <div className="flex items-center justify-between border-b border-[#3D332B] pb-2.5 mb-2.5">
              <span className="text-xs font-semibold text-[#FAF8F5]">
                Recent Audit Timeline
              </span>
              <span className="text-[10px] font-mono text-[#D4A373]">
                Zero Manager Bypass
              </span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between">
                <span className="truncate max-w-[220px] text-[#E8DFD3]">
                  TR-0891 · Tokyo Tech Exchange
                </span>
                <span className="font-mono tabular-nums text-[#D4A373]">₹1,48,000</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="truncate max-w-[220px] text-[#E8DFD3]">
                  TR-0892 · Singapore Client Summit
                </span>
                <span className="font-mono tabular-nums text-[#D4A373]">₹1,02,500</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Testimonial Quote */}
        <figure className="relative text-left">
          <blockquote className="text-[17px] font-medium leading-relaxed tracking-tight text-[#2B231D]">
            "TripFlow automated our two-tier travel approvals and real-time ₹35L budget headroom enforcement. Claims that took 3 weeks now settle in 24 hours."
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <div className="size-9 rounded-full bg-[#8A582B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              PS
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#2B231D]">Priya Sharma</span>
              <span className="text-[11px] text-[#756F68]">VP Finance & Operations, Global Tech</span>
            </div>
          </figcaption>
        </figure>
      </div>
    </aside>
  );
};
