'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  AuthResponse,
  AuthUser,
  fetchCurrentUser,
  requestLoginOtp,
  verifyLoginOtp,
  logout as logoutRequest,
  registerWithEmail,
} from '@/lib/auth';

export type AuthModalMode = 'login' | 'register';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (mobile: string, password: string) => Promise<AuthResponse>;
  verifyOtp: (
    mobile: string,
    password: string,
    referenceNo: string,
    otp: string
  ) => Promise<AuthResponse>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  authModalMode: AuthModalMode;
  isAuthModalOpen: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] =
    useState<AuthModalMode>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchCurrentUser();
      setUser(response.user);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Unable to load session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (mobile: string, password: string) => {
    setLoading(true);
    try {
      const response = await requestLoginOtp(mobile, password);
      if (response.user) {
        setUser(response.user);
      }
      setError(null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(
    async (mobile: string, password: string, referenceNo: string, otp: string) => {
      setLoading(true);
      try {
        const response = await verifyLoginOtp(mobile, password, referenceNo, otp);
        if (response.user) {
          setUser(response.user);
        }
        setError(null);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'OTP verification failed.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
  []);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await registerWithEmail(email, password);
      setUser(response.user);
      setError(null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await logoutRequest();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openAuthModal = useCallback((mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      verifyOtp,
      register,
      logout,
      refresh,
      openAuthModal,
      closeAuthModal,
      authModalMode,
      isAuthModalOpen,
    }),
    [
      user,
      loading,
      error,
      login,
      verifyOtp,
      register,
      logout,
      refresh,
      openAuthModal,
      closeAuthModal,
      authModalMode,
      isAuthModalOpen,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
