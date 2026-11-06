import React from 'react';
import { Bookmark, Plus } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';

interface NowReadingCardProps {
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  estimatedFinishDays: number;
  dailyPace: number;
  onOpenLogModal: () => void;
}

export const NowReadingCard: React.FC<NowReadingCardProps> = ({
  title,
  author,
  currentPage,
  totalPages,
  estimatedFinishDays,
  dailyPace,
  onOpenLogModal,
}) => {
  const progressPercentage = Math.min(
    100,
    Math.round((currentPage / totalPages) * 100)
  );

  return (
    <section className="bg-[#FFFFFF] border border-[#E8DFD3] rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-7">
        
        {/* Book Cover with Clothbound Spine Feel */}
        <div className="w-28 sm:w-32 h-40 sm:h-44 rounded-lg bg-gradient-to-r from-[#241D17] via-[#3B2F25] to-[#2B231D] border border-[#E8DFD3] shadow-sm flex-shrink-0 flex flex-col justify-between p-3.5 text-white relative overflow-hidden">
          {/* Subtle Spine Emboss Line */}
          <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-black/25" />
          <div className="text-[10px] text-[#D4A373] font-medium pl-1">
            {author}
          </div>
          <div className="space-y-1.5 pl-1">
            <div className="text-xs font-serif font-bold leading-tight text-[#FAF8F5]">
              {title}
            </div>
            <div className="w-5 h-0.5 bg-[#D4A373]/80" />
          </div>
          <div className="text-[8px] text-[#E8DFD3]/60 pl-1 tracking-wider">
            Hardcover Edition
          </div>
        </div>

        {/* Book Details & Progress */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A582B] mb-1">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Currently reading</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2B231D] tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-[#756F68] mt-0.5 font-normal">by {author}</p>
          </div>

          {/* Reading Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#756F68]">
              <span>
                Page <strong className="text-[#2B231D] font-semibold">{currentPage}</strong> of {totalPages}{' '}
                <span className="text-[#8A582B] font-medium">({progressPercentage}%)</span>
              </span>
              <span className="text-[#756F68]">
                Estimated completion: ~{estimatedFinishDays} days
              </span>
            </div>
            <div className="w-full h-2 bg-[#FAF8F5] border border-[#E8DFD3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8A582B] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Footer Pace & CTA */}
          <div className="pt-0.5 flex items-center justify-between">
            <p className="text-xs text-[#756F68]">
              Current rhythm: ~{dailyPace} pages per session
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenLogModal}
              className="bg-[#8A582B] text-white hover:bg-[#754820] text-xs px-4 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Log Pages
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
