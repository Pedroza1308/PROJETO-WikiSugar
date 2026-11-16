import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { Txt } from './Txt';

export interface ToggleGroupProps {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  accessibilityLabel?: string;
}

/** Sim/Não toggle. */
export function ToggleGroup({ value, onChange, yesLabel = 'Sim', noLabel = 'Não', accessibilityLabel }: ToggleGroupProps) {
  const opts: { label: string; v: boolean }[] = [
    { label: yesLabel, v: true },
    { label: noLabel, v: false },
  ];
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {opts.map((o) => {
        const selected = o.v === value;
        return (
          <Pressable
            key={o.label}
            onPress={() => onChange(o.v)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ checked: selected, selected }}
            style={[styles.opt, selected && styles.selected]}
          >
            <Txt size={16} weight={800} color={selected ? colors.white : colors.ink}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.field,
    padding: 3,
    backgroundColor: colors.white,
  },
  opt: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.field - 3 },
  selected: { backgroundColor: colors.primary },
});
