import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useFontScale } from '../store/AppContext';
import { colors, fonts, radius, shadows } from '../theme/tokens';
import { formatNumber, parseLocaleNumber } from '../utils/format';
import { IconName } from './Icon';
import { IconTile } from './IconTile';
import { Txt } from './Txt';

export interface GoalInputProps {
  icon: IconName;
  label: string;
  unit: string;
  value: number;
  onChangeValue: (value: number) => void;
  sublabel?: string;
  allowDecimal?: boolean;
  testID?: string;
}

export function GoalInput({ icon, label, unit, value, onChangeValue, sublabel = 'por dia', allowDecimal, testID }: GoalInputProps) {
  const scale = useFontScale();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(formatNumber(value, 1));

  useEffect(() => {
    if (!focused) setText(formatNumber(value, 1));
  }, [value, focused]);

  return (
    <View style={styles.row}>
      <IconTile name={icon} size={42} />
      <View style={styles.labels}>
        <Txt size={15} weight={800}>
          {label}
        </Txt>
        <Txt size={12} color={colors.muted}>
          {sublabel}
        </Txt>
      </View>
      <TextInput
        testID={testID}
        value={text}
        onChangeText={(t) => {
          const cleaned = allowDecimal ? t.replace(/[^\d,]/g, '') : t.replace(/\D/g, '');
          setText(cleaned);
          onChangeValue(parseLocaleNumber(cleaned));
        }}
        onFocus={() => {
          setFocused(true);
          setText(allowDecimal ? String(value).replace('.', ',') : String(Math.round(value)));
        }}
        onBlur={() => setFocused(false)}
        keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        accessibilityLabel={`${label} em ${unit} por dia`}
        style={[styles.input, { fontSize: 15 * scale }, focused && styles.inputFocused]}
      />
      <Txt size={13} color={colors.muted} style={styles.unit}>
        {unit}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    paddingHorizontal: 13,
    paddingVertical: 10,
    ...shadows.card,
  },
  labels: { flex: 1 },
  input: {
    width: 66,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.goalInputBg,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    color: colors.ink,
    paddingVertical: 0,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.white },
  unit: { minWidth: 34 },
});
