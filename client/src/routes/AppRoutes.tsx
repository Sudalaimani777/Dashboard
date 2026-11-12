import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ForgotPasswordCard } from '../features/auth/components/ForgotPasswordCard';
import { ResetPasswordCard } from '../features/auth/components/ResetPasswordCard';
import { SignInCard } from '../features/auth/components/SignInCard';
import { SignUpCard } from '../features/auth/components/SignUpCard';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { DashboardLayout } from '../features/travel/layout/DashboardLayout';
import { NewTravelRequestPage } from '../features/travel/pages/NewTravelRequestPage';
import { ResubmitTravelRequestPage } from '../features/travel/pages/ResubmitTravelRequestPage';
import { ManagerAuditPage } from '../features/travel/pages/ManagerAuditPage';
import { AdminClearancePage } from '../features/travel/pages/AdminClearancePage';
import { TravelDetailPage } from '../features/travel/pages/TravelDetailPage';
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

        {/* Protected Dynamic Role Dashboard & Full-Page Workstations */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/travel/new" element={<NewTravelRequestPage />} />
            <Route path="/travel/requests/:id" element={<TravelDetailPage />} />
            <Route path="/travel/requests/:id/edit" element={<ResubmitTravelRequestPage />} />
            <Route path="/travel/audit/:id" element={<ManagerAuditPage />} />
            <Route path="/travel/clearance/:id" element={<AdminClearancePage />} />
          </Route>
        </Route>

        {/* Default Entry & Fallbacks: Direct to Dynamic Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
