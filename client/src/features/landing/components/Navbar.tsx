import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import { useAuth } from '../../auth/hooks/useAuth';

export const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="w-full border-b border-[#E8DFD3] bg-[#F7F4EE]">
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-[#2B231D]">
          Readventure
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <span className="text-sm font-medium text-[#756F68] hover:text-[#2B231D] transition-colors cursor-pointer hidden sm:inline">
            Explore
          </span>
          <span className="text-sm font-medium text-[#756F68] hover:text-[#2B231D] transition-colors cursor-pointer hidden sm:inline">
            About
          </span>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#8A582B] text-[#8A582B] hover:bg-[#8A582B] hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
