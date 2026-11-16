import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { FoodLevel } from '../types';
import { colors, radius } from '../theme/tokens';
import { Icon } from './Icon';
import { Txt } from './Txt';

export const LEVEL_COLORS: Record<FoodLevel, { fg: string; bg: string }> = {
  good: { fg: colors.good, bg: colors.goodBg },
  moderate: { fg: colors.warning, bg: colors.warningBg },
  high: { fg: colors.danger, bg: colors.dangerBg },
};

export function StatusBadge({ level, label }: { level: FoodLevel; label: string }) {
  const c = LEVEL_COLORS[level];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]} accessible accessibilityLabel={`Nível: ${label}`}>
      <Icon name={level === 'good' ? 'check' : 'alert'} size={16} color={c.fg} strokeWidth={2.2} />
      <Txt size={11} weight={800} color={c.fg}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
});
