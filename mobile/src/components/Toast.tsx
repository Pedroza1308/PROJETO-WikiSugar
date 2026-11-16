import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../hooks/ui';
import { colors, radius, shadows, TOUCH } from '../theme/tokens';
import { Icon } from './Icon';
import { Txt } from './Txt';

export interface ToastProps {
  title?: string;
  message: string;
  onClose?: () => void;
}

/** Green confirmation toast / banner. */
export function Toast({ title, message, onClose }: ToastProps) {
  const reduceMotion = useReduceMotion();
  const anim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(title ? `${title}. ${message}` : message);
    if (reduceMotion) {
      anim.setValue(1);
      return;
    }
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [anim, reduceMotion, title, message]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
        },
      ]}
    >
      <View style={styles.check}>
        <Icon name="check" size={16} color={colors.white} strokeWidth={2.6} />
      </View>
      <View style={styles.body}>
        {title ? (
          <Txt size={14} weight={800} color={colors.good}>
            {title}
          </Txt>
        ) : null}
        <Txt size={13} weight={title ? 600 : 700} color={colors.good} lh={1.35}>
          {message}
        </Txt>
      </View>
      {onClose ? (
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar confirmação" style={styles.close}>
          <Icon name="close" size={18} color={colors.good} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.goodBg,
    borderWidth: 1,
    borderColor: colors.goodBorder,
    borderRadius: radius.card,
    paddingLeft: 12,
    paddingVertical: 6,
    minHeight: 56,
    ...shadows.card,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.good,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, paddingVertical: 4 },
  close: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
