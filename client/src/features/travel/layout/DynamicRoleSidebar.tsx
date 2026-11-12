import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileEdit,
  Pin,
  PinOff,
  PlusCircle,
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
        { id: 'drafts', label: 'Travel Drafts', icon: FileEdit },
      ];
    case 'ADMIN':
      return [
        { id: 'present', label: 'Clearance Queue', icon: ShieldCheck },
        { id: 'revisions', label: 'Revised Requests', icon: GitFork },
        { id: 'past', label: 'Past Requests', icon: Archive },
        { id: 'budgets', label: 'Department Budgets', icon: PieChart },
        { id: 'users', label: 'Team & Access', icon: Users },
      ];
    case 'EMPLOYEE':
    default:
      return [
        { id: 'present', label: 'Present Requests', icon: Plane },
        { id: 'revisions', label: 'Revised Requests', icon: AlertCircle, countType: 'danger' },
        { id: 'drafts', label: 'Travel Drafts', icon: FileEdit },
        { id: 'past', label: 'Past Requests', icon: Archive },
      ];
  }
}

export interface DynamicRoleSidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  // Backward compatibility
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSignOut: () => void;
  badgeCounts?: Record<string, number>;
}

export const DynamicRoleSidebar: React.FC<DynamicRoleSidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  isPinned,
  onTogglePin,
  isCollapsed,
  onToggleCollapse,
  onSignOut,
  badgeCounts = {},
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Reconcile pinned state (prefers isPinned, falls back to !isCollapsed)
  const pinned = isPinned ?? (typeof isCollapsed === 'boolean' ? !isCollapsed : false);
  const handleTogglePin = onTogglePin ?? onToggleCollapse ?? (() => {});

  // Expanded if pinned open OR currently hovered
  const isExpanded = pinned || isHovered;
  const isItemCollapsed = !isExpanded;

  const navItems = getRoleNavItems(user.role || 'EMPLOYEE');
  const canCreate = user.role === 'EMPLOYEE' || user.role === 'MANAGER';

  const roleSubtitle =
    user.role === 'ADMIN'
      ? 'Executive & Finance'
      : user.role === 'MANAGER'
      ? 'Team Manager Hub'
      : 'Employee Portal';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-surface border-r border-border-warm shadow-xs flex flex-col p-3.5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden select-none ${
        isExpanded ? 'w-[256px]' : 'w-[76px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="TripFlow Navigation Sidebar"
    >
      {/* 1. Brand Header */}
      <div className="flex items-center justify-between h-11 shrink-0 px-0.5">
        <button
          type="button"
          onClick={handleTogglePin}
          aria-label={pinned ? 'Collapse sidebar' : 'Expand and pin sidebar'}
          className="flex items-center min-w-0 overflow-hidden cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {/* Logo Monogram */}
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
            TF
          </div>

          {/* Brand Name & Subtitle */}
          {!isItemCollapsed && (
            <div className="flex flex-col min-w-0 ml-2.5 overflow-hidden text-left leading-tight">
              <span className="font-bold text-base text-ink tracking-tight truncate">
                TripFlow
              </span>
              <span className="text-[11px] text-muted truncate mt-0.5">
                {roleSubtitle}
              </span>
            </div>
          )}
        </button>

        {/* Pin Toggle Button */}
        {!isItemCollapsed && (
          <button
            type="button"
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg border cursor-pointer transition-colors shrink-0 ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] ${
              pinned
                ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                : 'border-border-warm text-muted hover:text-ink hover:bg-surface-subtle'
            }`}
            title={pinned ? 'Unpin sidebar (hover-only mode)' : 'Pin sidebar open'}
            aria-label={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          >
            {pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 2. Quick Action: + New Request Button (For Employee & Manager) */}
      {canCreate && (
        <div className="mt-3.5 mb-1.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/travel/new')}
            className={`w-full flex items-center h-10 rounded-lg bg-primary text-white hover:bg-primary-hover font-semibold text-xs transition-all cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] ${
              isItemCollapsed ? 'justify-center px-0' : 'px-1'
            }`}
            title={isItemCollapsed ? 'New Travel Request' : undefined}
          >
            <span className="w-[42px] h-[42px] flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5 text-white" />
            </span>
            {!isItemCollapsed && (
              <span className="truncate font-semibold text-[13px] ml-1 pr-3">
                New Request
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. Section Label */}
      {!isItemCollapsed && (
        <p className="px-2 pt-3 pb-1 text-[11px] font-medium text-faint select-none shrink-0">
          Navigation
        </p>
      )}

      {/* 4. Primary Role Navigation List */}
      <nav className="flex-1 py-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-none">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            count={badgeCounts[item.id] ?? item.count}
            countType={item.countType}
            isActive={activeTab === item.id}
            isCollapsed={isItemCollapsed}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </nav>

      {/* 5. Authenticated Current User Profile Footer */}
      <SidebarUserProfile user={user} isCollapsed={isItemCollapsed} onSignOut={onSignOut} />
    </aside>
  );
};
