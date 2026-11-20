import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  Users,
  ShieldCheck,
  PieChart,
  BarChart3,
  Pin,
  PinOff,
  PlusCircle,
  UserPlus,
  Bell,
  X,
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
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'team', label: 'Team Approvals', icon: Users },
        { id: 'personal', label: 'My Travel', icon: Plane },
        { id: 'team-analytics', label: 'Team Analytics', icon: BarChart3 },
        { id: 'spend-analytics', label: 'Spend Analytics', icon: PieChart },
      ];
    case 'ADMIN':
      return [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'governance', label: 'Travel Governance', icon: ShieldCheck },
        { id: 'users', label: 'Team & Access', icon: Users },
        { id: 'budgets', label: 'Department Budgets', icon: PieChart },
      ];
    case 'EMPLOYEE':
    default:
      return [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'trips', label: 'My Travel', icon: Plane },
        { id: 'analytics', label: 'Spend Analytics', icon: PieChart },
      ];
  }
}

export interface QuickActionConfig {
  label: string;
  tooltip: string;
  icon: LucideIcon;
  path: string;
}

export function getRoleQuickAction(role: string): QuickActionConfig {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Add Member',
        tooltip: 'Add Team Member',
        icon: UserPlus,
        path: '/admin/users/new',
      };
    case 'MANAGER':
    case 'EMPLOYEE':
    default:
      return {
        label: 'New Request',
        tooltip: 'New Travel Request',
        icon: PlusCircle,
        path: '/travel/new',
      };
  }
}

export interface DynamicRoleSidebarProps {
  user: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  // Mobile drawer support
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  // Backward compatibility
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSignOut: () => void;
  badgeCounts?: Record<string, any>;
}

export const DynamicRoleSidebar: React.FC<DynamicRoleSidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  isPinned,
  onTogglePin,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
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
  const quickAction = getRoleQuickAction(user.role || 'EMPLOYEE');

  const roleSubtitle =
    user.role === 'ADMIN'
      ? 'Executive & Finance'
      : user.role === 'MANAGER'
      ? 'Team Manager Hub'
      : 'Employee Portal';

  return (
    <>
      {/* Desktop Mode (lg:flex, hidden on mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-surface border-r border-border-warm shadow-xs hidden lg:flex flex-col p-3.5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden select-none ${
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
            className="flex items-center flex-1 min-w-0 cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 mr-2"
          >
            {/* Logo Monogram */}
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
              TF
            </div>

            {/* Brand Name & Subtitle */}
            {!isItemCollapsed && (
              <div className="flex flex-col min-w-0 ml-2.5 text-left leading-tight">
                <span className="font-bold text-base text-ink tracking-tight whitespace-nowrap">
                  TripFlow
                </span>
                <span className="text-[11px] text-muted whitespace-nowrap mt-0.5">
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

        {/* 2. Quick Action CTA Button (New Request for Employee/Manager, Add Member for Admin) */}
        <div className="mt-3.5 mb-1.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate(quickAction.path)}
            className={`w-full flex items-center h-10 rounded-lg bg-primary text-white hover:bg-primary-hover font-semibold text-xs transition-all cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] ${
              isItemCollapsed ? 'justify-center px-0' : 'px-1'
            }`}
            title={isItemCollapsed ? quickAction.tooltip : undefined}
            aria-label={quickAction.tooltip}
          >
            <span className="w-[42px] h-[42px] flex items-center justify-center shrink-0">
              <quickAction.icon className="w-5 h-5 text-white" />
            </span>
            {!isItemCollapsed && (
              <span className="truncate font-semibold text-[13px] ml-1 pr-3">
                {quickAction.label}
              </span>
            )}
          </button>
        </div>

        {/* 3. Section Label */}
        {!isItemCollapsed && (
          <p className="px-2 pt-3 pb-1 text-[11px] font-medium text-faint select-none shrink-0">
            Navigation
          </p>
        )}

        {/* 4. Primary Role Navigation List */}
        <nav className="flex-1 py-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-none">
          {navItems.map((item) => {
            const isNotif = item.id === 'notifications';
            const count = isNotif
              ? (Number(badgeCounts['notifications']) || 0)
              : (badgeCounts[item.id] ?? item.count);
            const countType = isNotif
              ? (badgeCounts['notificationsDanger'] || badgeCounts['hasRevisions'] ? 'danger' : 'warning')
              : item.countType;

            return (
              <SidebarNavItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                count={count}
                countType={countType}
                isActive={activeTab === item.id}
                isCollapsed={isItemCollapsed}
                onClick={() => onTabChange(item.id)}
              />
            );
          })}
        </nav>

        {/* 5. Authenticated Current User Profile Footer */}
        <SidebarUserProfile user={user} isCollapsed={isItemCollapsed} onSignOut={onSignOut} />
      </aside>

      {/* Mobile Drawer Mode (<lg viewports) */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileDrawer}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <aside
            className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-surface border-r border-border-warm shadow-2xl flex flex-col p-4 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] select-none animate-in slide-in-from-left duration-200"
            aria-label="Mobile Navigation Menu"
          >
            {/* Mobile Header with Monogram, App Title & Close Button */}
            <div className="flex items-center justify-between h-11 shrink-0 px-0.5 mb-2">
              <div className="flex items-center min-w-0 mr-2">
                <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                  TF
                </div>
                <div className="flex flex-col min-w-0 ml-2.5 text-left leading-tight">
                  <span className="font-bold text-base text-ink tracking-tight whitespace-nowrap">
                    TripFlow
                  </span>
                  <span className="text-[11px] text-muted whitespace-nowrap mt-0.5">
                    {roleSubtitle}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="p-2 text-muted hover:text-ink hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action CTA Button */}
            <div className="mt-1 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigate(quickAction.path);
                  onCloseMobileDrawer?.();
                }}
                className="w-full flex items-center h-10 px-3 rounded-lg bg-primary text-white hover:bg-primary-hover font-semibold text-xs transition-all cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98]"
                aria-label={quickAction.tooltip}
              >
                <quickAction.icon className="w-5 h-5 text-white shrink-0 mr-2.5" />
                <span className="truncate font-semibold text-[13px]">
                  {quickAction.label}
                </span>
              </button>
            </div>

            {/* Section Label */}
            <p className="px-2 pt-2 pb-1 text-[11px] font-medium text-faint select-none shrink-0">
              Navigation
            </p>

            {/* Full Role Navigation List */}
            <nav className="flex-1 py-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-none">
              {navItems.map((item) => {
                const isNotif = item.id === 'notifications';
                const count = isNotif
                  ? (Number(badgeCounts['notifications']) || 0)
                  : (badgeCounts[item.id] ?? item.count);
                const countType = isNotif
                  ? (badgeCounts['notificationsDanger'] || badgeCounts['hasRevisions'] ? 'danger' : 'warning')
                  : item.countType;

                return (
                  <SidebarNavItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    icon={item.icon}
                    count={count}
                    countType={countType}
                    isActive={activeTab === item.id}
                    isCollapsed={false}
                    onClick={() => {
                      onTabChange(item.id);
                      onCloseMobileDrawer?.();
                    }}
                  />
                );
              })}
            </nav>

            {/* Authenticated Current User Profile Footer (Always Expanded with Sign Out) */}
            <SidebarUserProfile
              user={user}
              isCollapsed={false}
              isDrawerMode={true}
              onSignOut={() => {
                onCloseMobileDrawer?.();
                onSignOut();
              }}
            />
          </aside>
        </div>
      )}
    </>
  );
};
