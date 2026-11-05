import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '../services/auth.api';
import type { LoginCredentials, RegisterCredentials, User } from '../types/auth.types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signin: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: RegisterCredentials) => Promise<void>;
  signout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const signin = async (credentials: LoginCredentials) => {
    const authenticatedUser = await authApi.signin(credentials);
    setUser(authenticatedUser);
  };

  const signup = async (credentials: RegisterCredentials) => {
    const authenticatedUser = await authApi.signup(credentials);
    setUser(authenticatedUser);
  };

  const signout = async () => {
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
        signin,
        signup,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
