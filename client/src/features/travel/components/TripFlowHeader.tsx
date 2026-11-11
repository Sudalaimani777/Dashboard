import React from 'react';
import { LogOut } from 'lucide-react';
import type { User } from '../../auth/types/auth.types';

export interface TripFlowHeaderProps {
  user: User | null;
  onSignOut: () => void;
}

export const TripFlowHeader: React.FC<TripFlowHeaderProps> = ({
  user,
  onSignOut,
}) => {
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'border-[#5C241C]/30 bg-[#5C241C]/10 text-[#5C241C]';
      case 'MANAGER':
        return 'border-[#8A582B]/30 bg-[#8A582B]/10 text-[#8A582B]';
      case 'EMPLOYEE':
      default:
        return 'border-[#756F68]/30 bg-[#756F68]/10 text-[#2B231D]';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#E8DFD3] bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#2B231D] text-white font-bold text-xs shadow-sm ring-1 ring-[#8A582B]/20">
            TF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#2B231D]">
                TripFlow
              </span>
            </div>
           
          </div>
        </div>

        {/* User Identity & Sign Out */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2.5 text-right">
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#2B231D] leading-tight">
                  {user.name}
                </p>
                {/* <p className="text-[11px] text-[#756F68] leading-tight">
                  {user.department || 'Engineering'}
                </p> */}
              </div>

              {/* Typographic Role Badge */}
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${getRoleBadgeStyle(
                  user.role
                )}`}
              >
                {user.role || 'EMPLOYEE'}
              </span>
            </div>
          ) : null}

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="flex items-center gap-1.5 rounded-xl border border-[#E8DFD3] bg-[#F7F4EE] px-3 py-1.5 text-xs font-medium text-[#756F68] transition-colors hover:border-[#D4C4B5] hover:bg-white hover:text-[#2B231D] cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
