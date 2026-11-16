import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows } from '../theme/tokens';
import { IconName } from './Icon';
import { IconTile } from './IconTile';
import { ProgressBar } from './ProgressBar';
import { Txt } from './Txt';

export type ProgressKind = 'calories' | 'water' | 'sleep';

const KIND: Record<ProgressKind, { icon: IconName; color: string; bg: string; fill: string }> = {
  calories: { icon: 'target', color: colors.primary, bg: colors.primarySoft, fill: colors.primary },
  water: { icon: 'droplet', color: colors.water, bg: colors.waterBg, fill: colors.waterFill },
  sleep: { icon: 'moon', color: colors.purple, bg: colors.purpleBg, fill: colors.purple },
};

export interface ProgressCardProps {
  kind: ProgressKind;
  label: string;
  valueText: string;
  /** 0..1 */
  progress: number;
  action?: { label: string; onPress: () => void; accessibilityLabel?: string };
}

export function ProgressCard({ kind, label, valueText, progress, action }: ProgressCardProps) {
  const k = KIND[kind];
  return (
    <View style={styles.card}>
      <IconTile name={k.icon} size={45} color={k.color} bg={k.bg} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Txt size={13} weight={800}>
            {label}
          </Txt>
          <Txt size={12} weight={700} style={styles.value}>
            {valueText}
          </Txt>
        </View>
        <ProgressBar value={progress} color={k.fill} accessibilityLabel={`${label}: ${valueText}`} />
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.75 }]}
        >
          <Txt size={12} weight={800} color={colors.waterText}>
            {action.label}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 13,
    ...shadows.card,
  },
  body: { flex: 1, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  value: { flexShrink: 1, textAlign: 'right' },
  action: {
    width: 70,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.waterBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
});
