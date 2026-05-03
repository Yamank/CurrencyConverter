import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Currency {
  code: string;
  name: string;
  country: string;
  symbol: string;
}

export interface RatesPayload {
  base: string;
  rates: Record<string, number>;
  updated_at: string;
  source: string;
}

export interface HistoryEntry {
  id: string;
  from_code: string;
  to_code: string;
  amount: number;
  result: number;
  rate: number;
  created_at: string;
}

export interface TimeseriesPoint { date: string; rate: number; }
export interface TimeseriesPayload {
  base: string;
  target: string;
  points: TimeseriesPoint[];
  source: string;
}

const CURR_KEY = '@cc_currencies';
const RATES_KEY = (b: string) => `@cc_rates_${b}`;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCurrencies(): Promise<Currency[]> {
  try {
    const data = await get<Currency[]>('/currencies');
    AsyncStorage.setItem(CURR_KEY, JSON.stringify(data));
    return data;
  } catch (e) {
    const cached = await AsyncStorage.getItem(CURR_KEY);
    if (cached) return JSON.parse(cached);
    throw e;
  }
}

export async function fetchRates(base: string, force = false): Promise<RatesPayload> {
  try {
    const data = await get<RatesPayload>(`/rates/latest?base=${base}${force ? '&force=true' : ''}`);
    AsyncStorage.setItem(RATES_KEY(base), JSON.stringify(data));
    return data;
  } catch (e) {
    const cached = await AsyncStorage.getItem(RATES_KEY(base));
    if (cached) {
      const p = JSON.parse(cached) as RatesPayload;
      return { ...p, source: p.source + ' (offline)' };
    }
    throw e;
  }
}

export async function fetchTimeseries(base: string, target: string, days = 30): Promise<TimeseriesPayload> {
  return get<TimeseriesPayload>(`/rates/timeseries?base=${base}&target=${target}&days=${days}`);
}

export async function addHistory(entry: Omit<HistoryEntry, 'id' | 'created_at'>): Promise<HistoryEntry> {
  return post<HistoryEntry>('/history', entry);
}

export async function listHistory(): Promise<HistoryEntry[]> {
  return get<HistoryEntry[]>('/history');
}

export async function deleteHistoryEntry(id: string) { return del(`/history/${id}`); }
export async function clearHistory() { return del('/history'); }

export async function listFavorites(): Promise<{ code: string; created_at: string }[]> {
  return get('/favorites');
}
export async function addFavorite(code: string) { return post('/favorites', { code }); }
export async function removeFavorite(code: string) { return del(`/favorites/${code}`); }
