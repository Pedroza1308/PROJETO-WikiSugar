import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../hooks/ui';
import { colors } from '../theme/tokens';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  accessibilityLabel?: string;
}

export function ProgressBar({ value, color = colors.primary, trackColor = colors.progressTrack, height = 8, accessibilityLabel }: ProgressBarProps) {
  const reduceMotion = useReduceMotion();
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const anim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(pct);
      return;
    }
    Animated.timing(anim, { toValue: pct, duration: 350, useNativeDriver: false }).start();
  }, [pct, reduceMotion, anim]);

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
      accessible={!!accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <Animated.View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
