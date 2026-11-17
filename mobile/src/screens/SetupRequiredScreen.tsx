import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, H1, Icon, Logo, Paragraph, Screen, Txt } from '../components';
import { colors } from '../theme/tokens';

/** Shown when mobile/.env.local is missing, instead of crashing on the first request. */
export function SetupRequiredScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Logo />
        <View style={styles.icon}>
          <Icon name="settings" size={30} color={colors.primary} />
        </View>
        <H1 size={24}>Conecte o app ao Supabase</H1>
        <Paragraph>
          Crie o arquivo mobile/.env.local (use o mobile/.env.example como modelo) com a URL e a chave pública do projeto e
          reinicie o Expo.
        </Paragraph>
        <Card style={styles.card}>
          <Txt size={13} weight={700} selectable>
            EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
          </Txt>
          <Txt size={13} weight={700} selectable>
            EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…
          </Txt>
        </Card>
        <Paragraph size={14}>O passo a passo completo está em supabase/README.md.</Paragraph>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, gap: 16, justifyContent: 'center' },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { gap: 6 },
});
