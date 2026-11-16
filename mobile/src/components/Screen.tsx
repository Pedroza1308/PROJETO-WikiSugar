import React from 'react';
import { KeyboardAvoidingView, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '../theme/tokens';
import { Txt } from './Txt';

export interface ScreenProps {
  children: React.ReactNode;
  /** Safe-area edges. Tab screens use ['top'] (tab bar handles the bottom). */
  edges?: Edge[];
  keyboard?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], keyboard = false, style }: ScreenProps) {
  const content = keyboard ? (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  ) : (
    children
  );
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {content}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small rounded label, e.g. "Hoje · 14 de maio". */
export function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Txt size={12} weight={800} color={colors.primary}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.screenBg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 14,
    ...shadows.card,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
});
