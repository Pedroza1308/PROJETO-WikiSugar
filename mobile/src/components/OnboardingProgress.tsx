import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';
import { Txt } from './Txt';

export function OnboardingProgress({ step, total = 3 }: { step: number; total?: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Txt size={14} weight={700} color={colors.muted}>
          Passo {step} de {total}
        </Txt>
        <Txt size={14} weight={700} color={colors.muted}>
          {pct}%
        </Txt>
      </View>
      <ProgressBar value={step / total} height={8} accessibilityLabel={`Passo ${step} de ${total}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
