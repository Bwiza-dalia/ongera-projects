import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authService from '../services/authService';
import type { AuthSession, AuthUser, LoginCredentials, SignupData } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    authService.restoreSession().then((next) => {
      if (active) {
        setSession(next);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const next = await authService.login(credentials);
    setSession(next);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const next = await authService.signup(data);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const next = await authService.refreshSession();
    setSession(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isLoading,
      login,
      signup,
      logout,
      refreshSession,
    }),
    [session, isLoading, login, signup, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
