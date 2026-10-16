import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Icon shown when NOT selected (e.g. "plus" for "+ Adicionar"). */
  icon?: IconName;
  role?: 'radio' | 'checkbox' | 'button';
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected = false, onPress, icon, role = 'button', style }: ChipProps) {
  const fg = selected ? colors.primary : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={role === 'button' ? { selected } : { checked: selected, selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && { backgroundColor: colors.primaryPale },
        style,
      ]}
    >
      {selected ? <Icon name="check" size={17} color={colors.primary} strokeWidth={2.3} /> : icon ? <Icon name={icon} size={17} color={fg} /> : null}
      <Txt size={15} weight={700} color={fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

export interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** Single-choice grid of chips (2 columns). */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => (
        <Chip key={opt} label={opt} role="radio" selected={opt === value} onPress={() => onChange(opt)} style={styles.cell} />
      ))}
    </View>
  );
}

export interface MultiSelectProps<T extends string> {
  options: readonly T[];
  values: readonly string[];
  onChange: (values: string[]) => void;
  accessibilityLabel?: string;
}

/** Multiple-choice grid of chips (2 columns). */
export function MultiSelect<T extends string>({ options, values, onChange, accessibilityLabel }: MultiSelectProps<T>) {
  return (
    <View style={styles.grid} accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const selected = values.includes(opt);
        return (
          <Chip
            key={opt}
            label={opt}
            role="checkbox"
            selected={selected}
            onPress={() => onChange(selected ? values.filter((v) => v !== opt) : [...values, opt])}
            style={styles.cell}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.chip,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexBasis: '47%', flexGrow: 1 },
});
