import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '../services/auth.api';
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth.types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signin: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: RegisterCredentials) => Promise<void>;
  signout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_HINT_KEY = 'tripflow_has_session';

/** Reads a zero-PII boolean flag indicating whether this browser may hold an active session cookie. */
function readSessionHint(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSessionHint(active: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (active) {
      window.localStorage.setItem(SESSION_HINT_KEY, '1');
    } else {
      window.localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // Ignore storage errors (e.g. private mode or restricted storage)
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => readSessionHint());
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hydrate session on app load via /auth/me without blocking unauthenticated visitors
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await authApi.getProfile();
      setUser(currentUser);
      writeSessionHint(true);
    } catch {
      setUser(null);
      writeSessionHint(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signin = async (credentials: LoginCredentials) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authenticatedUser = await authApi.signin(credentials);
      setUser(authenticatedUser);
      writeSessionHint(true);
    } catch (err) {
      const message = (err as Error).message || 'Invalid email or password.';
      setAuthError(message);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signup = async (credentials: RegisterCredentials) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await authApi.signup(credentials);
      // Registration creates the account without establishing an active session.
      // The user must explicitly sign in on /signin with their credentials.
    } catch (err) {
      const message = (err as Error).message || 'Registration failed. Please try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signout = async () => {
    setAuthError(null);
    try {
      await authApi.signout();
    } finally {
      setUser(null);
      writeSessionHint(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthenticating,
        authError,
        clearAuthError,
        signin,
        signup,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
