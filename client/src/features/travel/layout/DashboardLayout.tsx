import React, { useState, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTravel } from '../hooks/useTravel';
import { DynamicRoleSidebar } from './DynamicRoleSidebar';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import { classifyManagerQueue } from '../utils/managerQueue';

export interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signout } = useAuth();
  const { requests, managerQueue, adminQueue } = useTravel();
  const [isPinned, setIsPinned] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const location = useLocation();
  const navigate = useNavigate();

  // Compute active tab from query params or route
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'present';

  const badgeCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
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
  }, [user, requests, managerQueue, adminQueue]);

  const handleTabChange = (tabId: string) => {
    navigate(`/dashboard?tab=${tabId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] w-full overflow-hidden bg-canvas text-ink relative">
      {/* Floating Dynamic Role Sidebar */}
      <DynamicRoleSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isPinned={isPinned}
        onTogglePin={() => setIsPinned((prev) => !prev)}
        onSignOut={signout}
        badgeCounts={badgeCounts}
      />

      {/* Main View Area */}
      <main
        className={`flex-1 overflow-y-auto min-w-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isPinned ? 'pl-[256px]' : 'pl-[76px]'
        }`}
      >
        <div className="px-6 py-5">
          <ErrorBoundary fallbackTitle="Workstation Error" fallbackMessage="There was a problem loading this workstation view. Try reloading or return to the dashboard.">
            {children || <Outlet />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
