import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface AuthModeSwitchProps {
  currentMode: 'sign-in' | 'sign-up';
}

export const AuthModeSwitch: React.FC<AuthModeSwitchProps> = ({ currentMode }) => {
  const location = useLocation();
  const isSignIn = currentMode === 'sign-in' || location.pathname === '/signin';

  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className="inline-flex w-full max-w-[380px] items-center rounded-xl border border-border-warm bg-surface-subtle p-1 text-xs font-semibold"
    >
      <Link
        to="/signin"
        role="tab"
        aria-selected={isSignIn}
        className={`flex-1 rounded-lg py-2 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          isSignIn
            ? 'bg-surface text-ink shadow-xs font-bold'
            : 'text-muted hover:text-ink'
        }`}
      >
        Sign in
      </Link>
      <Link
        to="/signup"
        role="tab"
        aria-selected={!isSignIn}
        className={`flex-1 rounded-lg py-2 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          !isSignIn
            ? 'bg-surface text-ink shadow-xs font-bold'
            : 'text-muted hover:text-ink'
        }`}
      >
        Create account
      </Link>
    </div>
  );
};
