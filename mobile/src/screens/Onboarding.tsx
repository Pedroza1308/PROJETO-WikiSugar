import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Banner,
  Button,
  choosePhoto,
  Eyebrow,
  Field,
  GoalInput,
  H1,
  Icon,
  MultiSelect,
  OnboardingProgress,
  PasswordRules,
  Paragraph,
  Screen,
  SegmentedControl,
  TopBar,
  Txt,
} from '../components';
import { validateGoals } from '../config/rules';
import { useScreenPadding } from '../hooks/ui';
import { messageFromError } from '../lib/errors';
import type { AuthScreenProps } from '../navigation/types';
import * as authService from '../services/authService';
import { useApp } from '../store/AppContext';
import { useSignupDraft } from '../store/SignupDraft';
import { colors, radius, TOUCH } from '../theme/tokens';
import type { DiabetesType, Restriction } from '../types';
import { isStrongPassword, isValidEmail } from '../utils/validation';

const DIABETES_TYPES: readonly DiabetesType[] = ['Tipo 1', 'Tipo 2', 'Gestacional', 'Não tenho'];
const RESTRICTIONS: readonly Restriction[] = ['Glúten', 'Lactose', 'Açúcar', 'Outro'];

interface LayoutProps {
  step: number;
  onBack: () => void;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

function OnboardingLayout({ step, onBack, eyebrow, title, description, children, footer }: LayoutProps) {
  const px = useScreenPadding();
  return (
    <Screen edges={['top', 'bottom']} keyboard>
      <TopBar title="Criar sua conta" onBack={onBack} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: px }]}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingProgress step={step} />
        <View style={styles.intro}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <H1 size={25}>{title}</H1>
          <Paragraph>{description}</Paragraph>
        </View>
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingHorizontal: px }]}>{footer}</View>
    </Screen>
  );
}

type Step1Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'form', string>>;

export function Onboarding1Screen({ navigation }: AuthScreenProps<'Onboarding1'>) {
  const { draft, update } = useSignupDraft();
  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [password, setPassword] = useState(draft.password);
  const [confirm, setConfirm] = useState(draft.password);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Step1Errors>({});
  const [checking, setChecking] = useState(false);

  const pickAvatar = async () => {
    try {
      const photo = await choosePhoto('Foto de perfil', { square: true });
      if (photo) update({ avatar: photo });
    } catch (e) {
      setErrors((x) => ({ ...x, form: messageFromError(e) }));
    }
  };

  const next = async () => {
    const e: Step1Errors = {};
    if (name.trim().length < 2) e.name = 'Informe seu nome.';
    if (!isValidEmail(email)) e.email = 'Informe um e-mail válido.';
    if (!isStrongPassword(password)) e.password = 'A senha ainda não atende aos requisitos abaixo.';
    if (confirm !== password) e.confirm = 'As senhas não são iguais.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setChecking(true);
    try {
      if (!(await authService.isEmailAvailable(email))) {
        setErrors({ email: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' });
        return;
      }
      update({ name: name.trim(), email: email.trim().toLowerCase(), password });
      navigation.navigate('Onboarding2');
    } catch (err) {
      setErrors({ form: messageFromError(err, 'Não foi possível verificar o e-mail. Tente novamente.') });
    } finally {
      setChecking(false);
    }
  };

  return (
    <OnboardingLayout
      step={1}
      onBack={() => navigation.goBack()}
      eyebrow="Vamos nos conhecer"
      title="Crie seu acesso"
      description="Seu e-mail e sua senha serão usados para entrar no app."
      footer={<Button label="Continuar" onPress={next} loading={checking} testID="onb1-continue" />}
    >
      {errors.form ? <Banner message={errors.form} /> : null}

      <View style={styles.avatarRow}>
        <Pressable
          onPress={pickAvatar}
          accessibilityRole="button"
          accessibilityLabel={draft.avatar ? 'Trocar foto de perfil' : 'Adicionar foto de perfil (opcional)'}
          style={({ pressed }) => [styles.avatarPick, pressed && { opacity: 0.8 }]}
        >
          {draft.avatar ? (
            <Image source={{ uri: draft.avatar.uri }} style={styles.avatarImg} accessibilityIgnoresInvertColors />
          ) : (
            <Icon name="camera" size={28} color={colors.primary} />
          )}
        </Pressable>
        <View style={styles.flex}>
          <Txt size={15} weight={800}>
            Foto de perfil
          </Txt>
          <Txt size={13} color={colors.muted}>
            Opcional. Aparece para os membros dos seus grupos.
          </Txt>
          {draft.avatar ? (
            <Pressable onPress={() => update({ avatar: null })} accessibilityRole="button" style={styles.removeLink} hitSlop={6}>
              <Txt size={13} weight={800} color={colors.primary}>
                Remover foto
              </Txt>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Field
        label="Nome"
        icon="user"
        placeholder="Seu nome"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        error={errors.name}
      />
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
        error={errors.email}
      />
      <Field
        label="Senha"
        icon="lock"
        placeholder="Crie uma senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        rightIcon={showPassword ? 'eyeOff' : 'eye'}
        onRightIconPress={() => setShowPassword((v) => !v)}
        rightIconLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        error={errors.password}
      />
      <PasswordRules password={password} />
      <Field
        label="Confirme a senha"
        icon="lock"
        placeholder="Repita a senha"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.confirm}
      />
    </OnboardingLayout>
  );
}

export function Onboarding2Screen({ navigation }: AuthScreenProps<'Onboarding2'>) {
  const { draft, update } = useSignupDraft();
  const [diabetesType, setDiabetesType] = useState<DiabetesType>(draft.diabetesType);
  const [restrictions, setRestrictions] = useState<string[]>(draft.restrictions);
  return (
    <OnboardingLayout
      step={2}
      onBack={() => navigation.goBack()}
      eyebrow="Seu perfil de saúde"
      title="O que devemos considerar?"
      description="Assim, mostramos alertas mais úteis para você."
      footer={
        <Button
          label="Continuar"
          onPress={() => {
            update({ diabetesType, restrictions });
            navigation.navigate('Onboarding3');
          }}
          testID="onb2-continue"
        />
      }
    >
      <View style={styles.group}>
        <Txt size={15} weight={700}>
          Tipo de diabetes
        </Txt>
        <SegmentedControl options={DIABETES_TYPES} value={diabetesType} onChange={setDiabetesType} accessibilityLabel="Tipo de diabetes" />
      </View>
      <View style={styles.group}>
        <Txt size={15} weight={700}>
          Restrições alimentares
        </Txt>
        <MultiSelect options={RESTRICTIONS} values={restrictions} onChange={setRestrictions} accessibilityLabel="Restrições alimentares" />
      </View>
      <View style={styles.note}>
        <Icon name="lock" size={18} color={colors.primary} />
        <Txt size={14} weight={700} color={colors.primary} style={styles.flex}>
          Seus dados de saúde ficam visíveis só para você.
        </Txt>
      </View>
    </OnboardingLayout>
  );
}

export function Onboarding3Screen({ navigation }: AuthScreenProps<'Onboarding3'>) {
  const { signUp } = useApp();
  const { draft, update, reset } = useSignupDraft();
  const [calories, setCalories] = useState(draft.goals.caloriesKcal);
  const [water, setWater] = useState(draft.goals.waterMl);
  const [sleep, setSleep] = useState(draft.goals.sleepHours);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    const goals = { caloriesKcal: calories, waterMl: water, sleepHours: sleep };
    const invalid = validateGoals(goals);
    if (invalid) return setError(invalid);
    setError(null);
    update({ goals });
    setLoading(true);
    try {
      const result = await signUp({ ...draft, goals, avatar: draft.avatar });
      if (result.needsEmailConfirmation) {
        // Supabase requires e-mail confirmation: no session yet.
        const email = draft.email;
        reset();
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Welcome' },
            {
              name: 'Login',
              params: {
                email,
                notice:
                  'Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre aqui.' +
                  (draft.avatar ? ' Você poderá adicionar a foto de perfil no seu perfil.' : ''),
              },
            },
          ],
        });
        return;
      }
      // With a session the navigator switches to the app automatically.
      reset();
    } catch (e) {
      setError(messageFromError(e, 'Não foi possível criar sua conta. Tente novamente.'));
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={3}
      onBack={() => navigation.goBack()}
      eyebrow="Metas diárias"
      title="Comece com uma meta possível"
      description="Sugerimos estes valores. Você pode alterá-los quando quiser."
      footer={<Button label="Criar conta e ver meu dia" onPress={finish} loading={loading} testID="onb3-finish" />}
    >
      {error ? <Banner message={error} /> : null}
      <GoalInput icon="target" label="Calorias" unit="kcal" value={calories} onChangeValue={setCalories} />
      <GoalInput icon="droplet" label="Água" unit="mL" value={water} onChangeValue={setWater} />
      <GoalInput icon="moon" label="Sono" unit="horas" value={sleep} onChangeValue={setSleep} allowDecimal />
      <View style={styles.tip}>
        <Icon name="check" size={18} color={colors.good} strokeWidth={2.3} />
        <Txt size={14} weight={700} color={colors.good} style={styles.flex}>
          Metas equilibradas para começar sem pressão.
        </Txt>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 24, gap: 22 },
  intro: { gap: 8 },
  body: { gap: 18 },
  group: { gap: 10 },
  footer: { paddingTop: 12, paddingBottom: 12, backgroundColor: colors.screenBg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarPick: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.welcomeOrbDashed,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 76, height: 76 },
  removeLink: { minHeight: TOUCH - 16, justifyContent: 'center', alignSelf: 'flex-start' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.field,
    padding: 14,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.goodBg,
    borderRadius: radius.field,
    padding: 14,
  },
});
