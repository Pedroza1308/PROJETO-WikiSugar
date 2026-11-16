import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Eyebrow,
  Field,
  GoalInput,
  H1,
  Icon,
  MultiSelect,
  OnboardingProgress,
  Paragraph,
  Screen,
  SegmentedControl,
  TopBar,
  Txt,
} from '../components';
import { useScreenPadding } from '../hooks/ui';
import { resetToApp } from '../navigation/actions';
import type { AuthScreenProps } from '../navigation/types';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme/tokens';
import type { DiabetesType, Restriction } from '../types';

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

export function Onboarding1Screen({ navigation }: AuthScreenProps<'Onboarding1'>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  return (
    <OnboardingLayout
      step={1}
      onBack={() => navigation.goBack()}
      eyebrow="Vamos nos conhecer"
      title="Como podemos chamar você?"
      description="Usaremos esses dados somente para personalizar sua experiência."
      footer={<Button label="Continuar" onPress={() => navigation.navigate('Onboarding2', { name, email })} testID="onb1-continue" />}
    >
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
      />
    </OnboardingLayout>
  );
}

export function Onboarding2Screen({ navigation, route }: AuthScreenProps<'Onboarding2'>) {
  const [diabetesType, setDiabetesType] = useState<DiabetesType>('Tipo 2');
  const [restrictions, setRestrictions] = useState<string[]>(['Açúcar']);
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
          onPress={() => navigation.navigate('Onboarding3', { ...route.params, diabetesType, restrictions })}
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
          Seus dados de saúde ficam protegidos.
        </Txt>
      </View>
    </OnboardingLayout>
  );
}

export function Onboarding3Screen({ navigation, route }: AuthScreenProps<'Onboarding3'>) {
  const { register, goals } = useApp();
  const [calories, setCalories] = useState(goals?.caloriesKcal ?? 2300);
  const [water, setWater] = useState(goals?.waterMl ?? 2900);
  const [sleep, setSleep] = useState(goals?.sleepHours ?? 8);
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      await register({
        ...route.params,
        goals: { caloriesKcal: calories, waterMl: water, sleepHours: sleep },
      });
      resetToApp(navigation);
    } finally {
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
      footer={<Button label="Concluir e ver meu dia" onPress={finish} loading={loading} testID="onb3-finish" />}
    >
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
