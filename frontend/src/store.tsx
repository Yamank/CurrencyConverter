import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Currency,
  RatesPayload,
  fetchCurrencies,
  fetchRates,
  listFavorites,
  addFavorite,
  removeFavorite,
} from './api';

const FROM_KEY = '@cc_from';
const TO_KEY = '@cc_to';

interface StoreCtx {
  currencies: Currency[];
  byCode: Record<string, Currency>;
  rates: RatesPayload | null;
  loading: boolean;
  error: string | null;
  fromCode: string;
  toCode: string;
  setFromCode: (c: string) => void;
  setToCode: (c: string) => void;
  swap: () => void;
  refresh: (force?: boolean) => Promise<void>;
  favorites: string[];
  toggleFavorite: (code: string) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<RatesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCode, setFromCodeState] = useState('USD');
  const [toCode, setToCodeState] = useState('EUR');
  const [favorites, setFavorites] = useState<string[]>([]);

  const setFromCode = (c: string) => { setFromCodeState(c); AsyncStorage.setItem(FROM_KEY, c); };
  const setToCode = (c: string) => { setToCodeState(c); AsyncStorage.setItem(TO_KEY, c); };

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchRates(fromCode, force);
      setRates(r);
    } catch (e: any) {
      setError(e?.message || 'Failed to load rates');
    } finally {
      setLoading(false);
    }
  }, [fromCode]);

  // Initial load
  useEffect(() => {
    (async () => {
      const [f, t] = await Promise.all([
        AsyncStorage.getItem(FROM_KEY),
        AsyncStorage.getItem(TO_KEY),
      ]);
      if (f) setFromCodeState(f);
      if (t) setToCodeState(t);
      try {
        const list = await fetchCurrencies();
        setCurrencies(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load currencies');
      }
      try {
        const favs = await listFavorites();
        setFavorites(favs.map(f => f.code));
      } catch {}
    })();
  }, []);

  // Refresh rates whenever fromCode changes
  useEffect(() => { refresh(false); }, [fromCode, refresh]);

  const byCode = React.useMemo(() => {
    const m: Record<string, Currency> = {};
    currencies.forEach(c => { m[c.code] = c; });
    return m;
  }, [currencies]);

  const swap = () => {
    const a = fromCode, b = toCode;
    setFromCode(b);
    setToCode(a);
  };

  const toggleFavorite = async (code: string) => {
    if (favorites.includes(code)) {
      setFavorites(favorites.filter(c => c !== code));
      try { await removeFavorite(code); } catch {}
    } else {
      setFavorites([...favorites, code]);
      try { await addFavorite(code); } catch {}
    }
  };

  return (
    <Ctx.Provider value={{
      currencies, byCode, rates, loading, error,
      fromCode, toCode, setFromCode, setToCode, swap, refresh,
      favorites, toggleFavorite,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore must be inside StoreProvider');
  return c;
}
