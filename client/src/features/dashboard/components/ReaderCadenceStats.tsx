import React from 'react';
import { Calendar, Compass } from 'lucide-react';

interface ReaderCadenceStatsProps {
  annualGoalRead: number;
  annualGoalTotal: number;
  streakDays: number;
  totalAnnualPages: number;
}

export const ReaderCadenceStats: React.FC<ReaderCadenceStatsProps> = ({
  annualGoalRead,
  annualGoalTotal,
  streakDays,
  totalAnnualPages,
}) => {
  const goalPercentage = Math.min(
    100,
    Math.round((annualGoalRead / annualGoalTotal) * 100)
  );

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
      {/* 1. Annual Challenge - Editorial Circular Metric */}
      <div className="bg-[#FFFFFF] border border-[#E8DFD3] rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-medium text-[#756F68]">2026 Reading Goal</div>
          <div className="text-2xl font-bold text-[#2B231D] tracking-tight">
            {annualGoalRead}{' '}
            <span className="text-xs font-normal text-[#756F68]">
              of {annualGoalTotal} books
            </span>
          </div>
          <div className="text-[11px] text-[#8A582B] font-medium">
            {goalPercentage}% completed • 2 ahead of pace
          </div>
        </div>

        {/* Integrated Circular Progress (No floating icon box) */}
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[#FAF8F5]"
              strokeWidth="3.2"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-[#8A582B]"
              strokeDasharray={`${goalPercentage}, 100`}
              strokeWidth="3.2"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="text-[10px] font-bold text-[#8A582B] absolute">
            {goalPercentage}%
          </span>
        </div>
      </div>

      {/* 2. Reading Cadence - Calm Habit Metric (No Duolingo Flame) */}
      <div className="bg-[#FFFFFF] border border-[#E8DFD3] rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#756F68]">
          <span className="font-medium">Reading Cadence</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8A582B]">
            <Calendar className="w-3.5 h-3.5" />
            Active
          </span>
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold text-[#2B231D] tracking-tight">
            {streakDays}{' '}
            <span className="text-xs font-normal text-[#756F68]">
              days uninterrupted
            </span>
          </div>
        </div>
        <div className="text-[11px] text-[#756F68]">
          Evening reading routine maintained
        </div>
      </div>

      {/* 3. Pages Explored - Clean Typographic Counter */}
      <div className="bg-[#FFFFFF] border border-[#E8DFD3] rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-[#756F68]">
          <span className="font-medium">Pages Explored</span>
          <Compass className="w-3.5 h-3.5 text-[#8A582B]" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold text-[#2B231D] tracking-tight">
            {totalAnnualPages.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#756F68]">
              pages logged
            </span>
          </div>
        </div>
        <div className="text-[11px] text-[#8A582B] font-medium">
          +140 pages read this week
        </div>
      </div>
    </section>
  );
};
