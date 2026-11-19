import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

interface RoleRouteProps {
  allowedRoles: string[];
  redirectPath?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  redirectPath = '/dashboard',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F7FE]">
        <div className="text-sm font-medium text-[#50617A]">Verifying authorization...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const role = user?.role || 'EMPLOYEE';
  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
