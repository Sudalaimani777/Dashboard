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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none text-left ${
        isActive
          ? 'bg-[#F5EBE1] text-[#8A582B] font-semibold'
          : 'text-[#756F68] hover:bg-[#FAF8F5] hover:text-[#2B231D]'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </div>

      {!isCollapsed && typeof count === 'number' && count > 0 && (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            countType === 'danger'
              ? 'bg-[#FDF2F2] text-[#9E2A2B] border-red-200'
              : 'bg-[#FEF9E7] text-[#B9770E] border-amber-200'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
