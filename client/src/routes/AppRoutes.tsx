import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ForgotPasswordCard } from '../features/auth/components/ForgotPasswordCard';
import { ResetPasswordCard } from '../features/auth/components/ResetPasswordCard';
import { SignInCard } from '../features/auth/components/SignInCard';
import { SignUpCard } from '../features/auth/components/SignUpCard';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding & Authentication */}
        <Route path="/signin" element={<SignInCard />} />
        <Route path="/signup" element={<SignUpCard />} />
        <Route path="/forgot-password" element={<ForgotPasswordCard />} />
        <Route path="/reset-password" element={<ResetPasswordCard />} />

        {/* Protected Dynamic Role Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Default Entry & Fallbacks: Direct to Dynamic Dashboard (which redirects unauthenticated users to /signin) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
