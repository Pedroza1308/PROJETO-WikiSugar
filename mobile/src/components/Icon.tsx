import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, iconDefaults } from '../theme/tokens';

export type IconName =
  | 'arrow' | 'search' | 'home' | 'diet' | 'journal' | 'user' | 'flame' | 'droplet'
  | 'moon' | 'target' | 'clock' | 'plus' | 'check' | 'alert' | 'chevron' | 'utensils'
  | 'mail' | 'lock' | 'activity' | 'pill' | 'settings' | 'close' | 'minus'
  | 'users' | 'camera' | 'image' | 'trophy' | 'share' | 'eye' | 'eyeOff' | 'trash';

const paths: Record<IconName, React.ReactNode> = {
  arrow: (<><Path d="m15 18-6-6 6-6" /><Path d="M9 12h11" /></>),
  search: (<><Circle cx="11" cy="11" r="7" /><Path d="m20 20-4-4" /></>),
  home: (<><Path d="m3 11 9-8 9 8" /><Path d="M5 10v10h14V10M9 20v-6h6v6" /></>),
  diet: <Path d="M7 3v7a3 3 0 0 0 3 3V3M7 3v17M17 3v17M17 3c-2 2-2 7 0 9" />,
  journal: (<><Path d="M6 3h11a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z" /><Path d="M8 7h7M8 11h7M8 15h4" /></>),
  user: (<><Circle cx="12" cy="8" r="4" /><Path d="M4 21a8 8 0 0 1 16 0" /></>),
  flame: <Path d="M13 2s1 4-2 7c-2-2-4-2-4-2s-3 4-1 9a7 7 0 0 0 13-1c0-5-6-9-6-13Z" />,
  droplet: <Path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />,
  moon: <Path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />,
  target: (<><Circle cx="12" cy="12" r="9" /><Circle cx="12" cy="12" r="5" /><Circle cx="12" cy="12" r="1" /></>),
  clock: (<><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" /></>),
  plus: <Path d="M12 5v14M5 12h14" />,
  check: <Path d="m5 12 4 4L19 6" />,
  alert: (<><Path d="M12 3 2.5 20h19L12 3Z" /><Path d="M12 9v5M12 17h.01" /></>),
  chevron: <Path d="m9 18 6-6-6-6" />,
  utensils: <Path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c-3 3-3 8 0 10" />,
  mail: (<><Rect x="3" y="5" width="18" height="14" rx="2" /><Path d="m3 7 9 6 9-6" /></>),
  lock: (<><Rect x="5" y="10" width="14" height="11" rx="2" /><Path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  activity: <Path d="M3 12h4l2-6 4 12 2-6h6" />,
  pill: (<><Path d="m8 16 8-8a4 4 0 1 0-6-6l-8 8a4 4 0 1 0 6 6Z" /><Path d="m7 7 6 6" /></>),
  settings: (<><Circle cx="12" cy="12" r="3" /><Path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.4 6A7 7 0 0 0 8.9 7L6.5 6l-2 3.4L6.6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10.5 18l.3 2.6h4L15 18a7 7 0 0 0 1.5-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" /></>),
  // Extra helpers (not in the Figma icon set): close "×" and minus for the stepper.
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  minus: <Path d="M5 12h14" />,
  // Groups, check-ins and forms.
  users: (<><Circle cx="9" cy="8" r="4" /><Path d="M2 21a7 7 0 0 1 14 0" /><Path d="M16 4.1a4 4 0 0 1 0 7.8M22 21a7 7 0 0 0-4-6.3" /></>),
  camera: (<><Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><Circle cx="12" cy="13" r="3.5" /></>),
  image: (<><Rect x="3" y="3" width="18" height="18" rx="2" /><Circle cx="9" cy="9" r="2" /><Path d="m21 15-4-4-11 10" /></>),
  trophy: (<><Path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><Path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" /></>),
  share: (<><Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" /><Path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>),
  eye: (<><Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><Circle cx="12" cy="12" r="3" /></>),
  eyeOff: (<><Path d="m3 3 18 18" /><Path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
  trash: (<><Path d="M3 6h18M8 6V4h8v2" /><Path d="m19 6-1 14H6L5 6M10 11v5M14 11v5" /></>),
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = iconDefaults.size, color = colors.ink, strokeWidth = iconDefaults.strokeWidth }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {paths[name]}
    </Svg>
  );
}
