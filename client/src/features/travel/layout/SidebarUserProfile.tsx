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

  const roleLabel =
    user.role === 'ADMIN'
      ? 'Executive & Finance'
      : user.role === 'MANAGER'
      ? 'Line Manager'
      : 'Employee';

  return (
    <div className="mt-auto pt-3 border-t border-border-warm flex items-center justify-between shrink-0 select-none">
      <div
        className="flex items-center min-w-0 overflow-hidden cursor-pointer"
        title={isCollapsed ? `${user.name} (${roleLabel})` : undefined}
      >
        {/* 36px Circular Initials Avatar matching reference */}
        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
          {initials}
        </div>

        {/* User Details (Smoothly masked when collapsed) */}
        {!isCollapsed && (
          <div className="flex flex-col min-w-0 ml-2.5 overflow-hidden text-left leading-tight">
            <span className="text-[13px] font-semibold text-ink truncate">
              {user.name}
            </span>
            <span className="text-[11px] text-muted truncate mt-0.5">
              {roleLabel}
            </span>
          </div>
        )}
      </div>

      {/* Logout Action Button */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={onSignOut}
          className="p-1.5 text-muted hover:text-destructive hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
          title="Sign Out of TripFlow"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
