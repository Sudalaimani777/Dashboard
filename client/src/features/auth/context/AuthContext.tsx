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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hydrate session on app load via /auth/me
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await authApi.getProfile();
      setUser(currentUser);
    } catch {
      setUser(null);
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
