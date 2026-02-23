import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'replock_state_v1';

export type ShopPlatform = 'tiktok' | 'instagram' | 'youtube';

type TimeCredits = Record<ShopPlatform, number>;

type PersistedState = {
  tokens: number;
  timeCredits: TimeCredits;
};

type RepLockStore = PersistedState & {
  hydrated: boolean;
  addTokens: (amount: number) => void;
  spendTokensForCredit: (platform: ShopPlatform, tokenCost: number, minutes: number) => boolean;
  resetProgress: () => void;
};

const initialState: PersistedState = {
  tokens: 0,
  timeCredits: {
    tiktok: 0,
    instagram: 0,
    youtube: 0,
  },
};

const RepLockStoreContext = createContext<RepLockStore | null>(null);

export function RepLockStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw || !mounted) return;
        const parsed = JSON.parse(raw) as PersistedState;
        if (typeof parsed.tokens !== 'number' || !parsed.timeCredits) return;
        setState({
          tokens: parsed.tokens,
          timeCredits: {
            tiktok: parsed.timeCredits.tiktok ?? 0,
            instagram: parsed.timeCredits.instagram ?? 0,
            youtube: parsed.timeCredits.youtube ?? 0,
          },
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  const addTokens = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      setState((current) => ({
        ...current,
        tokens: current.tokens + amount,
      }));
    },
    [],
  );

  const spendTokensForCredit = useCallback(
    (platform: ShopPlatform, tokenCost: number, minutes: number) => {
      if (tokenCost <= 0 || minutes <= 0) {
        return false;
      }

      let purchased = false;
      setState((current) => {
        if (current.tokens < tokenCost) {
          return current;
        }
        purchased = true;
        return {
          tokens: current.tokens - tokenCost,
          timeCredits: {
            ...current.timeCredits,
            [platform]: current.timeCredits[platform] + minutes,
          },
        };
      });

      return purchased;
    },
    [],
  );

  const resetProgress = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo<RepLockStore>(
    () => ({
      hydrated,
      tokens: state.tokens,
      timeCredits: state.timeCredits,
      addTokens,
      spendTokensForCredit,
      resetProgress,
    }),
    [addTokens, hydrated, resetProgress, spendTokensForCredit, state.timeCredits, state.tokens],
  );

  return <RepLockStoreContext.Provider value={value}>{children}</RepLockStoreContext.Provider>;
}

export function useRepLockStore() {
  const context = useContext(RepLockStoreContext);
  if (!context) {
    throw new Error('useRepLockStore must be used within RepLockStoreProvider');
  }
  return context;
}
