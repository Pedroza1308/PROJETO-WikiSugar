import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Button, Field, H1, Logo, Paragraph, Screen, TopBar, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import { messageFromError } from '../lib/errors';
import type { AuthScreenProps } from '../navigation/types';
import { useApp } from '../store/AppContext';
import { colors, TOUCH } from '../theme/tokens';
import { isValidEmail } from '../utils/validation';

export function LoginScreen({ navigation, route }: AuthScreenProps<'Login'>) {
  const px = useScreenPadding();
  const { signIn } = useApp();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.');
    if (!password) return setError('Informe sua senha.');
    setError(null);
    setLoading(true);
    try {
      // On success the session changes and the navigator switches to the app.
      await signIn(email, password);
    } catch (e) {
      setError(messageFromError(e, 'Não foi possível entrar. Tente novamente.'));
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} keyboard>
      <TopBar onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Logo />
          <H1 size={25} style={styles.title}>
            Que bom ter você de volta
          </H1>
          <Paragraph>Entre para acompanhar o seu dia.</Paragraph>
        </View>

        {route.params?.notice ? <Banner tone="info" message={route.params.notice} /> : null}
        {error ? <Banner message={error} /> : null}

        <View style={styles.form}>
          <Field
            label="E-mail"
            icon="mail"
            placeholder="voce@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Senha"
            icon="lock"
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={submit}
            rightIcon={showPassword ? 'eyeOff' : 'eye'}
            onRightIconPress={() => setShowPassword((v) => !v)}
            rightIconLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          />
        </View>

        <Button label="Entrar" onPress={submit} loading={loading} testID="login-submit" />

        <View style={styles.footer}>
          <Txt size={15} color={colors.muted}>
            Ainda não tem conta?
          </Txt>
          <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Onboarding1')} style={styles.link}>
            <Txt size={15} weight={800} color={colors.primary}>
              Criar conta
            </Txt>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 24, paddingBottom: 16, gap: 24 },
  intro: { gap: 10 },
  title: { marginTop: 10 },
  form: { gap: 16 },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  link: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 4 },
});
