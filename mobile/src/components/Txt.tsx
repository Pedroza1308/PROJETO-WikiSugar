import React from 'react';
import { StyleProp, StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';
import { useFontScale } from '../store/AppContext';
import { colors, fontFor, FontWeightToken } from '../theme/tokens';

export interface TxtProps extends TextProps {
  size?: number;
  weight?: FontWeightToken;
  color?: string;
  /** Line height multiplier (e.g. 1.45). */
  lh?: number;
  ls?: number;
  align?: TextStyle['textAlign'];
  upper?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * Base text. Every text in the app goes through this component so the global
 * font multiplier (Perfil › Tamanho do texto) applies everywhere.
 */
export function Txt({
  size = 15,
  weight = 400,
  color = colors.ink,
  lh,
  ls,
  align,
  upper,
  style,
  children,
  ...rest
}: TxtProps) {
  const scale = useFontScale();
  const fontSize = Math.round(size * scale * 10) / 10;
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fontFor(weight),
          fontSize,
          color,
          lineHeight: lh ? Math.round(fontSize * lh) : undefined,
          letterSpacing: ls,
          textAlign: align,
          textTransform: upper ? 'uppercase' : undefined,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function H1({ size = 24, style, ...rest }: TxtProps) {
  return <Txt accessibilityRole="header" size={size} weight={800} ls={-0.5} lh={1.2} style={style} {...rest} />;
}

export function H2({ size = 20, style, ...rest }: TxtProps) {
  return <Txt accessibilityRole="header" size={size} weight={800} lh={1.25} style={style} {...rest} />;
}

export function Paragraph({ size = 15, color = colors.muted, ...rest }: TxtProps) {
  return <Txt size={size} color={color} lh={1.45} {...rest} />;
}

export function Eyebrow({ size = 13, color = colors.primary, ...rest }: TxtProps) {
  return <Txt size={size} weight={800} ls={0.8} color={color} {...rest} />;
}

export const textStyles = StyleSheet.create({
  bold: { fontFamily: fontFor(800) },
});
