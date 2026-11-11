import React from 'react';
import { Link } from 'react-router-dom';
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
}) => {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#2B231D] flex flex-col justify-between px-4 py-8 sm:px-6">
      {/* Centered TF Brand Logo */}
      <header className="flex items-center justify-center mx-auto w-full max-w-[440px] pt-4 pb-6">
        <Link
          to="/signin"
          aria-label="TripFlow Home"
          className="flex size-11 items-center justify-center rounded-2xl bg-[#2B231D] text-white font-bold text-sm shadow-sm ring-1 ring-[#8A582B]/20 transition-opacity hover:opacity-85"
        >
          TF
        </Link>
      </header>

      {/* Centered Form Card Container */}
      <main className="my-auto w-full max-w-[440px] mx-auto py-2">
        {/* Mode Switch Tabs (Sign in / Create account) */}
        {mode ? (
          <div className="mb-6 flex justify-center">
            <AuthModeSwitch currentMode={mode} />
          </div>
        ) : null}

        <div className="rounded-2xl border border-[#E8DFD3] bg-white p-6 sm:p-8 shadow-sm shadow-[#8A582B]/5 text-left">
          {/* Title & Subtitle */}
          <div className="mb-6 text-left">
            <h1 className="text-2xl font-bold tracking-tight text-[#2B231D] sm:text-[26px]">
              {title}
            </h1>
            <p className="mt-1.5 text-xs sm:text-[13px] text-[#756F68] leading-relaxed">
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
      <footer className="pt-8 pb-4 text-center text-xs text-[#A59B90]">
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
};

export default AuthLayout;
