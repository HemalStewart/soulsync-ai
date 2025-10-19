'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getCoinBalance } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthContext';

interface CoinContextValue {
  balance: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setBalance: (value: number | null) => void;
}

const CoinContext = createContext<CoinContextValue | undefined>(undefined);

export const CoinProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [balance, internalSetBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      internalSetBalance(null);
      return;
    }

    try {
      setLoading(true);
      const nextBalance = await getCoinBalance();
      internalSetBalance(nextBalance);
    } catch (error) {
      internalSetBalance(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      internalSetBalance(null);
      setLoading(false);
      return;
    }

    refresh();
  }, [authLoading, user, refresh]);

  const setBalance = useCallback((value: number | null) => {
    internalSetBalance(value);
  }, []);

  const value = useMemo(
    () => ({
      balance,
      loading: authLoading || loading,
      refresh,
      setBalance,
    }),
    [balance, loading, authLoading, refresh, setBalance]
  );

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
};

export const useCoins = () => {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
};
