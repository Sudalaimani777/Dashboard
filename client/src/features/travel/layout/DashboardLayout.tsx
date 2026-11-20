import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { DynamicRoleSidebar } from './DynamicRoleSidebar';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { classifyManagerQueue } from '../utils/managerQueue';
import { ToastProvider } from '../../../shared/context/ToastContext';
import { useNotifications, NotificationProvider } from '../../notifications/hooks/useNotifications';
import { NotificationsHubPage } from '../../notifications/pages/NotificationsHubPage';

export interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayoutContent: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signout } = useAuth();
  const { requests, managerQueue, adminQueue } = useTravel();
  const { unreadCount, hasActionRequired } = useNotifications();
  const [isPinned, setIsPinned] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  // Compute active tab from query params or route
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'present';

  const badgeCounts: Record<string, any> = useMemo(() => {
    const counts: Record<string, any> = {
      notifications: unreadCount,
      notificationsDanger: hasActionRequired,
    };
    if (!user) return counts;
    if (user.role === 'EMPLOYEE') {
      counts.revisions = requests.filter((r) => r.status.includes('REVISION_REQUESTED')).length;
      counts.drafts = requests.filter((r) => r.status === 'DRAFT').length;
    } else if (user.role === 'MANAGER') {
      const classified = classifyManagerQueue(managerQueue, user.id);
      counts.present = classified.initialAudit.length;
      counts.revisions = classified.revisions.length;
      counts.drafts = requests.filter((r) => r.status === 'DRAFT').length;
    } else if (user.role === 'ADMIN') {
      counts.present = adminQueue.filter((r) => r.status === 'PENDING_ADMIN_APPROVAL').length;
      counts.revisions = adminQueue.filter((r) => r.status.includes('REVISION')).length;
    }
    return counts;
  }, [user, requests, managerQueue, adminQueue, unreadCount, hasActionRequired]);

  const handleTabChange = (tabId: string) => {
    navigate(`/dashboard?tab=${tabId}`);
  };

  const isNotificationsTab = activeTab === 'notifications';

  const activeWorkspaceTitle = useMemo(() => {
    if (isNotificationsTab) return 'Notifications';
    if (user?.role === 'ADMIN') {
      if (activeTab === 'users') return 'Team & Access';
      if (activeTab === 'budgets') return 'Department Budgets';
      return 'Travel Governance';
    }
    if (user?.role === 'MANAGER') {
      if (activeTab === 'personal') return 'My Travel';
      if (activeTab === 'team-analytics') return 'Team Analytics';
      if (activeTab === 'spend-analytics') return 'Spend Analytics';
      return 'Team Approvals';
    }
    if (activeTab === 'analytics') return 'Spend Analytics';
    return 'My Travel';
  }, [user, activeTab, isNotificationsTab]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full overflow-hidden bg-canvas text-ink relative">
      {/* Sticky Mobile Header (<lg) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex h-14 w-full items-center justify-between border-b border-border-warm bg-surface/90 px-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-warm bg-surface text-ink hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
              TF
            </div>
            <span className="font-bold text-sm text-ink truncate max-w-[200px] sm:max-w-md">
              {activeWorkspaceTitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('notifications')}
            aria-label="View notifications"
            className="relative p-2 rounded-lg border border-border-warm bg-surface text-muted hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-surface" />
            )}
          </button>
        </div>
      </header>

      {/* Floating Dynamic Role Sidebar */}
      <DynamicRoleSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isPinned={isPinned}
        onTogglePin={() => setIsPinned((prev) => !prev)}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
        onSignOut={signout}
        badgeCounts={badgeCounts}
      />

      {/* Main View Area */}
      <main
        ref={mainScrollRef}
        className={`flex-1 overflow-y-auto min-w-0 pt-14 lg:pt-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isPinned ? 'lg:pl-[256px]' : 'lg:pl-[76px]'
        }`}
      >
        <div className="px-3.5 py-4 sm:px-6 sm:py-5">
          <ErrorBoundary
            fallbackTitle="Workstation Error"
            fallbackMessage="There was a problem loading this workstation view. Try reloading or return to the dashboard."
          >
            {isNotificationsTab ? <NotificationsHubPage /> : children || <Outlet />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
  return (
    <ToastProvider>
      <NotificationProvider>
        <DashboardLayoutContent {...props} />
      </NotificationProvider>
    </ToastProvider>
  );
};
