import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useStore } from '../../src/store';
import { Keypad } from '../../src/Keypad';
import { Flag } from '../../src/Flag';
import { applyKey, formatAmount, formatRate, formatUpdated } from '../../src/format';
import { addHistory } from '../../src/api';

export default function Converter() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { byCode, fromCode, toCode, swap, rates, loading, error, refresh } = useStore();

  const [amount, setAmount] = useState('0');

  const fromCurrency = byCode[fromCode];
  const toCurrency = byCode[toCode];
  const rate = rates?.rates?.[toCode];

  const numericAmount = parseFloat(amount || '0') || 0;
  const converted = useMemo(() => {
    if (!rate) return 0;
    return numericAmount * rate;
  }, [numericAmount, rate]);

  const onKey = (k: any) => setAmount(prev => applyKey(prev, k));

  const onUpdate = async () => {
    await refresh(true);
    if (numericAmount > 0 && rate) {
      addHistory({
        from_code: fromCode,
        to_code: toCode,
        amount: numericAmount,
        result: numericAmount * rate,
        rate,
      }).catch(() => {});
    }
  };

  const openPicker = (kind: 'from' | 'to') => {
    router.push(`/picker?kind=${kind}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoBadge, { backgroundColor: colors.accentVibrant }]}>
              <Ionicons name="swap-horizontal" size={18} color="#fff" />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Currency</Text>
          </View>
          <Pressable
            testID="header-refresh"
            onPress={onUpdate}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.accentVibrant} />
            ) : (
              <Ionicons name="refresh" size={20} color={colors.accentVibrant} />
            )}
          </Pressable>
        </View>

        {/* From card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: isDark ? '#000' : '#0F172A' }]}>
          <Pressable testID="picker-from" onPress={() => openPicker('from')} style={styles.cardTop}>
            <Flag country={fromCurrency?.country || 'US'} size={40} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.codeLine, { color: colors.textPrimary }]}>
                {fromCode}
                <Text style={[styles.codeMuted, { color: colors.textMuted }]}>  •  {fromCurrency?.name || ''}</Text>
              </Text>
              <Text style={[styles.smallLabel, { color: colors.textMuted }]}>YOU SEND</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>
          <Text testID="amount-from" style={[styles.amountText, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            <Text style={[styles.symbol, { color: colors.textSecondary }]}>{fromCurrency?.symbol || '$'} </Text>
            {formatAmount(amount, 6)}
          </Text>
        </View>

        {/* Swap button */}
        <View style={styles.swapWrap}>
          <Pressable
            testID="swap-button"
            onPress={() => { swap(); }}
            style={[styles.swapBtn, { backgroundColor: colors.accentVibrant }]}
          >
            <Ionicons name="swap-vertical" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* To card */}
        <View style={[styles.card, styles.cardAlt, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Pressable testID="picker-to" onPress={() => openPicker('to')} style={styles.cardTop}>
            <Flag country={toCurrency?.country || 'EU'} size={40} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.codeLine, { color: colors.textPrimary }]}>
                {toCode}
                <Text style={[styles.codeMuted, { color: colors.textMuted }]}>  •  {toCurrency?.name || ''}</Text>
              </Text>
              <Text style={[styles.smallLabel, { color: colors.textMuted }]}>THEY RECEIVE</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>
          <Text testID="amount-to" style={[styles.amountText, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            <Text style={[styles.symbol, { color: colors.textSecondary }]}>{toCurrency?.symbol || '€'} </Text>
            {formatAmount(converted, 4)}
          </Text>
        </View>

        {/* Rate info */}
        <View style={styles.rateRow}>
          {rate ? (
            <>
              <Text style={[styles.rateText, { color: colors.textSecondary }]}>
                1 {fromCode} = <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{formatRate(rate)}</Text> {toCode}
              </Text>
              <Text style={[styles.updatedText, { color: colors.textMuted }]}>
                Updated {rates ? formatUpdated(rates.updated_at) : '—'}{rates?.source?.includes('offline') ? ' • offline' : ''}
              </Text>
            </>
          ) : error ? (
            <Text style={[styles.rateText, { color: colors.danger }]}>{error}</Text>
          ) : (
            <Text style={[styles.rateText, { color: colors.textMuted }]}>Loading rates…</Text>
          )}
          <Pressable testID="update-rates" onPress={onUpdate}>
            <Text style={[styles.update, { color: colors.accentVibrant }]}>Update rates</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Keypad onKey={onKey} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardAlt: { marginTop: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  codeLine: { fontSize: 18, fontWeight: '700' },
  codeMuted: { fontSize: 13, fontWeight: '500' },
  smallLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
  amountText: { fontSize: 44, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  symbol: { fontSize: 28, fontWeight: '600' },
  swapWrap: { alignItems: 'center', marginVertical: -12, zIndex: 2 },
  swapBtn: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  rateRow: { marginTop: 16, alignItems: 'flex-start', gap: 4 },
  rateText: { fontSize: 14 },
  updatedText: { fontSize: 12 },
  update: { marginTop: 8, fontWeight: '700' },
});
