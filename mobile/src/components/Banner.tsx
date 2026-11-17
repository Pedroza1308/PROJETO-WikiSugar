import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { Icon } from './Icon';
import { Txt } from './Txt';

type Tone = 'error' | 'info' | 'success';

const TONES: Record<Tone, { fg: string; bg: string; border: string }> = {
  error: { fg: colors.danger, bg: colors.dangerBg, border: colors.danger },
  info: { fg: colors.alertText, bg: colors.alertBg, border: colors.alertBorder },
  success: { fg: colors.good, bg: colors.goodBg, border: colors.good },
};

/** Inline form/status message (announced to screen readers). */
export function Banner({ tone = 'error', title, message }: { tone?: Tone; title?: string; message: string }) {
  const t = TONES[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg, borderLeftColor: t.border }]}
      accessible
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
    >
      <Icon name={tone === 'success' ? 'check' : 'alert'} size={20} color={t.fg} />
      <View style={styles.body}>
        {title ? (
          <Txt size={14} weight={800} color={t.fg}>
            {title}
          </Txt>
        ) : null}
        <Txt size={13} weight={700} color={t.fg} lh={1.4}>
          {message}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderLeftWidth: 4,
    borderRadius: radius.card,
    padding: 12,
  },
  body: { flex: 1, gap: 2 },
});
