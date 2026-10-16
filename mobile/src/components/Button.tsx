import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '../theme/tokens';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  minHeight?: number;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
  minHeight = 52,
}: ButtonProps) {
  const fg = variant === 'primary' ? colors.white : colors.primary;
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={(pressed) => [
        styles.base,
        { minHeight },
        variant === 'primary' && [styles.primary, pressed && { backgroundColor: colors.primaryPressed }],
        variant === 'secondary' && [styles.secondary, pressed && { backgroundColor: colors.primaryPale }],
        variant === 'ghost' && [styles.ghost, pressed && { backgroundColor: colors.primaryPale }],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={fg} strokeWidth={2.2} /> : null}
          <Txt size={16} weight={800} color={fg} align="center">
            {label}
          </Txt>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: colors.primary, ...shadows.primaryButton },
  secondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
});
