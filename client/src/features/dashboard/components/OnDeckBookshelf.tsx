import React from 'react';
import type { BookItem } from '../types/dashboard.types';

interface OnDeckBookshelfProps {
  books: BookItem[];
  onViewAll?: () => void;
}

export const OnDeckBookshelf: React.FC<OnDeckBookshelfProps> = ({
  books,
  onViewAll,
}) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#E8DFD3] rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#2B231D]">On Deck</h3>
            <p className="text-xs text-[#756F68] mt-0.5">Your reading queue and recent completions</p>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-[#8A582B] font-medium hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            View library
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-1">
          {books.map((book) => (
            <div key={book.id} className="group cursor-pointer">
              {/* Book Cover with Spine Line */}
              <div
                className={`w-full aspect-2/3 rounded-lg bg-gradient-to-r ${book.coverGradient} border border-[#E8DFD3] shadow-xs flex flex-col justify-between p-2.5 text-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md relative overflow-hidden`}
              >
                <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-black/20" />
                <div className="text-[7px] text-[#E8DFD3]/70 truncate pl-1">
                  {book.author}
                </div>
                <div className="text-[10px] font-serif font-bold leading-tight pl-1">
                  {book.title}
                </div>
              </div>

              {/* Book Metadata */}
              <div className="mt-2 text-left">
                <div className="text-xs font-semibold text-[#2B231D] truncate">
                  {book.title}
                </div>
                <div className="text-[11px] text-[#756F68] truncate">
                  {book.author}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${
                      book.isFinished
                        ? 'bg-[#FAF8F5] text-[#2B231D] border border-[#E8DFD3]'
                        : 'bg-[#FAF8F5] text-[#8A582B] border border-[#E8DFD3]'
                    }`}
                  >
                    {book.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
