import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, TOUCH } from '../theme/tokens';
import { useScreenPadding } from '../hooks/ui';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { Txt } from './Txt';

export interface TopBarProps {
  title?: string;
  onBack?: () => void;
  showLogo?: boolean;
  /** Initials for the mini avatar on the right. */
  avatarInitials?: string;
  onAvatarPress?: () => void;
}

export function TopBar({ title, onBack, showLogo, avatarInitials, onAvatarPress }: TopBarProps) {
  const px = useScreenPadding();
  return (
    <View style={[styles.bar, { paddingHorizontal: px }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={4}
            style={({ pressed }) => [styles.back, pressed && { backgroundColor: colors.primaryPale }]}
          >
            <Icon name="arrow" size={24} color={colors.ink} />
          </Pressable>
        ) : showLogo ? (
          <Logo compact />
        ) : null}
      </View>

      <View style={styles.center} pointerEvents="none">
        {title && !(showLogo && !onBack) ? (
          <Txt size={18} weight={800} align="center" numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
        ) : null}
      </View>

      <View style={[styles.side, styles.right]}>
        {avatarInitials ? (
          <Pressable
            onPress={onAvatarPress}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            style={styles.touch}
          >
            <Avatar initials={avatarInitials} size={42} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.screenBg,
  },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: TOUCH },
  right: { justifyContent: 'flex-end' },
  center: { flex: 2, alignItems: 'center' },
  back: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  touch: { minWidth: TOUCH, minHeight: TOUCH, alignItems: 'flex-end', justifyContent: 'center' },
});
