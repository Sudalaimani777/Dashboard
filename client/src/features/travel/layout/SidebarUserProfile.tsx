import React from 'react';
import { LogOut } from 'lucide-react';
import type { User } from '../../auth/types/auth.types';

export interface SidebarUserProfileProps {
  user: User;
  isCollapsed: boolean;
  onSignOut: () => void;
}

export const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({
  user,
  isCollapsed,
  onSignOut,
}) => {
  const initials = user.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="border-t border-[#E8DFD3] p-3.5 bg-white flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-[#8A582B] text-white flex items-center justify-center font-semibold text-xs shrink-0">
          {initials}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden leading-tight">
            <span className="text-xs font-semibold text-[#2B231D] truncate">
              {user.name}
            </span>
            <span className="text-[10px] text-[#A0988E] truncate">
              {user.role}
            </span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <button
          type="button"
          onClick={onSignOut}
          className="text-[#A0988E] hover:text-[#9E2A2B] hover:bg-[#FDF2F2] p-1.5 rounded-md transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
