import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, GoalInput, H1, H2, Icon, Paragraph, Screen, SegmentedControl, Toast, TopBar, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import { resetToAuth } from '../navigation/actions';
import type { HomeScreenProps } from '../navigation/types';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme/tokens';
import type { DailyGoals, FontScale } from '../types';

const FONT_OPTIONS = ['Padrão', 'Grande', 'Maior'] as const;
type FontOption = (typeof FONT_OPTIONS)[number];
const FONT_TO_SCALE: Record<FontOption, FontScale> = { Padrão: 1, Grande: 1.15, Maior: 1.3 };
const SCALE_TO_FONT: Record<FontScale, FontOption> = { 1: 'Padrão', 1.15: 'Grande', 1.3: 'Maior' };

export function ProfileScreen({ navigation }: HomeScreenProps<'Profile'>) {
  const px = useScreenPadding();
  const { user, goals, saveGoals, fontScale, setFontScale } = useApp();
  const [draft, setDraft] = useState<DailyGoals | null>(goals);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (goals && !draft) setDraft(goals);
  }, [goals, draft]);

  if (!user || !draft) return <Screen>{null}</Screen>;

  const dirty = !!goals && (Object.keys(draft) as (keyof DailyGoals)[]).some((k) => draft[k] !== goals[k]);
  const update = (key: keyof DailyGoals) => (value: number) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveGoals(draft);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const tags = [user.diabetesType === 'Não tenho' ? 'Sem diabetes' : `Diabetes ${user.diabetesType}`, ...user.restrictions.map((r) => `Sem ${r.toLowerCase()}`)];

  return (
    <Screen keyboard>
      <TopBar title="Perfil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Avatar initials={user.initials} size={76} />
          <View style={styles.flex}>
            <H1 size={23}>{user.name}</H1>
            <Txt size={14} color={colors.muted}>
              {user.email}
            </Txt>
            <View style={styles.streak}>
              <Icon name="flame" size={16} color={colors.streakIcon} />
              <Txt size={13} weight={800} color={colors.streakText}>
                {user.streakDays} dias seguidos
              </Txt>
            </View>
          </View>
        </View>

        <View style={styles.tags} accessibilityLabel={`Perfil de saúde: ${tags.join(', ')}`}>
          {tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Txt size={13} weight={800} color={colors.primary}>
                {t}
              </Txt>
            </View>
          ))}
        </View>

        {saved ? <Toast title="Metas atualizadas" message="Seu painel já usa os novos valores." onClose={() => setSaved(false)} /> : null}

        <View style={styles.group}>
          <H2 size={18}>Meta pessoal</H2>
          <Paragraph size={14}>Ajuste seus objetivos diários quando quiser.</Paragraph>
          <GoalInput icon="target" label="Calorias" unit="kcal" value={draft.caloriesKcal} onChangeValue={update('caloriesKcal')} />
          <GoalInput icon="droplet" label="Água" unit="mL" value={draft.waterMl} onChangeValue={update('waterMl')} />
          <GoalInput icon="moon" label="Sono" unit="horas" value={draft.sleepHours} onChangeValue={update('sleepHours')} allowDecimal />
          <GoalInput icon="utensils" label="Carboidratos" sublabel="limite por dia" unit="g" value={draft.carbLimitG} onChangeValue={update('carbLimitG')} />
          <Button label="Salvar metas" onPress={save} loading={saving} disabled={!dirty} testID="profile-save-goals" />
        </View>

        <Card style={styles.group}>
          <H2 size={18}>Tamanho do texto</H2>
          <Paragraph size={14}>Deixe a leitura mais confortável.</Paragraph>
          <SegmentedControl
            options={FONT_OPTIONS}
            value={SCALE_TO_FONT[fontScale]}
            onChange={(o) => setFontScale(FONT_TO_SCALE[o])}
            accessibilityLabel="Tamanho do texto"
          />
          <View style={styles.preview}>
            <Txt size={15} color={colors.muted}>
              Assim ficará o texto no aplicativo.
            </Txt>
          </View>
        </Card>

        <Button label="Sair da conta" variant="secondary" onPress={() => resetToAuth(navigation)} testID="profile-logout" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 32, gap: 18 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 8,
    backgroundColor: colors.streakBg,
    borderWidth: 1,
    borderColor: colors.streakBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  group: { gap: 12 },
  preview: { backgroundColor: colors.goalInputBg, borderRadius: radius.field, padding: 12 },
});
