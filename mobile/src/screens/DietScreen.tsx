import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Eyebrow, H1, Icon, IconTile, Pill, ProgressBar, Screen, Toast, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import type { TabScreenProps } from '../navigation/types';
import { useApp } from '../store/AppContext';
import { colors, radius, shadows } from '../theme/tokens';
import type { Meal } from '../types';
import { formatDayMonth, formatNumber } from '../utils/format';

const TOAST_MS = 4000;

export function DietScreen({ navigation }: TabScreenProps<'DietTab'>) {
  const px = useScreenPadding();
  const { meals, goals, addedNotice, dismissAddedNotice } = useApp();
  const [openId, setOpenId] = useState<string | null>(meals.find((m) => m.foods.length > 0)?.id ?? null);

  // Expand the meal that received the food and auto-dismiss the confirmation.
  useEffect(() => {
    if (!addedNotice) return;
    const target = meals.find((m) => m.title === addedNotice.mealTitle);
    if (target) setOpenId(target.id);
    const t = setTimeout(dismissAddedNotice, TOAST_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addedNotice, dismissAddedNotice]);

  const planned = meals.reduce((sum, m) => sum + m.kcal, 0);
  const goal = goals?.caloriesKcal ?? 0;
  const pct = goal > 0 ? planned / goal : 0;

  const goSearch = () => navigation.navigate('SearchTab', { screen: 'Search', params: undefined });

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]}>
        {addedNotice ? (
          <Toast
            title="Alimento adicionado"
            message={`${addedNotice.foodName} foi incluído em ${addedNotice.mealTitle}.`}
            onClose={dismissAddedNotice}
          />
        ) : null}

        <View style={styles.intro}>
          <Pill label={`Hoje · ${formatDayMonth()}`} />
          <H1 size={26} style={styles.title}>
            Sua dieta
          </H1>
          <Txt size={15} color={colors.muted}>
            Plano do dia organizado pela sua rotina.
          </Txt>
        </View>

        <Card style={styles.summary}>
          <View style={styles.summaryHead}>
            <View>
              <Eyebrow size={12}>Planejado</Eyebrow>
              <Txt size={22} weight={800}>
                {formatNumber(planned)}
                <Txt size={14} weight={700} color={colors.muted}>
                  {' '}
                  / {formatNumber(goal)} kcal
                </Txt>
              </Txt>
            </View>
            <View style={styles.pctBadge}>
              <Txt size={15} weight={800} color={colors.primary}>
                {Math.round(pct * 100)}%
              </Txt>
            </View>
          </View>
          <ProgressBar value={pct} height={10} accessibilityLabel={`${Math.round(pct * 100)} por cento planejado`} />
          <Txt size={13} color={colors.muted}>
            {pct >= 1 ? 'Meta de calorias planejada ✓' : `Faltam ${formatNumber(Math.max(goal - planned, 0))} kcal para completar o dia.`}
          </Txt>
        </Card>

        <View style={styles.meals}>
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              open={openId === meal.id}
              onToggle={() => setOpenId((id) => (id === meal.id ? null : meal.id))}
              onAdd={goSearch}
              onEdit={() => Alert.alert('Editar refeição', `A edição de “${meal.title}” estará disponível em breve.`)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

interface MealCardProps {
  meal: Meal;
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: () => void;
}

function MealCard({ meal, open, onToggle, onAdd, onEdit }: MealCardProps) {
  const empty = meal.foods.length === 0;
  return (
    <View style={[styles.meal, open && styles.mealOpen]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${meal.title}, ${meal.time}, ${empty ? 'sem alimentos' : `${formatNumber(meal.kcal)} quilocalorias`}`}
        accessibilityState={{ expanded: open }}
        style={styles.mealHead}
      >
        <IconTile name={empty ? 'clock' : 'utensils'} size={44} color={empty ? colors.muted : colors.primary} bg={empty ? colors.goalInputBg : colors.primarySoft} />
        <View style={styles.flex}>
          <Txt size={16} weight={800}>
            {meal.title}
          </Txt>
          <Txt size={13} color={colors.muted}>
            {meal.time} · {empty ? 'Nada planejado' : `${formatNumber(meal.kcal)} kcal`}
          </Txt>
        </View>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" size={20} color={colors.muted} />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.mealBody}>
          {empty ? (
            <Txt size={14} color={colors.muted}>
              Nenhum alimento ainda. Que tal adicionar algo?
            </Txt>
          ) : (
            meal.foods.map((f, i) => {
              const [name, amount] = f.split(' · ');
              return (
                <View key={`${f}-${i}`} style={styles.food}>
                  <View style={styles.dot} />
                  <Txt size={15} weight={700} style={styles.flex}>
                    {name}
                  </Txt>
                  {amount ? (
                    <Txt size={13} weight={700} color={colors.muted}>
                      {amount}
                    </Txt>
                  ) : null}
                </View>
              );
            })
          )}
          <View style={styles.actions}>
            {!empty ? <Chip label="Editar" onPress={onEdit} style={styles.flex} /> : null}
            <Chip label="Adicionar" icon="plus" onPress={onAdd} style={styles.flex} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 24, paddingBottom: 32, gap: 16 },
  intro: { gap: 6 },
  title: { marginTop: 4 },
  summary: { gap: 12 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pctBadge: {
    minWidth: 58,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  meals: { gap: 12 },
  meal: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    ...shadows.card,
  },
  mealOpen: { borderColor: colors.mealOpenBorder, borderWidth: 1.5 },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, minHeight: 70 },
  mealBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 12 },
  food: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
