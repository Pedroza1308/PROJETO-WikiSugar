import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppleLogo, Button, H1, Logo, Paragraph, Screen } from '../components';
import { useScreenPadding } from '../hooks/ui';
import type { AuthScreenProps } from '../navigation/types';
import { colors, shadows } from '../theme/tokens';

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  const px = useScreenPadding();
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} bounces={false}>
        <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.orb} />
          <View style={styles.dashed} />
          <View style={styles.tile}>
            <View style={styles.counter}>
              <AppleLogo size={84} color={colors.welcomeSymbol} />
            </View>
          </View>
        </View>

        <View style={styles.text}>
          <Logo />
          <H1 size={30} style={styles.title}>
            Seu cuidado diário, mais simples.
          </H1>
          <Paragraph size={17}>Acompanhe alimentação, água, sono e hábitos com tranquilidade.</Paragraph>
        </View>

        <View style={styles.footer}>
          <Button label="Começar agora" onPress={() => navigation.navigate('Onboarding1')} testID="welcome-start" />
          <Button label="Já tenho uma conta" variant="ghost" onPress={() => navigation.navigate('Login')} testID="welcome-login" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 12 },
  art: { height: 300, alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', width: 245, height: 245, borderRadius: 123, backgroundColor: colors.welcomeOrb },
  dashed: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.welcomeOrbDashed,
  },
  tile: {
    width: 136,
    height: 136,
    borderRadius: 38,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
    ...shadows.strong,
  },
  counter: { transform: [{ rotate: '-4deg' }] },
  text: { gap: 14, marginTop: 8 },
  title: { marginTop: 6 },
  footer: { marginTop: 'auto', paddingTop: 28, gap: 6 },
});
