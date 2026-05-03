import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useStore } from '../../src/store';
import { Flag } from '../../src/Flag';
import { formatAmount, formatRate } from '../../src/format';

export default function Compare() {
  const { colors } = useTheme();
  const router = useRouter();
  const { byCode, fromCode, rates, favorites, currencies, toggleFavorite } = useStore();

  const [amountStr, setAmountStr] = useState('100');
  const amount = parseFloat(amountStr || '0') || 0;

  const list = useMemo(() => {
    const set = new Set<string>(favorites);
    // Default essentials if no favorites
    if (set.size === 0) ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'].forEach(c => set.add(c));
    set.delete(fromCode);
    return Array.from(set).filter(c => byCode[c] && rates?.rates?.[c] !== undefined);
  }, [favorites, fromCode, byCode, rates]);

  const fromCurrency = byCode[fromCode];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Compare</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Convert one amount to many currencies</Text>
      </View>

      {/* Sticky base */}
      <View style={[styles.baseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable testID="compare-pick-base" onPress={() => router.push('/picker?kind=from')} style={styles.baseRow}>
          <Flag country={fromCurrency?.country || 'US'} size={36} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.baseCode, { color: colors.textPrimary }]}>{fromCode}</Text>
            <Text style={[styles.baseName, { color: colors.textMuted }]}>{fromCurrency?.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </Pressable>
        <View style={[styles.amountWrap, { borderColor: colors.border }]}>
          <Text style={[styles.amountSym, { color: colors.textMuted }]}>{fromCurrency?.symbol}</Text>
          <TextInput
            testID="compare-amount-input"
            style={[styles.amountInput, { color: colors.textPrimary }]}
            value={amountStr}
            onChangeText={(v) => setAmountStr(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {list.map((code) => {
          const c = byCode[code];
          const r = rates?.rates?.[code] || 0;
          const value = amount * r;
          const isFav = favorites.includes(code);
          return (
            <View
              key={code}
              testID={`compare-row-${code}`}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Flag country={c.country} size={32} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.code, { color: colors.textPrimary }]}>{code}</Text>
                <Text style={[styles.name, { color: colors.textMuted }]} numberOfLines={1}>{c.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  {c.symbol} {formatAmount(value, 2)}
                </Text>
                <Text style={[styles.rateLine, { color: colors.textMuted }]}>1 {fromCode} = {formatRate(r)}</Text>
              </View>
              <Pressable testID={`fav-${code}`} onPress={() => toggleFavorite(code)} style={styles.favBtn} hitSlop={10}>
                <Ionicons name={isFav ? 'star' : 'star-outline'} size={20} color={isFav ? '#F59E0B' : colors.textMuted} />
              </Pressable>
            </View>
          );
        })}
        <Pressable
          testID="compare-add"
          onPress={() => router.push('/picker?kind=fav')}
          style={[styles.addBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.accentVibrant} />
          <Text style={[styles.addTxt, { color: colors.accentVibrant }]}>Add currency</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  baseCard: { marginHorizontal: 18, padding: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 12 },
  baseRow: { flexDirection: 'row', alignItems: 'center' },
  baseCode: { fontSize: 16, fontWeight: '700' },
  baseName: { fontSize: 12 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  amountSym: { fontSize: 22, marginRight: 6, fontWeight: '600' },
  amountInput: { flex: 1, fontSize: 26, fontWeight: '800', padding: 0, fontVariant: ['tabular-nums'] },
  list: { padding: 18, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  code: { fontSize: 16, fontWeight: '700' },
  name: { fontSize: 12 },
  value: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rateLine: { fontSize: 11, marginTop: 2 },
  favBtn: { paddingLeft: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  addTxt: { fontWeight: '700' },
});
