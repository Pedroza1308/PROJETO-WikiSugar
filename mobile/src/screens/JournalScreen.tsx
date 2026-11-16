import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Eyebrow, Field, H1, H2, IconTile, Paragraph, Pill, Screen, Toast, ToggleGroup, Txt } from '../components';
import type { IconName } from '../components';
import { useScreenPadding } from '../hooks/ui';
import type { TabScreenProps } from '../navigation/types';
import * as journalService from '../services/journalService';
import { useApp } from '../store/AppContext';
import { colors } from '../theme/tokens';
import type { JournalDraft } from '../types';
import { formatDayMonth, formatNumber, parseHours, parseLocaleNumber } from '../utils/format';

const WATER_STEPS = [250, 500] as const;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

type Errors = Partial<Record<'sleep' | 'medicationTime', string>>;

function validate(d: JournalDraft): Errors {
  const e: Errors = {};
  if (d.sleep.trim() && parseHours(d.sleep) === null) e.sleep = 'Use o formato 7h30, 7:30 ou 7,5.';
  if (d.tookMedication && d.medicationTime.trim() && !TIME_RE.test(d.medicationTime.trim())) {
    e.medicationTime = 'Use o formato 08:00.';
  }
  return e;
}

export function JournalScreen(_props: TabScreenProps<'JournalTab'>) {
  const px = useScreenPadding();
  const { saveJournal } = useApp();
  const [draft, setDraft] = useState<JournalDraft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void journalService.getTodayEntry().then(setDraft);
  }, []);

  if (!draft) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando diário" />
        </View>
      </Screen>
    );
  }

  const set = <K extends keyof JournalDraft>(key: K, value: JournalDraft[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setSaved(false);
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = async () => {
    const e = validate(draft);
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setSaving(true);
    try {
      await saveJournal(draft);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Pill label={`Hoje · ${formatDayMonth()}`} />
          <H1 size={26} style={styles.title}>
            Diário
          </H1>
          <Paragraph>Leva menos de dois minutos para registrar.</Paragraph>
        </View>

        {saved ? <Toast title="Diário salvo" message="Seu progresso de hoje foi atualizado." onClose={() => setSaved(false)} /> : null}

        <Section icon="droplet" title="Hidratação" color={colors.water} bg={colors.waterBg}>
          <Field
            label="Água bebida"
            value={draft.waterMl ? String(draft.waterMl) : ''}
            onChangeText={(t) => set('waterMl', Math.round(parseLocaleNumber(t)))}
            keyboardType="number-pad"
            placeholder="0"
            suffix="mL"
            accessibilityLabel="Água bebida em mililitros"
          />
          <View style={styles.row}>
            {WATER_STEPS.map((ml) => (
              <Chip
                key={ml}
                label={`${formatNumber(ml)} mL`}
                icon="plus"
                onPress={() => set('waterMl', draft.waterMl + ml)}
                style={styles.flex}
              />
            ))}
          </View>
        </Section>

        <Section icon="moon" title="Sono" color={colors.purple} bg={colors.purpleBg}>
          <Field
            label="Quanto você dormiu?"
            value={draft.sleep}
            onChangeText={(t) => set('sleep', t)}
            placeholder="7h30"
            autoCapitalize="none"
            accessibilityLabel="Horas de sono, por exemplo 7h30"
          />
          <FieldError text={errors.sleep} />
        </Section>

        <Section icon="pill" title="Medicação">
          <Txt size={15} weight={700}>
            Tomou sua medicação hoje?
          </Txt>
          <ToggleGroup value={draft.tookMedication} onChange={(v) => set('tookMedication', v)} accessibilityLabel="Tomou a medicação" />
          {draft.tookMedication ? (
            <>
              <Field
                label="Horário"
                icon="clock"
                value={draft.medicationTime}
                onChangeText={(t) => set('medicationTime', t.replace(/[^\d:]/g, '').slice(0, 5))}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
                accessibilityLabel="Horário da medicação"
              />
              <FieldError text={errors.medicationTime} />
            </>
          ) : null}
        </Section>

        <Section icon="activity" title="Atividade física" optional>
          <View style={styles.row}>
            <Field
              label="Tipo"
              value={draft.activityType}
              onChangeText={(t) => set('activityType', t)}
              placeholder="Caminhada"
              containerStyle={styles.grow}
            />
            <Field
              label="Duração"
              value={draft.activityMinutes}
              onChangeText={(t) => set('activityMinutes', t.replace(/\D/g, ''))}
              placeholder="30"
              keyboardType="number-pad"
              suffix="min"
              containerStyle={styles.flex}
              accessibilityLabel="Duração em minutos"
            />
          </View>
        </Section>

        <Section icon="journal" title="Como você se sentiu?" optional>
          <Field
            value={draft.notes}
            onChangeText={(t) => set('notes', t)}
            placeholder="Anote sintomas, humor ou algo importante do dia."
            multiline
            accessibilityLabel="Observações do dia"
          />
        </Section>

        <Button label={saved ? 'Salvo ✓' : 'Salvar registro'} onPress={save} loading={saving} testID="journal-save" />
      </ScrollView>
    </Screen>
  );
}

interface SectionProps {
  icon: IconName;
  title: string;
  color?: string;
  bg?: string;
  optional?: boolean;
  children: React.ReactNode;
}

function Section({ icon, title, color, bg, optional, children }: SectionProps) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        <IconTile name={icon} size={38} iconSize={20} color={color} bg={bg} />
        <H2 size={17} style={styles.flex}>
          {title}
        </H2>
        {optional ? <Eyebrow size={11} color={colors.muted}>OPCIONAL</Eyebrow> : null}
      </View>
      {children}
    </Card>
  );
}

function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <Txt size={13} weight={700} color={colors.danger} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      {text}
    </Txt>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flex: 1.6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 24, paddingBottom: 32, gap: 16 },
  intro: { gap: 6 },
  title: { marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
