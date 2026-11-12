import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  error?: string | null;
  onClearError?: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  error,
  onClearError,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between px-4 py-8 sm:px-6">
      {/* Wordmark Header */}
      <header className="flex items-center justify-center mx-auto w-full max-w-[440px] pt-4 pb-6">
        <Link
          to="/signin"
          aria-label="TripFlow Home"
          className="inline-flex items-center gap-2.5 rounded-xl px-2 py-1 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-white font-bold text-md tracking-wide shadow-2xs">
            TF
          </span>
        </Link>
      </header>

      {/* Centered Form Container */}
      <main className="my-auto w-full max-w-[440px] mx-auto py-2">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl border border-border-warm bg-surface p-6 sm:p-8 shadow-xs text-left"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[26px]">
              {title}
            </h1>
            <p className="mt-1.5 text-xs sm:text-[13px] text-muted leading-relaxed">
              {subtitle}
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="flex-1 font-medium">{error}</div>
              {onClearError ? (
                <button
                  type="button"
                  onClick={onClearError}
                  aria-label="Dismiss error"
                  className="p-0.5 rounded-md text-destructive/80 hover:text-destructive cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}

          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="pt-8 pb-4 text-center text-xs text-faint">
        <span>TripFlow © 2026 · Corporate Travel &amp; Expense</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
