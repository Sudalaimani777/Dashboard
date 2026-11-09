import React from 'react';
import { Quote } from 'lucide-react';

interface MarginaliaQuoteCardProps {
  quote: string;
  author: string;
  sourceTag?: string;
}

export const MarginaliaQuoteCard: React.FC<MarginaliaQuoteCardProps> = ({
  quote,
  author,
  sourceTag = 'Daily Marginalia',
}) => {
  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-xl p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between text-xs text-[#756F68] pb-3 border-b border-[#E8DFD3]/60">
        <span className="font-medium text-[#8A582B] flex items-center gap-1.5">
          <Quote className="w-3.5 h-3.5" />
          {sourceTag}
        </span>
        <span className="text-[11px] text-[#756F68]">TripFlow Anthology</span>
      </div>

      <div className="py-4 my-auto space-y-3">
        <p className="text-base sm:text-lg font-serif italic text-[#2B231D] leading-relaxed">
          “{quote}”
        </p>
        <p className="text-xs font-medium text-[#756F68]">
          — {author}
        </p>
      </div>

      <div className="pt-3 border-t border-[#E8DFD3]/60 flex items-center justify-between text-[11px] text-[#756F68]">
        <span>Saved to literary journal</span>
        <span className="text-[#8A582B] hover:underline cursor-pointer">
          Browse quotes
        </span>
      </div>
    </div>
  );
};
