import React from 'react';
import { Link } from 'react-router-dom';
import { AuthBrandPanel } from './AuthBrandPanel';
import { AuthModeSwitch } from './AuthModeSwitch';
import { AlertCircle } from 'lucide-react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  mode?: 'sign-in' | 'sign-up' | null;
  title: string;
  subtitle: string;
  error?: string | null;
  onClearError?: () => void;
  showBrandPanel?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  mode,
  title,
  subtitle,
  error,
  onClearError,
  showBrandPanel = true,
}) => {
  // Centered single-column layout for Forgot / Reset Password pages
  if (!showBrandPanel) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-[#2B231D] flex flex-col justify-between px-4 py-8 sm:px-8">
        {/* Centered Form Card Container */}
        <main className="my-auto w-full max-w-[460px] mx-auto py-6">
          <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6 sm:p-9 shadow-sm shadow-[#8A582B]/5">
            {/* Title & Subtitle */}
            <div className="mb-6 text-left">
              <h1 className="text-2xl font-bold tracking-tight text-[#2B231D] sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-xs sm:text-[13px] text-[#756F68] leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Error Banner */}
            {error ? (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 shadow-xs"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <div className="flex-1 font-medium">{error}</div>
                {onClearError ? (
                  <button
                    type="button"
                    onClick={onClearError}
                    aria-label="Dismiss error"
                    className="text-red-500 hover:text-red-800 cursor-pointer"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Active Content */}
            {children}
          </div>
        </main>

        {/* Bottom Footer Notice */}
        <footer className="pt-8 text-center text-xs text-[#A59B90]">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>TripFlow Governance © 2026</span>
            <span>·</span>
            <a href="#privacy" className="hover:text-[#2B231D] transition-colors">
              Privacy Policy
            </a>
            <span>·</span>
            <a href="#terms" className="hover:text-[#2B231D] transition-colors">
              Terms of Service
            </a>
          </div>
        </footer>
      </div>
    );
  }

  // Split-screen layout with right brand panel (Sign-in / Sign-up)
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#2B231D]">
      <div className="grid min-h-screen w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Left Interactive Column */}
        <main className="flex min-h-screen flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
          {/* Top Bar */}
          <header className="flex items-center justify-between pb-6">
            <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#2B231D] text-white font-bold text-xs shadow-sm ring-1 ring-[#8A582B]/20">
                TF
              </div>
              <span className="text-base font-bold tracking-tight text-[#2B231D]">TripFlow</span>
            </Link>

            <a
              href="mailto:support@tripflow.internal"
              className="text-xs font-medium text-[#756F68] transition-colors hover:text-[#2B231D]"
            >
              Need help?
            </a>
          </header>

          {/* Form Core Container */}
          <div className="mx-auto w-full max-w-[420px] py-4">
            {/* Mode Switch Tabs (Sign in / Create account) */}
            {mode ? (
              <div className="mb-8">
                <AuthModeSwitch currentMode={mode} />
              </div>
            ) : null}

            {/* Title & Subtitle */}
            <div className="mb-6 text-left">
              <h1 className="text-2xl font-bold tracking-tight text-[#2B231D] sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-xs sm:text-[13px] text-[#756F68] leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Error Banner */}
            {error ? (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 shadow-xs"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <div className="flex-1 font-medium">{error}</div>
                {onClearError ? (
                  <button
                    type="button"
                    onClick={onClearError}
                    aria-label="Dismiss error"
                    className="text-red-500 hover:text-red-800 cursor-pointer"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Active Form */}
            {children}
          </div>

          {/* Bottom Footer Notice */}
          <footer className="pt-8 text-center text-xs text-[#A59B90] lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:justify-start">
              <span>TripFlow Governance © 2026</span>
              <span>·</span>
              <a href="#privacy" className="hover:text-[#2B231D] transition-colors">
                Privacy Policy
              </a>
              <span>·</span>
              <a href="#terms" className="hover:text-[#2B231D] transition-colors">
                Terms of Service
              </a>
            </div>
          </footer>
        </main>

        {/* Right Executive Brand & Headroom Panel */}
        <AuthBrandPanel />
      </div>
    </div>
  );
};

export default AuthLayout;
