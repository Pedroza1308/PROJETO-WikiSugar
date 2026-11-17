import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { PASSWORD_RULES } from '../utils/validation';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** Live checklist of the minimum password requirements. */
export function PasswordRules({ password }: { password: string }) {
  return (
    <View style={styles.list}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View
            key={rule.id}
            style={styles.row}
            accessible
            accessibilityLabel={`${rule.label}: ${met ? 'atendido' : 'pendente'}`}
          >
            <Icon name={met ? 'check' : 'minus'} size={16} color={met ? colors.good : colors.muted} strokeWidth={2.4} />
            <Txt size={13} weight={700} color={met ? colors.good : colors.muted}>
              {rule.label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 22 },
});
