import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Eyebrow, H1, H2, Icon, IconTile, Paragraph, ProgressCard, Screen, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import type { HomeScreenProps } from '../navigation/types';
import { useApp } from '../store/AppContext';
import { colors, radius, shadows, TOUCH } from '../theme/tokens';
import { formatHours, formatLongDateUpper, formatNumber, formatShortDate } from '../utils/format';

export function HomeScreen({ navigation }: HomeScreenProps<'Home'>) {
  const px = useScreenPadding();
  const { user, goals, progress, nextMeal, addWater } = useApp();
  if (!user || !goals || !progress) return <Screen>{null}</Screen>;

  const today = new Date();
  const waterFull = progress.waterMl >= goals.waterMl;

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]}>
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
            <Avatar initials={user.initials} size={52} />
          </Pressable>
        </View>

        <View style={styles.streak} accessible accessibilityLabel={`${user.streakDays} dias de cuidado seguido`}>
          <Icon name="flame" size={22} color={colors.streakIcon} />
          <Txt size={15} weight={800} color={colors.streakText}>
            {user.streakDays} dias{' '}
            <Txt size={14} weight={600} color={colors.streakMuted}>
              de cuidado seguido
            </Txt>
          </Txt>
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
              onPress: () => addWater(250),
            }}
          />
          <ProgressCard
            kind="sleep"
            label="Sono"
            valueText={`${formatHours(progress.sleepHours)} / ${formatHours(goals.sleepHours)}`}
            progress={progress.sleepHours / goals.sleepHours}
          />
        </View>

        {nextMeal ? (
          <Pressable
            onPress={() => navigation.navigate('DietTab')}
            accessibilityRole="button"
            accessibilityLabel={`Próxima refeição: ${nextMeal.title} às ${nextMeal.time}. Abrir Sua Dieta`}
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
