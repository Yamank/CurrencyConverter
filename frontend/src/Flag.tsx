import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from './theme';

export function Flag({ country, size = 36 }: { country: string; size?: number }) {
  const { colors } = useTheme();
  const cc = (country || '').toLowerCase();
  // EU & UN are pseudo-codes — render symbol fallback
  const isReal = cc && cc !== 'eu' && cc !== 'un' && cc.length === 2;
  if (!isReal) {
    const label = country === 'EU' ? '€' : country === 'UN' ? '🌐' : '?';
    return (
      <View style={[styles.fallback, { width: size, height: size, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Text style={[styles.fallbackText, { color: colors.textPrimary }]}>{label}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w160/${cc}.png` }}
      style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

const styles = StyleSheet.create({
  img: {
    resizeMode: 'cover',
  },
  fallback: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
