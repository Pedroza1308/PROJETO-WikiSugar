import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

export function AppleLogo({ size = 48, color = colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M24 14c-4.5-3.2-12.6-1.6-15.3 5.7-3 8.2.8 19.2 8.7 22.1 2.4.9 4.5.2 6.6-.8 2.2 1 4.5 1.7 7 .7 7.6-3 11.5-13.7 8.5-21.8C36.9 13 29 11 24 14Z" />
      <Path d="M23 12c-.1-4.4 2.3-7.5 5.6-9" />
      <Path d="M28.5 7.4c2.2-3 5.6-2.9 7.8-1.9-1.2 3.5-4.3 5.1-7.8 1.9Z" />
      <Circle cx="31" cy="24" r="9.2" />
      <Path d="m27.6 23.8 2.5 2.7 4.6-6.1" />
    </Svg>
  );
}
