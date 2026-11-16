import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { AppleLogo } from './AppleLogo';
import { Txt } from './Txt';

export function Logo({ compact = false }: { compact?: boolean }) {
  const textSize = compact ? 18 : 25;
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="WikiSugar">
      <AppleLogo size={compact ? 34 : 48} color={colors.primary} />
      <Txt size={textSize} weight={700} color={colors.ink} ls={-0.3}>
        Wiki
        <Txt size={textSize} weight={800} color={colors.primary} ls={-0.3}>
          Sugar
        </Txt>
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
