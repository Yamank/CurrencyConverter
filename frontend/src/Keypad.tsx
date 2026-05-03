import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './theme';

export type KeyValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'CE' | 'BACK';

interface Props {
  onKey: (k: KeyValue) => void;
}

const KEYS: (KeyValue | null)[][] = [
  ['CE', 'BACK', null],
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', null],
];

export function Keypad({ onKey }: Props) {
  const { colors } = useTheme();

  const press = (k: KeyValue) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onKey(k);
  };

  return (
    <View style={styles.wrap}>
      {KEYS.map((row, ri) => (
        <View style={styles.row} key={ri}>
          {row.map((k, ci) => {
            if (k === null) return <View key={ci} style={styles.spacer} />;
            const isAction = k === 'CE' || k === 'BACK';
            const wide = k === '0';
            return (
              <Pressable
                key={ci}
                testID={`keypad-${k}`}
                onPress={() => press(k)}
                style={({ pressed }) => [
                  styles.btn,
                  wide && styles.wideBtn,
                  {
                    backgroundColor: pressed ? colors.keypadActive : colors.keypad,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                {k === 'BACK' ? (
                  <Ionicons name="backspace-outline" size={26} color={colors.accentVibrant} />
                ) : k === 'CE' ? (
                  <Text style={[styles.txt, { color: colors.accentVibrant, fontSize: 20 }]}>CE</Text>
                ) : (
                  <Text style={[styles.txt, { color: colors.textPrimary }]}>{k}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    aspectRatio: 2.0,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  wideBtn: { flex: 1 },
  spacer: { flex: 1 },
  txt: { fontSize: 26, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
