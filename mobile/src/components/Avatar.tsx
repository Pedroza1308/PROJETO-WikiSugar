import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { colors } from '../theme/tokens';
import { Txt } from './Txt';

export interface AvatarProps {
  initials: string;
  size?: number;
  /** Profile photo URL; falls back to the initials while missing or on error. */
  uri?: string | null;
}

export function Avatar({ initials, size = 52, uri }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const fontSize = size <= 42 ? 13 : size >= 58 ? 19 : 17;
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={[circle, { backgroundColor: colors.primarySoft }]}
        accessibilityIgnoresInvertColors
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <View
      style={[circle, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Txt size={fontSize} weight={800} color={colors.white} allowFontScaling={false}>
        {initials}
      </Txt>
    </View>
  );
}
