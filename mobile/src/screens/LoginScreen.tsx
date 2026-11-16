import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Field, H1, Logo, Paragraph, Screen, TopBar, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import { resetToApp } from '../navigation/actions';
import type { AuthScreenProps } from '../navigation/types';
import { useApp } from '../store/AppContext';
import { colors, TOUCH } from '../theme/tokens';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const px = useScreenPadding();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await login(email, password); // mocked: accepts anything
      resetToApp(navigation);
    } finally {
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
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={submit}
          />
          <Pressable accessibilityRole="link" style={styles.forgot} hitSlop={4}>
            <Txt size={14} weight={800} color={colors.primary}>
              Esqueci minha senha
            </Txt>
          </Pressable>
        </View>

        <Button label="Entrar" onPress={submit} loading={loading} testID="login-submit" />

        <View style={styles.footer}>
          <Txt size={15} color={colors.muted}>
            Ainda não tem conta?
          </Txt>
          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate('Onboarding1')}
            style={styles.link}
          >
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
  forgot: { alignSelf: 'flex-end', minHeight: TOUCH, justifyContent: 'center' },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  link: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 4 },
});
