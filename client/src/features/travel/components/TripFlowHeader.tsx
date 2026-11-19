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
        return 'border-destructive/30 bg-destructive/10 text-destructive';
      case 'MANAGER':
        return 'border-primary/30 bg-primary/10 text-primary';
      case 'EMPLOYEE':
      default:
        return 'border-border-warm bg-surface-subtle text-ink';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-warm bg-surface/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-ink text-white font-bold text-xs shadow-xs ring-1 ring-primary/20">
            TF
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-ink">
              TripFlow
            </span>
          </div>
        </div>

        {/* User Identity & Sign Out */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2.5 text-right">
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-ink leading-tight">
                  {user.name}
                </p>
                {user.department && (
                  <p className="text-[11px] text-muted leading-tight">
                    {user.department}
                  </p>
                )}
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
            className="flex items-center gap-1.5 rounded-xl border border-border-warm bg-canvas px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-warm hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
