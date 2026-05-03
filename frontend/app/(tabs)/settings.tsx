import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../src/theme';
import { useStore } from '../../src/store';

export default function Settings() {
  const { colors, mode, setMode } = useTheme();
  const { rates, refresh, fromCode, toCode } = useStore();

  const modes: { id: ThemeMode; label: string; icon: any }[] = [
    { id: 'light', label: 'Light', icon: 'sunny-outline' },
    { id: 'dark', label: 'Dark', icon: 'moon-outline' },
    { id: 'system', label: 'Auto', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        <Section title="Appearance" colors={colors}>
          <View style={styles.segRow}>
            {modes.map(m => (
              <Pressable
                key={m.id}
                testID={`theme-${m.id}`}
                onPress={() => setMode(m.id)}
                style={[
                  styles.segBtn,
                  {
                    backgroundColor: mode === m.id ? colors.accentVibrant : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name={m.icon} size={18} color={mode === m.id ? '#fff' : colors.textSecondary} />
                <Text style={{ color: mode === m.id ? '#fff' : colors.textPrimary, fontWeight: '700', marginLeft: 6 }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Default pair" colors={colors}>
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{fromCode} → {toCode}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>Change in Convert tab</Text>
          </View>
        </Section>

        <Section title="Rates" colors={colors}>
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Last update</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{rates ? new Date(rates.updated_at).toLocaleString() : '—'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>Source: {rates?.source || '—'}</Text>
            </View>
            <Pressable testID="settings-refresh" onPress={() => refresh(true)} style={[styles.smallBtn, { backgroundColor: colors.accentVibrant }]}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Refresh</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="About" colors={colors}>
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>Currency Converter</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>v1.0.0 • 150+ currencies • Offline-ready</Text>
            <Pressable onPress={() => Linking.openURL('https://github.com')} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.accentVibrant, fontWeight: '700' }}>View on GitHub →</Text>
            </Pressable>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, colors }: any) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 }}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 18 },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  smallBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
});
