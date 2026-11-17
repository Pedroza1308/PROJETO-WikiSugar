import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, ErrorState, Eyebrow, H1, H2, Icon, IconTile, Paragraph, ProgressCard, Screen, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import { messageFromError } from '../lib/errors';
import type { HomeScreenProps } from '../navigation/types';
import * as groupService from '../services/groupService';
import { useApp } from '../store/AppContext';
import { colors, radius, shadows, TOUCH } from '../theme/tokens';
import type { GroupSummary } from '../types';
import { formatHours, formatLongDateUpper, formatNumber, formatShortDate } from '../utils/format';

export function HomeScreen({ navigation }: HomeScreenProps<'Home'>) {
  const px = useScreenPadding();
  const { user, goals, progress, nextMeal, streakDays, profileError, addWater, reloadProfile, refreshToday, signOut } = useApp();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await groupService.listMyGroups());
    } catch {
      setGroups((g) => g ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadGroups();
    }, [loadGroups]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshToday(), loadGroups()]);
    setRefreshing(false);
  };

  if (!user || !goals || !progress) {
    return (
      <Screen>
        {profileError ? (
          <View style={[styles.center, { paddingHorizontal: px }]}>
            <ErrorState
              title="Não foi possível carregar seus dados"
              message={profileError}
              action={{ label: 'Tentar de novo', onPress: () => void reloadProfile() }}
            />
            <Button label="Sair da conta" variant="ghost" onPress={() => void signOut()} />
          </View>
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando seus dados" />
          </View>
        )}
      </Screen>
    );
  }

  const today = new Date();
  const waterFull = progress.waterMl >= goals.waterMl;
  const totalPoints = (groups ?? []).reduce((sum, g) => sum + g.myPoints, 0);

  const onAddWater = () => {
    addWater(250).catch((e: unknown) => Alert.alert('Água não registrada', messageFromError(e)));
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: px }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.flex}>
            <Eyebrow size={12}>{formatLongDateUpper(today)}</Eyebrow>
            <H1 size={27} style={styles.hello}>
              Olá, {user.firstName}
            </H1>
            <Paragraph size={15}>Como você está se sentindo hoje?</Paragraph>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            style={styles.avatarBtn}
          >
            <Avatar initials={user.initials} uri={user.avatarUrl} size={52} />
          </Pressable>
        </View>

        <View
          style={styles.streak}
          accessible
          accessibilityLabel={
            streakDays > 0 ? `${streakDays} ${streakDays === 1 ? 'dia' : 'dias'} de cuidado seguido` : 'Comece sua sequência registrando algo hoje'
          }
        >
          <Icon name="flame" size={22} color={colors.streakIcon} />
          {streakDays > 0 ? (
            <Txt size={15} weight={800} color={colors.streakText}>
              {streakDays} {streakDays === 1 ? 'dia' : 'dias'}{' '}
              <Txt size={14} weight={600} color={colors.streakMuted}>
                de cuidado seguido
              </Txt>
            </Txt>
          ) : (
            <Txt size={14} weight={700} color={colors.streakText}>
              Registre algo hoje para começar sua sequência
            </Txt>
          )}
        </View>

        <View style={styles.sectionHead}>
          <H2 size={18}>Seu progresso hoje</H2>
          <Txt size={13} weight={700} color={colors.muted}>
            {formatShortDate(today)}
          </Txt>
        </View>

        <View style={styles.cards}>
          <ProgressCard
            kind="calories"
            label="Calorias"
            valueText={`${formatNumber(progress.caloriesKcal)} / ${formatNumber(goals.caloriesKcal)} kcal`}
            progress={progress.caloriesKcal / goals.caloriesKcal}
          />
          <ProgressCard
            kind="water"
            label="Água"
            valueText={`${formatNumber(progress.waterMl)} / ${formatNumber(goals.waterMl)} mL`}
            progress={progress.waterMl / goals.waterMl}
            action={{
              label: waterFull ? 'Meta ✓' : '+ 250 mL',
              accessibilityLabel: waterFull ? 'Meta de água atingida' : 'Adicionar 250 mililitros de água',
              onPress: onAddWater,
            }}
          />
          <ProgressCard
            kind="sleep"
            label="Sono"
            valueText={`${formatHours(progress.sleepHours)} / ${formatHours(goals.sleepHours)}`}
            progress={progress.sleepHours / goals.sleepHours}
          />
        </View>

        <View style={styles.groupCard}>
          <View style={styles.groupHead}>
            <IconTile name="trophy" size={45} />
            <View style={styles.flex}>
              <Txt size={16} weight={800}>
                Seus grupos
              </Txt>
              <Txt size={13} color={colors.muted}>
                {groups === null
                  ? 'Carregando…'
                  : groups.length === 0
                    ? 'Entre em um grupo para pontuar com amigos'
                    : `${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'} · ${formatNumber(totalPoints)} pontos no total`}
              </Txt>
            </View>
          </View>
          <View style={styles.groupActions}>
            <Button
              label="Fazer check-in"
              icon="camera"
              onPress={() => navigation.navigate('NewCheckin')}
              style={styles.flex}
              minHeight={48}
              testID="home-checkin"
            />
            <Button
              label="Grupos"
              variant="secondary"
              onPress={() => navigation.navigate('GroupsTab', { screen: 'Groups' })}
              style={styles.flex}
              minHeight={48}
            />
          </View>
        </View>

        {nextMeal ? (
          <Pressable
            onPress={() => navigation.navigate('DietTab')}
            accessibilityRole="button"
            accessibilityLabel={`Próxima refeição: ${nextMeal.title}, ${nextMeal.time}. Abrir Sua Dieta`}
            style={({ pressed }) => [styles.nextMeal, pressed && { backgroundColor: colors.primaryPressed }]}
          >
            <IconTile name="clock" size={45} color={colors.white} bg="rgba(255,255,255,0.18)" />
            <View style={styles.flex}>
              <Txt size={13} weight={600} color={colors.nextMealSmall}>
                Próxima refeição
              </Txt>
              <Txt size={18} weight={800} color={colors.white}>
                {nextMeal.title} · {nextMeal.time}
              </Txt>
            </View>
            <Icon name="chevron" size={22} color={colors.white} strokeWidth={2.2} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Meta pessoal. Revise e ajuste seus objetivos"
          style={({ pressed }) => [styles.goalCard, pressed && { backgroundColor: colors.primaryPale }]}
        >
          <IconTile name="target" size={45} />
          <View style={styles.flex}>
            <Txt size={16} weight={800}>
              Meta pessoal
            </Txt>
            <Txt size={13} color={colors.muted}>
              Revise e ajuste seus objetivos
            </Txt>
          </View>
          <Icon name="chevron" size={22} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  content: { paddingTop: 24, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hello: { marginTop: 4, marginBottom: 2 },
  avatarBtn: { minWidth: TOUCH, minHeight: TOUCH },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.streakBg,
    borderWidth: 1,
    borderColor: colors.streakBorder,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cards: { gap: 12 },
  groupCard: {
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 14,
    ...shadows.card,
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  groupActions: { flexDirection: 'row', gap: 10 },
  nextMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: 14,
    minHeight: 76,
    ...shadows.primaryButton,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 14,
    minHeight: 72,
    ...shadows.card,
  },
});
