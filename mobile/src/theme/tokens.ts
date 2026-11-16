import { Platform, ViewStyle } from 'react-native';

export const colors = {
  ink: '#28292E',
  muted: '#62636A',
  primary: '#CF4200',
  primaryPressed: '#B83F00',
  primarySoft: '#FFE5D5',
  primaryPale: '#FFF6EF',
  canvas: '#E8E8E9',
  screenBg: '#FAFAFA',
  surface: '#FFFFFF',
  line: '#DEDEE1',
  lineSoft: '#EDF2F1',
  cardBorder: '#E4E4E6',
  white: '#FFFFFF',

  good: '#176B43',
  goodBg: '#E6F5EC',
  goodBorder: '#BBDDC9',
  warning: '#76540A',
  warningBg: '#FFF2C7',
  danger: '#A3322D',
  dangerBg: '#FDE9E7',

  purple: '#6750A4',
  purpleBg: '#EEE9FA',

  water: '#126A91',
  waterBg: '#E4F3FA',
  waterFill: '#1776A0',
  waterText: '#145B79',

  progressTrack: '#E1E9E7',

  streakBg: '#FFF8E8',
  streakBorder: '#EFDCA9',
  streakText: '#654A0D',
  streakIcon: '#B45B12',
  streakMuted: '#726342',

  foodThumbBg: '#F3EEE5',
  foodThumbIcon: '#795F33',

  alertBg: '#FFF9E7',
  alertBorder: '#BF8512',
  alertText: '#5F512D',

  welcomeOrb: '#FFE4D3',
  welcomeOrbDashed: '#F5A06F',
  welcomeSymbol: '#FF650B',

  navInactive: '#667775',
  mealOpenBorder: '#F3A172',
  nextMealSmall: '#D8F1ED',
  goalInputBg: '#F1F1F2',
} as const;

export type ColorToken = keyof typeof colors;

export const radius = {
  button: 14,
  field: 12,
  card: 14,
  chip: 12,
  pill: 99,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screen: 20,
  screenCompact: 15,
} as const;

/** Minimum touch target size (accessibility). */
export const TOUCH = 48;

function makeShadow(color: string, opacity: number, y: number, blur: number, elevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation, shadowColor: color },
    default: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowOffset: { width: 0, height: y },
      shadowRadius: blur / 2,
    },
  }) as ViewStyle;
}

export const shadows = {
  card: makeShadow('#28292E', 0.05, 4, 12, 1),
  strong: makeShadow('#28292E', 0.1, 8, 24, 6),
  primaryButton: makeShadow('#DC4B00', 0.22, 6, 14, 4),
  up: makeShadow('#28292E', 0.06, -4, 16, 8),
} as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
} as const;

export type FontWeightToken = 400 | 500 | 600 | 700 | 800;

export function fontFor(weight: FontWeightToken): string {
  switch (weight) {
    case 400:
      return fonts.regular;
    case 500:
      return fonts.medium;
    case 600:
      return fonts.semibold;
    case 700:
      return fonts.bold;
    case 800:
      return fonts.extrabold;
  }
}

export const iconDefaults = {
  size: 22,
  strokeWidth: 1.9,
} as const;
