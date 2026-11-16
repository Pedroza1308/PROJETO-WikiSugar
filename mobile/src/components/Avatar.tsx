import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/tokens';
import { Txt } from './Txt';

export function Avatar({ initials, size = 52 }: { initials: string; size?: number }) {
  const fontSize = size <= 42 ? 13 : size >= 58 ? 19 : 17;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Txt size={fontSize} weight={800} color={colors.white} allowFontScaling={false}>
        {initials}
      </Txt>
    </View>
  );
}
