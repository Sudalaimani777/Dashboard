import React, { Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { AlertCircle } from 'lucide-react';

const EmployeeTravelPortal = lazy(() =>
  import('../travel/components/EmployeeTravelPortal').then((m) => ({ default: m.EmployeeTravelPortal })),
);
const ManagerQueuePortal = lazy(() =>
  import('../travel/components/ManagerQueuePortal').then((m) => ({ default: m.ManagerQueuePortal })),
);
const AdminGovernancePortal = lazy(() =>
  import('../travel/components/AdminGovernancePortal').then((m) => ({ default: m.AdminGovernancePortal })),
);

const PortalLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#2B231D] text-white font-bold text-xs shadow-sm ring-1 ring-[#8A582B]/20 animate-pulse">
        TF
      </div>
      <p className="text-xs font-medium text-[#756F68]">Loading TripFlow workspace...</p>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'present';

  if (isLoading) {
    return <PortalLoadingFallback />;
  }

  if (!user) {
    return null;
  }

  const renderPortal = () => {
    switch (user.role) {
      case 'EMPLOYEE':
        return <EmployeeTravelPortal activeTab={activeTab} />;
      case 'MANAGER':
        return <ManagerQueuePortal activeTab={activeTab} />;
      case 'ADMIN':
        return <AdminGovernancePortal activeTab={activeTab} />;
      default:
        return (
          <div className="min-h-[60vh] flex items-center justify-center p-6 text-left">
            <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="size-5" />
                <h2 className="text-sm font-bold">Unrecognized User Role</h2>
              </div>
              <p className="text-xs text-[#756F68] leading-relaxed">
                Your account role <code className="font-mono bg-red-50 px-1 py-0.5 rounded text-red-700">{user.role}</code> is not assigned to a known governance workspace. Please contact your administrator.
              </p>
            </div>
          </div>
        );
    }
  };

  return <Suspense fallback={<PortalLoadingFallback />}>{renderPortal()}</Suspense>;
};
