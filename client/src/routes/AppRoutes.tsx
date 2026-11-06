import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ForgotPasswordCard } from '../features/auth/components/ForgotPasswordCard';
import { ResetPasswordCard } from '../features/auth/components/ResetPasswordCard';
import { SignInCard } from '../features/auth/components/SignInCard';
import { SignUpCard } from '../features/auth/components/SignUpCard';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LandingPage } from '../features/landing/LandingPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInCard />} />
        <Route path="/signup" element={<SignUpCard />} />
        <Route path="/forgot-password" element={<ForgotPasswordCard />} />
        <Route path="/reset-password" element={<ResetPasswordCard />} />

        {/* Protected Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
};
