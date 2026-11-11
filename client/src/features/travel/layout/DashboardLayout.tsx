import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { DynamicRoleSidebar } from './DynamicRoleSidebar';

export interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, signout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Compute active tab from query params or route
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'present';

  const handleTabChange = (tabId: string) => {
    // Navigate to /dashboard?tab=<tabId>
    navigate(`/dashboard?tab=${tabId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F4EE] text-[#2B231D]">
      {/* Persistent Dynamic Role Sidebar */}
      <DynamicRoleSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        onSignOut={signout}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children || <Outlet />}
      </main>
    </div>
  );
};
