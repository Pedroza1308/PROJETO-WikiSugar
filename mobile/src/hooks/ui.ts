import { useEffect, useState } from 'react';
import { AccessibilityInfo, useWindowDimensions } from 'react-native';
import { spacing } from '../theme/tokens';

/** Tracks the OS "reduce motion" accessibility setting. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduce(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** Horizontal screen padding: 20, or 15 on narrow screens (≤ 360). */
export function useScreenPadding(): number {
  const { width } = useWindowDimensions();
  return width <= 360 ? spacing.screenCompact : spacing.screen;
}
