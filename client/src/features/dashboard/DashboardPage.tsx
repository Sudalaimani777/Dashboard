import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import { TravelProvider } from '../travel/context/TravelContext';
import { TripFlowHeader } from '../travel/components/TripFlowHeader';
import { EmployeeTravelPortal } from '../travel/components/EmployeeTravelPortal';
import { ManagerQueuePortal } from '../travel/components/ManagerQueuePortal';
import { AdminGovernancePortal } from '../travel/components/AdminGovernancePortal';
import { AlertCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, signout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignout = async () => {
    await signout();
    navigate('/signin', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#2B231D] text-white font-bold text-xs shadow-sm ring-1 ring-[#8A582B]/20 animate-pulse">
            TF
          </div>
          <p className="text-xs font-medium text-[#756F68]">Loading TripFlow workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderRolePortal = () => {
    switch (user.role) {
      case 'EMPLOYEE':
        return <EmployeeTravelPortal user={user} />;
      case 'MANAGER':
        return <ManagerQueuePortal user={user} />;
      case 'ADMIN':
        return <AdminGovernancePortal user={user} />;
      default:
        return (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 text-left">
            <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="size-5" />
                <h2 className="text-sm font-bold">Unrecognized User Role</h2>
              </div>
              <p className="text-xs text-[#756F68] leading-relaxed">
                Your account role <code className="font-mono bg-red-50 px-1 py-0.5 rounded text-red-700">{user.role}</code> is not assigned to a known governance workspace. Please contact your administrator.
              </p>
              <button
                type="button"
                onClick={handleSignout}
                className="mt-4 rounded-xl border border-[#E8DFD3] bg-[#F7F4EE] px-4 py-2 text-xs font-semibold text-[#2B231D] hover:bg-white transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <TravelProvider>
      <div className="min-h-screen bg-[#F7F4EE] flex flex-col text-[#2B231D] antialiased">
        <TripFlowHeader user={user} onSignOut={handleSignout} />
        <main className="flex-1">{renderRolePortal()}</main>
      </div>
    </TravelProvider>
  );
};
