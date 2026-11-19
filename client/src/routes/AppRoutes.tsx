import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

/** Lazy-loads a named export from a module for route-level code splitting. */
function lazyNamed<T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K,
) {
  return lazy(() => loader().then((mod) => ({ default: mod[exportName] as React.ComponentType<any> })));
}

const SignInCard = lazyNamed(() => import('../features/auth/components/SignInCard'), 'SignInCard');
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
const TravelDetailPage = lazyNamed(() => import('../features/travel/pages/TravelDetailPage'), 'TravelDetailPage');
const NewUserPage = lazyNamed(() => import('../features/users/pages/NewUserPage'), 'NewUserPage');

const LegacyTravelReviewRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  return <Navigate to={`/travel/requests/${id}${location.search}`} replace />;
};

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F2F7FE]">
    <div className="text-sm font-medium text-[#50617A]">Loading TripFlow...</div>
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
          <Route path="/signup" element={<Navigate to="/signin" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordCard />} />
          <Route path="/reset-password" element={<ResetPasswordCard />} />

          {/* Protected Dynamic Role Dashboard & Full-Page Workstations */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/travel/new" element={<NewTravelRequestPage />} />
              <Route path="/travel/requests/:id" element={<TravelDetailPage />} />
              <Route path="/travel/requests/:id/edit" element={<ResubmitTravelRequestPage />} />
              <Route path="/travel/audit/:id" element={<LegacyTravelReviewRedirect />} />
              <Route path="/travel/clearance/:id" element={<LegacyTravelReviewRedirect />} />
              <Route path="/admin/users/new" element={<NewUserPage />} />
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
