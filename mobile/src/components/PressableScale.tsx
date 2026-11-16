import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useReduceMotion } from '../hooks/ui';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle> | ((pressed: boolean) => StyleProp<ViewStyle>);
  scaleTo?: number;
  children?: React.ReactNode;
}

/** Pressable that slightly scales down while pressed (disabled under "reduce motion"). */
export function PressableScale({ style, scaleTo = 0.985, children, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = React.useState(false);

  const animate = (to: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, { toValue: to, duration: 90, useNativeDriver: true }).start();
  };

  const resolved = typeof style === 'function' ? style(pressed) : style;

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        animate(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        animate(1);
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[resolved, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
