import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';
import { Icon, IconName } from './Icon';

export interface IconTileProps {
  name: IconName;
  size?: number;
  iconSize?: number;
  color?: string;
  bg?: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Colored square holding an icon (used in cards and form sections). */
export function IconTile({ name, size = 42, iconSize = 22, color = colors.primary, bg = colors.primarySoft, radius = 12, style }: IconTileProps) {
  return (
    <View
      style={[{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Icon name={name} size={iconSize} color={color} />
    </View>
  );
}
