import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { Button } from './Button';
import { Icon, IconName } from './Icon';
import { H2, Paragraph } from './Txt';

interface StateProps {
  icon: IconName;
  title: string;
  message?: string;
  iconColor: string;
  iconBg: string;
  action?: { label: string; onPress: () => void };
}

function StateView({ icon, title, message, iconColor, iconBg, action }: StateProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.orb, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={28} color={iconColor} />
      </View>
      <H2 size={19} align="center">
        {title}
      </H2>
      {message ? (
        <Paragraph size={14} align="center" style={styles.msg}>
          {message}
        </Paragraph>
      ) : null}
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} variant="secondary" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState(props: Omit<StateProps, 'iconColor' | 'iconBg'> & { icon?: IconName }) {
  return <StateView {...props} icon={props.icon ?? 'search'} iconColor={colors.primary} iconBg={colors.primarySoft} />;
}

export function ErrorState(props: Omit<StateProps, 'iconColor' | 'iconBg' | 'icon'>) {
  return <StateView {...props} icon="alert" iconColor={colors.danger} iconBg={colors.dangerBg} />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12, gap: 10 },
  orb: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  msg: { maxWidth: 300 },
  action: { alignSelf: 'stretch', marginTop: 10 },
});
