import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useStore } from '../../src/store';
import { Flag } from '../../src/Flag';
import { LineChart } from '../../src/LineChart';
import { fetchTimeseries, listHistory, deleteHistoryEntry, clearHistory, TimeseriesPayload, HistoryEntry } from '../../src/api';
import { formatAmount, formatRate } from '../../src/format';

const RANGES: { label: string; days: number }[] = [
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
];

export default function ChartsTab() {
  const { colors } = useTheme();
  const { byCode, fromCode, toCode } = useStore();

  const [range, setRange] = useState(30);
  const [series, setSeries] = useState<TimeseriesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadSeries = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchTimeseries(fromCode, toCode, range);
      setSeries(s);
    } catch {
      setSeries(null);
    } finally { setLoading(false); }
  }, [fromCode, toCode, range]);

  const loadHistory = useCallback(async () => {
    try { setHistory(await listHistory()); } catch {}
  }, []);

  useEffect(() => { loadSeries(); }, [loadSeries]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const removeEntry = async (id: string) => {
    setHistory(history.filter(h => h.id !== id));
    try { await deleteHistoryEntry(id); } catch {}
  };
  const clearAll = async () => {
    setHistory([]);
    try { await clearHistory(); } catch {}
  };

  const w = Dimensions.get('window').width - 36;
  const first = series?.points[0]?.rate || 0;
  const last = series?.points[series.points.length - 1]?.rate || 0;
  const change = first ? ((last - first) / first) * 100 : 0;
  const up = change >= 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 80 }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Trends</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.pairRow}>
            <Flag country={byCode[fromCode]?.country || 'US'} size={28} />
            <Text style={[styles.pairText, { color: colors.textPrimary }]}>{fromCode}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <Flag country={byCode[toCode]?.country || 'EU'} size={28} />
            <Text style={[styles.pairText, { color: colors.textPrimary }]}>{toCode}</Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={[styles.bigRate, { color: colors.textPrimary }]}>{formatRate(last)}</Text>
            <View style={[styles.changePill, { backgroundColor: up ? colors.success + '22' : colors.danger + '22' }]}>
              <Ionicons name={up ? 'trending-up' : 'trending-down'} size={14} color={up ? colors.success : colors.danger} />
              <Text style={[styles.changeTxt, { color: up ? colors.success : colors.danger }]}>
                {up ? '+' : ''}{change.toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.rangeRow}>
            {RANGES.map(r => (
              <Pressable
                key={r.label}
                testID={`range-${r.label}`}
                onPress={() => setRange(r.days)}
                style={[styles.rangeBtn, { borderColor: colors.border, backgroundColor: range === r.days ? colors.accentVibrant : 'transparent' }]}
              >
                <Text style={{ color: range === r.days ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{r.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 200, marginTop: 8 }}>
            {loading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.accentVibrant} />
              </View>
            ) : series && series.points.length > 1 ? (
              <LineChart points={series.points} width={w - 28} height={200} />
            ) : (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 80 }}>No data</Text>
            )}
          </View>
          {series && (
            <Text style={[styles.source, { color: colors.textMuted }]}>Source: {series.source}</Text>
          )}
        </View>

        <View style={styles.histHead}>
          <Text style={[styles.subTitle, { color: colors.textPrimary }]}>History</Text>
          {history.length > 0 && (
            <Pressable testID="clear-history" onPress={clearAll}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>Clear</Text>
            </Pressable>
          )}
        </View>
        {history.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={28} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 6 }}>No conversions yet</Text>
          </View>
        ) : history.map(h => (
          <View key={h.id} style={[styles.histRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.histLine, { color: colors.textPrimary }]}>
                {formatAmount(h.amount, 2)} {h.from_code} → {formatAmount(h.result, 2)} {h.to_code}
              </Text>
              <Text style={[styles.histMeta, { color: colors.textMuted }]}>
                @ {formatRate(h.rate)} • {new Date(h.created_at).toLocaleString()}
              </Text>
            </View>
            <Pressable testID={`del-history-${h.id}`} onPress={() => removeEntry(h.id)} hitSlop={10}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 },
  card: { borderRadius: 22, padding: 16, borderWidth: StyleSheet.hairlineWidth },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairText: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  bigRate: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  changeTxt: { fontWeight: '700', fontSize: 12 },
  rangeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  rangeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  source: { fontSize: 11, marginTop: 6, textAlign: 'right' },
  subTitle: { fontSize: 18, fontWeight: '700' },
  histHead: { marginTop: 24, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed', padding: 32, alignItems: 'center' },
  histRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  histLine: { fontSize: 14, fontWeight: '700' },
  histMeta: { fontSize: 11, marginTop: 2 },
});
