import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentVibrant: string;
  success: string;
  danger: string;
  chartLine: string;
  chartFill: string;
  keypad: string;
  keypadActive: string;
}

const light: ThemeColors = {
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F4',
  textPrimary: '#0A0A0A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: 'rgba(15, 23, 42, 0.06)',
  accent: '#0F172A',
  accentVibrant: '#2563EB',
  success: '#10B981',
  danger: '#EF4444',
  chartLine: '#2563EB',
  chartFill: 'rgba(37, 99, 235, 0.15)',
  keypad: '#FFFFFF',
  keypadActive: '#E2E8F0',
};

const dark: ThemeColors = {
  background: '#020617',
  surface: '#0B1224',
  surfaceAlt: '#101A33',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  border: 'rgba(148, 163, 184, 0.12)',
  accent: '#F8FAFC',
  accentVibrant: '#60A5FA',
  success: '#34D399',
  danger: '#F87171',
  chartLine: '#60A5FA',
  chartFill: 'rgba(96, 165, 250, 0.2)',
  keypad: '#0F172A',
  keypadActive: '#1E293B',
};

interface ThemeCtx {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

const KEY = '@cc_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sys = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m);
  }, []);

  const isDark = mode === 'system' ? sys === 'dark' : mode === 'dark';
  const colors = isDark ? dark : light;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeContext);
  if (!c) throw new Error('useTheme must be inside ThemeProvider');
  return c;
}
