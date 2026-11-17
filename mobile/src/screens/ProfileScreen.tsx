import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Avatar,
  Banner,
  Button,
  Card,
  choosePhoto,
  GoalInput,
  H1,
  H2,
  Icon,
  Paragraph,
  Screen,
  SegmentedControl,
  Toast,
  TopBar,
  Txt,
} from '../components';
import { validateGoals } from '../config/rules';
import { useScreenPadding } from '../hooks/ui';
import { messageFromError } from '../lib/errors';
import type { HomeScreenProps } from '../navigation/types';
import * as checkinService from '../services/checkinService';
import * as groupService from '../services/groupService';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme/tokens';
import type { DailyGoals, FontScale, GroupSummary, MyCheckin } from '../types';
import { formatDateTime, formatDateTimeLong, formatNumber } from '../utils/format';

const FONT_OPTIONS = ['Padrão', 'Grande', 'Maior'] as const;
type FontOption = (typeof FONT_OPTIONS)[number];
const FONT_TO_SCALE: Record<FontOption, FontScale> = { Padrão: 1, Grande: 1.15, Maior: 1.3 };
const SCALE_TO_FONT: Record<FontScale, FontOption> = { 1: 'Padrão', 1.15: 'Grande', 1.3: 'Maior' };
const GALLERY_COLUMNS = 3;
const GALLERY_GAP = 6;

export function ProfileScreen({ navigation }: HomeScreenProps<'Profile'>) {
  const px = useScreenPadding();
  const { width } = useWindowDimensions();
  const { user, goals, saveGoals, fontScale, setFontScale, signOut, updateAvatar, streakDays } = useApp();
  const [draft, setDraft] = useState<DailyGoals | null>(goals);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [checkins, setCheckins] = useState<MyCheckin[] | null>(null);
  const [historyEnd, setHistoryEnd] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (goals && !draft) setDraft(goals);
  }, [goals, draft]);

  const loadHistory = useCallback(async () => {
    try {
      const [mine, list] = await Promise.all([checkinService.getMyCheckins(), groupService.listMyGroups()]);
      setCheckins(mine);
      setHistoryEnd(mine.length < checkinService.MY_CHECKINS_PAGE_SIZE);
      setGroups(list);
      setHistoryError(null);
    } catch (e) {
      setCheckins((c) => c ?? []);
      setHistoryError(messageFromError(e, 'Não foi possível carregar seu histórico.'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const loadMore = async () => {
    if (!checkins || checkins.length === 0 || historyEnd || loadingMore) return;
    setLoadingMore(true);
    try {
      const older = await checkinService.getMyCheckins(checkins[checkins.length - 1].createdAt);
      setCheckins((c) => [...(c ?? []), ...older]);
      setHistoryEnd(older.length < checkinService.MY_CHECKINS_PAGE_SIZE);
    } catch (e) {
      Alert.alert('Histórico', messageFromError(e));
    } finally {
      setLoadingMore(false);
    }
  };

  if (!user || !draft) {
    return (
      <Screen>
        <TopBar title="Perfil" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const dirty = !!goals && (Object.keys(draft) as (keyof DailyGoals)[]).some((k) => draft[k] !== goals[k]);
  const update = (key: keyof DailyGoals) => (value: number) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setSaved(false);
    setGoalError(null);
  };

  const save = async () => {
    const invalid = validateGoals(draft);
    if (invalid) return setGoalError(invalid);
    setSaving(true);
    try {
      await saveGoals(draft);
      setSaved(true);
    } catch (e) {
      setGoalError(messageFromError(e, 'Não foi possível salvar as metas.'));
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async () => {
    try {
      const photo = await choosePhoto('Foto de perfil', { square: true });
      if (!photo) return;
      setAvatarBusy(true);
      await updateAvatar(photo);
    } catch (e) {
      Alert.alert('Foto de perfil', messageFromError(e, 'Não foi possível trocar a foto.'));
    } finally {
      setAvatarBusy(false);
    }
  };

  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut(); // the navigator switches to the auth flow
    } catch (e) {
      setSigningOut(false);
      Alert.alert('Sair', messageFromError(e));
    }
  };

  const totalPoints = groups.reduce((sum, g) => sum + g.myPoints, 0);
  const tile = Math.floor((width - px * 2 - GALLERY_GAP * (GALLERY_COLUMNS - 1)) / GALLERY_COLUMNS);
  const tags = [
    user.diabetesType === 'Não tenho' ? 'Sem diabetes' : `Diabetes ${user.diabetesType}`,
    ...user.restrictions.map((r) => `Sem ${r.toLowerCase()}`),
  ];

  return (
    <Screen keyboard>
      <TopBar title="Perfil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Pressable
            onPress={changeAvatar}
            disabled={avatarBusy}
            accessibilityRole="button"
            accessibilityLabel={user.avatarUrl ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
            style={styles.avatarBtn}
          >
            <Avatar initials={user.initials} uri={user.avatarUrl} size={76} />
            <View style={styles.avatarBadge}>
              {avatarBusy ? <ActivityIndicator size="small" color={colors.white} /> : <Icon name="camera" size={15} color={colors.white} />}
            </View>
          </Pressable>
          <View style={styles.flex}>
            <H1 size={23}>{user.name}</H1>
            <Txt size={14} color={colors.muted}>
              {user.email}
            </Txt>
            <View style={styles.streak}>
              <Icon name="flame" size={16} color={colors.streakIcon} />
              <Txt size={13} weight={800} color={colors.streakText}>
                {streakDays} {streakDays === 1 ? 'dia seguido' : 'dias seguidos'}
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

        {/* Points per group (each group keeps its own score) */}
        <Card style={styles.group}>
          <View style={styles.rowBetween}>
            <H2 size={18}>Seus pontos</H2>
            <Txt size={18} weight={800} color={colors.primary}>
              {formatNumber(totalPoints)} pts
            </Txt>
          </View>
          {groups.length === 0 ? (
            <Paragraph size={14}>Entre em um grupo e publique check-ins para pontuar.</Paragraph>
          ) : (
            groups.map((g) => (
              <View key={g.id} style={styles.pointRow} accessible accessibilityLabel={`${g.name}: ${g.myPoints} pontos, ${g.myRank}º lugar`}>
                <Icon name="trophy" size={16} color={colors.primary} />
                <Txt size={14} weight={700} style={styles.flex} numberOfLines={1}>
                  {g.name}
                </Txt>
                <Txt size={13} color={colors.muted}>
                  {g.myRank}º lugar
                </Txt>
                <Txt size={14} weight={800}>
                  {formatNumber(g.myPoints)} pts
                </Txt>
              </View>
            ))
          )}
        </Card>

        {/* Personal gallery, newest first */}
        <View style={styles.group}>
          <H2 size={18}>Minhas fotos</H2>
          {historyError ? <Banner message={historyError} /> : null}
          {checkins === null ? (
            <ActivityIndicator color={colors.primary} />
          ) : checkins.length === 0 ? (
            <Paragraph size={14}>Seus check-ins aparecem aqui, do mais recente para o mais antigo.</Paragraph>
          ) : (
            <View style={styles.gallery}>
              {checkins.map((c) =>
                c.photoUrl ? (
                  <Image
                    key={c.checkinId}
                    source={{ uri: c.photoUrl }}
                    style={{ width: tile, height: tile, borderRadius: 8, backgroundColor: colors.goalInputBg }}
                    accessibilityLabel={`Foto de ${formatDateTimeLong(c.createdAt)}${c.caption ? `: ${c.caption}` : ''}`}
                  />
                ) : (
                  <View key={c.checkinId} style={[styles.missing, { width: tile, height: tile }]}>
                    <Icon name="image" size={22} color={colors.muted} />
                  </View>
                ),
              )}
            </View>
          )}
        </View>

        {/* Points history */}
        {checkins && checkins.length > 0 ? (
          <View style={styles.group}>
            <H2 size={18}>Histórico de pontos</H2>
            {checkins.map((c) => (
              <View
                key={c.checkinId}
                style={styles.historyRow}
                accessible
                accessibilityLabel={`${formatDateTimeLong(c.createdAt)}. ${c.caption ?? 'Sem legenda'}. ${c.groups
                  .map((g) => `${g.points} pontos em ${g.name}`)
                  .join(', ')}`}
              >
                <View style={styles.flex}>
                  <Txt size={13} weight={800} color={colors.muted}>
                    {formatDateTime(c.createdAt)}
                  </Txt>
                  {c.caption ? (
                    <Txt size={14} numberOfLines={2}>
                      {c.caption}
                    </Txt>
                  ) : null}
                  <Txt size={12} color={colors.muted}>
                    {c.groups.map((g) => `+${g.points} em ${g.name}`).join(' · ')}
                  </Txt>
                </View>
                <Txt size={15} weight={800} color={colors.good}>
                  +{c.totalPoints}
                </Txt>
              </View>
            ))}
            {!historyEnd ? (
              <Button label="Ver mais" variant="ghost" onPress={() => void loadMore()} loading={loadingMore} minHeight={46} />
            ) : null}
          </View>
        ) : null}

        {saved ? <Toast title="Metas atualizadas" message="Seu painel já usa os novos valores." onClose={() => setSaved(false)} /> : null}

        <View style={styles.group}>
          <H2 size={18}>Meta pessoal</H2>
          <Paragraph size={14}>Ajuste seus objetivos diários quando quiser.</Paragraph>
          <GoalInput icon="target" label="Calorias" unit="kcal" value={draft.caloriesKcal} onChangeValue={update('caloriesKcal')} />
          <GoalInput icon="droplet" label="Água" unit="mL" value={draft.waterMl} onChangeValue={update('waterMl')} />
          <GoalInput icon="moon" label="Sono" unit="horas" value={draft.sleepHours} onChangeValue={update('sleepHours')} allowDecimal />
          <GoalInput icon="utensils" label="Carboidratos" sublabel="limite por dia" unit="g" value={draft.carbLimitG} onChangeValue={update('carbLimitG')} />
          {goalError ? <Banner message={goalError} /> : null}
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

        <Button label="Sair da conta" variant="secondary" onPress={logout} loading={signingOut} testID="profile-logout" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 20, paddingBottom: 32, gap: 18 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarBtn: { width: 76, height: 76 },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: GALLERY_GAP },
  missing: { borderRadius: 8, backgroundColor: colors.goalInputBg, alignItems: 'center', justifyContent: 'center' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 12,
  },
  preview: { backgroundColor: colors.goalInputBg, borderRadius: radius.field, padding: 12 },
});
