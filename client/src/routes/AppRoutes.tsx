import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

/** Lazy-loads a named export from a module for route-level code splitting. */
function lazyNamed<T extends Record<string, React.ComponentType<any>>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K,
) {
  return lazy(() => loader().then((mod) => ({ default: mod[exportName] })));
}

const SignInCard = lazyNamed(() => import('../features/auth/components/SignInCard'), 'SignInCard');
const SignUpCard = lazyNamed(() => import('../features/auth/components/SignUpCard'), 'SignUpCard');
const ForgotPasswordCard = lazyNamed(
  () => import('../features/auth/components/ForgotPasswordCard'),
  'ForgotPasswordCard',
);
const ResetPasswordCard = lazyNamed(
  () => import('../features/auth/components/ResetPasswordCard'),
  'ResetPasswordCard',
);

const DashboardLayout = lazyNamed(() => import('../features/travel/layout/DashboardLayout'), 'DashboardLayout');
const DashboardPage = lazyNamed(() => import('../features/dashboard/DashboardPage'), 'DashboardPage');
const NewTravelRequestPage = lazyNamed(
  () => import('../features/travel/pages/NewTravelRequestPage'),
  'NewTravelRequestPage',
);
const ResubmitTravelRequestPage = lazyNamed(
  () => import('../features/travel/pages/ResubmitTravelRequestPage'),
  'ResubmitTravelRequestPage',
);
const ManagerAuditPage = lazyNamed(() => import('../features/travel/pages/ManagerAuditPage'), 'ManagerAuditPage');
const AdminClearancePage = lazyNamed(
  () => import('../features/travel/pages/AdminClearancePage'),
  'AdminClearancePage',
);
const TravelDetailPage = lazyNamed(() => import('../features/travel/pages/TravelDetailPage'), 'TravelDetailPage');

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE]">
    <div className="text-sm font-medium text-[#756F68]">Loading TripFlow...</div>
  </div>
);

const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);
  return null;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback />}>
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
      </Suspense>
    </BrowserRouter>
  );
};
