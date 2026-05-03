import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/theme';
import { useStore } from '../src/store';
import { Flag } from '../src/Flag';

export default function Picker() {
  const { colors } = useTheme();
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind: 'from' | 'to' | 'fav' }>();
  const { currencies, fromCode, toCode, setFromCode, setToCode, favorites, toggleFavorite } = useStore();
  const [q, setQ] = useState('');

  const selected = kind === 'from' ? fromCode : kind === 'to' ? toCode : '';

  const data = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const matches = currencies.filter(c =>
      !ql || c.code.toLowerCase().includes(ql) || c.name.toLowerCase().includes(ql)
    );
    // Favorites first
    const favSet = new Set(favorites);
    return matches.sort((a, b) => {
      const af = favSet.has(a.code) ? 0 : 1;
      const bf = favSet.has(b.code) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.code.localeCompare(b.code);
    });
  }, [q, currencies, favorites]);

  const onPick = (code: string) => {
    if (kind === 'from') setFromCode(code);
    else if (kind === 'to') setToCode(code);
    else if (kind === 'fav') {
      toggleFavorite(code);
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable testID="picker-close" onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {kind === 'fav' ? 'Manage favorites' : 'Select currency'}
        </Text>
        <View style={styles.iconBtn} />
      </View>
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          testID="picker-search"
          style={[styles.search, { color: colors.textPrimary }]}
          value={q}
          onChangeText={setQ}
          placeholder="Search by code or name"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="characters"
        />
      </View>
      <FlatList
        data={data}
        keyExtractor={(c) => c.code}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => {
          const isSel = item.code === selected;
          const isFav = favorites.includes(item.code);
          return (
            <Pressable
              testID={`pick-${item.code}`}
              onPress={() => onPick(item.code)}
              style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
            >
              <Flag country={item.country} size={32} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.code, { color: colors.textPrimary }]}>{item.code}</Text>
                <Text style={[styles.name, { color: colors.textMuted }]} numberOfLines={1}>{item.name}</Text>
              </View>
              {kind === 'fav' ? (
                <Ionicons name={isFav ? 'star' : 'star-outline'} size={22} color={isFav ? '#F59E0B' : colors.textMuted} />
              ) : isSel ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.accentVibrant} />
              ) : (
                <Pressable testID={`pickfav-${item.code}`} onPress={() => toggleFavorite(item.code)} hitSlop={8}>
                  <Ionicons name={isFav ? 'star' : 'star-outline'} size={20} color={isFav ? '#F59E0B' : colors.textMuted} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 8, marginBottom: 8 },
  search: { flex: 1, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  code: { fontSize: 16, fontWeight: '700' },
  name: { fontSize: 12, marginTop: 2 },
});
