import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';

interface DashboardTopbarProps {
  activeTab: 'library' | 'goal' | 'notes';
  onTabChange: (tab: 'library' | 'goal' | 'notes') => void;
  userName?: string;
  userEmail?: string;
  onSignout: () => void;
}

export const DashboardTopbar: React.FC<DashboardTopbarProps> = ({
  activeTab,
  onTabChange,
  userName,
  userEmail,
  onSignout,
}) => {
  const initial = (userName || userEmail || 'R')[0].toUpperCase();

  return (
    <header className="w-full border-b border-[#E8DFD3] bg-[#FFFFFF] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E8DFD3] flex items-center justify-center text-[#8A582B]">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#2B231D]">
            TripFlow
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8DFD3]/80">
          <button
            type="button"
            onClick={() => onTabChange('library')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-[#FFFFFF] text-[#8A582B] shadow-xs'
                : 'text-[#756F68] hover:text-[#2B231D]'
            }`}
          >
            My Library
          </button>
          <button
            type="button"
            onClick={() => onTabChange('goal')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'goal'
                ? 'bg-[#FFFFFF] text-[#8A582B] shadow-xs'
                : 'text-[#756F68] hover:text-[#2B231D]'
            }`}
          >
            2026 Goal
          </button>
          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-[#FFFFFF] text-[#8A582B] shadow-xs'
                : 'text-[#756F68] hover:text-[#2B231D]'
            }`}
          >
            Notes & Quotes
          </button>
        </nav>

        {/* Profile & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#2B231D]">
              {userName || 'Reader'}
            </span>
            <span className="text-[11px] text-[#756F68]">{userEmail}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EFE8DE] border border-[#E8DFD3] flex items-center justify-center text-xs font-bold text-[#8A582B]">
            {initial}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSignout}
            className="text-xs ml-1 border-[#E8DFD3] hover:bg-[#FAF8F5]"
          >
            <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
