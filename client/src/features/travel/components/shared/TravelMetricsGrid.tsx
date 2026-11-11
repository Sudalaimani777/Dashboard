import React from 'react';

export interface MetricItem {
  label: string;
  value: string | number;
  subtext?: string;
  isCurrency?: boolean;
}

export interface TravelMetricsGridProps {
  metrics: MetricItem[];
}

export const TravelMetricsGrid: React.FC<TravelMetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E8DFD3] rounded-2xl p-4 flex flex-col gap-1 shadow-sm"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#756F68]">
            {m.label}
          </span>
          <span
            className={`text-2xl font-bold text-[#2B231D] tracking-tight ${
              m.isCurrency ? 'font-mono tabular-nums text-[#8A582B]' : ''
            }`}
          >
            {m.value}
          </span>
          {m.subtext && (
            <span className="text-[10px] text-[#A0988E]">
              {m.subtext}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
