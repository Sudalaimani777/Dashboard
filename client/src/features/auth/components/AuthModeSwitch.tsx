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
      className="inline-flex w-full max-w-[380px] items-center rounded-xl bg-[#EFEBE4] p-1 text-xs font-semibold"
    >
      <Link
        to="/signin"
        role="tab"
        aria-selected={isSignIn}
        className={`flex-1 rounded-lg py-2 text-center transition-all duration-150 ${
          isSignIn
            ? 'bg-white text-[#2B231D] shadow-xs font-bold'
            : 'text-[#756F68] hover:text-[#2B231D]'
        }`}
      >
        Sign in
      </Link>
      <Link
        to="/signup"
        role="tab"
        aria-selected={!isSignIn}
        className={`flex-1 rounded-lg py-2 text-center transition-all duration-150 ${
          !isSignIn
            ? 'bg-white text-[#2B231D] shadow-xs font-bold'
            : 'text-[#756F68] hover:text-[#2B231D]'
        }`}
      >
        Create account
      </Link>
    </div>
  );
};
