import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SidebarNavItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number | null;
  countType?: 'warning' | 'danger';
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  label,
  icon: Icon,
  count,
  countType = 'warning',
  isActive,
  isCollapsed,
  onClick,
}) => {
  const hasCount = typeof count === 'number' && count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex items-center h-10 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer select-none border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        isActive
          ? 'bg-primary/10 border-primary/25 text-primary font-semibold'
          : 'border-transparent text-muted hover:bg-surface-subtle hover:text-ink'
      }`}
      title={isCollapsed ? label : undefined}
    >
      {/* Icon Wrapper (exact 42px centered container matching reference) */}
      <span className="w-[42px] h-[42px] flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted'}`} />
      </span>

      {/* Label Text (Smoothly masked when collapsed) */}
      {!isCollapsed && (
        <span className="truncate flex-1 font-medium text-[13.5px] ml-1 pr-2">
          {label}
        </span>
      )}

      {/* Badge Pill when Expanded */}
      {!isCollapsed && hasCount && (
        <span
          className={`shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full border mr-2.5 transition-all ${
            countType === 'danger'
              ? 'bg-red-50 text-destructive border-red-200/80'
              : 'bg-amber-50 text-amber-800 border-amber-200/80'
          }`}
        >
          {count}
        </span>
      )}

      {/* Subtle Notification Dot when Collapsed */}
      {isCollapsed && hasCount && (
        <span
          className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ring-2 ring-surface ${
            countType === 'danger' ? 'bg-destructive' : 'bg-amber-600'
          }`}
        />
      )}
    </button>
  );
};
