import React from 'react';
import {
  Plane,
  AlertCircle,
  Archive,
  Inbox,
  RotateCcw,
  Users,
  UserCheck,
  ShieldCheck,
  GitFork,
  PieChart,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import type { User } from '../../auth/types/auth.types';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserProfile } from './SidebarUserProfile';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number | null;
  countType?: 'warning' | 'danger';
}

export function getRoleNavItems(role: string): NavItemConfig[] {
  switch (role) {
    case 'MANAGER':
      return [
        { id: 'present', label: 'Team Audit Queue', icon: Inbox },
        { id: 'revisions', label: 'Revised Requests', icon: RotateCcw, countType: 'danger' },
        { id: 'past', label: 'Past Team History', icon: Users },
        { id: 'personal', label: 'My Personal Travel', icon: UserCheck },
      ];
    case 'ADMIN':
      return [
        { id: 'present', label: 'Clearance Queue', icon: ShieldCheck },
        { id: 'revisions', label: 'Revised Requests', icon: GitFork },
        { id: 'past', label: 'Past Requests', icon: Archive },
        { id: 'budgets', label: 'Department Budgets', icon: PieChart },
      ];
    case 'EMPLOYEE':
    default:
      return [
        { id: 'present', label: 'Present Requests', icon: Plane },
        { id: 'revisions', label: 'Revised Requests', icon: AlertCircle, countType: 'danger' },
        { id: 'past', label: 'Past Requests', icon: Archive },
      ];
  }
}

export interface DynamicRoleSidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
  badgeCounts?: Record<string, number>;
}

export const DynamicRoleSidebar: React.FC<DynamicRoleSidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  onSignOut,
  badgeCounts = {},
}) => {
  const navItems = getRoleNavItems(user.role || 'EMPLOYEE');

  return (
    <aside
      className={`bg-white border-r border-[#E8DFD3] flex flex-col shrink-0 transition-all duration-200 z-40 h-full ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E8DFD3] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#2B231D] text-white flex items-center justify-center font-bold text-sm shrink-0">
            TF
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <span className="font-bold text-base text-[#2B231D] tracking-tight">TripFlow</span>
              {/* <span className="text-[10px] text-[#A0988E] uppercase tracking-wider font-semibold">
                Governance
              </span> */}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-[#756F68] hover:text-[#2B231D] hover:bg-[#FAF8F5] p-1 rounded-md border border-[#E8DFD3]"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Chip */}
      {/* {!isCollapsed && (
        <div className="px-4 pt-3.5 pb-1">
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#F5EBE1] text-[#8A582B] border border-[#E8DFD3]">
            Role: {user.role}
          </span>
        </div>
      )} */}

      {/* Nav List */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {/* {!isCollapsed && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0988E] px-2.5 py-1">
            Navigatio
          </div>
        )} */}
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            count={badgeCounts[item.id] ?? item.count}
            countType={item.countType}
            isActive={activeTab === item.id}
            isCollapsed={isCollapsed}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </nav>

      {/* Footer Profile */}
      <SidebarUserProfile user={user} isCollapsed={isCollapsed} onSignOut={onSignOut} />
    </aside>
  );
};
