import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Eyebrow, H1, Icon, IconTile, Pill, ProgressBar, Screen, Toast, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import { messageFromError } from '../lib/errors';
import type { TabScreenProps } from '../navigation/types';
import { useApp } from '../store/AppContext';
import { colors, radius, shadows, TOUCH } from '../theme/tokens';
import type { Meal, MealSlot } from '../types';
import { formatDayMonth, formatNumber } from '../utils/format';

const TOAST_MS = 4000;

export function DietScreen({ navigation }: TabScreenProps<'DietTab'>) {
  const px = useScreenPadding();
  const { meals, goals, addedNotice, dismissAddedNotice, removeMealItem } = useApp();
  const [openId, setOpenId] = useState<MealSlot | null>(meals.find((m) => m.items.length > 0)?.id ?? null);
  const [editingId, setEditingId] = useState<MealSlot | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Expand the meal that received the food and auto-dismiss the confirmation.
  useEffect(() => {
    if (!addedNotice) return;
    setOpenId(addedNotice.mealId);
    const t = setTimeout(dismissAddedNotice, TOAST_MS);
    return () => clearTimeout(t);
  }, [addedNotice, dismissAddedNotice]);

  const planned = meals.reduce((sum, m) => sum + m.kcal, 0);
  const goal = goals?.caloriesKcal ?? 0;
  const pct = goal > 0 ? planned / goal : 0;

  const goSearch = (slot: MealSlot) => navigation.navigate('SearchTab', { screen: 'Search', params: { slot } });

  const remove = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      await removeMealItem(itemId);
    } catch (e) {
      Alert.alert('Não foi possível remover', messageFromError(e));
    } finally {
      setRemovingId(null);
    }
  };

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
              editing={editingId === meal.id}
              removingId={removingId}
              onToggle={() => setOpenId((id) => (id === meal.id ? null : meal.id))}
              onAdd={() => goSearch(meal.id)}
              onEdit={() => setEditingId((id) => (id === meal.id ? null : meal.id))}
              onRemove={(itemId) => void remove(itemId)}
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
  editing: boolean;
  removingId: string | null;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onRemove: (itemId: string) => void;
}

function MealCard({ meal, open, editing, removingId, onToggle, onAdd, onEdit, onRemove }: MealCardProps) {
  const empty = meal.items.length === 0;
  return (
    <View style={[styles.meal, open && styles.mealOpen]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${meal.title}, ${meal.time}, ${empty ? 'sem alimentos' : `${formatNumber(meal.kcal)} quilocalorias`}`}
        accessibilityState={{ expanded: open }}
        style={styles.mealHead}
      >
        <IconTile
          name={empty ? 'clock' : 'utensils'}
          size={44}
          color={empty ? colors.muted : colors.primary}
          bg={empty ? colors.goalInputBg : colors.primarySoft}
        />
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
            meal.items.map((item) => (
              <View key={item.id} style={styles.food}>
                <View style={styles.dot} />
                <Txt size={15} weight={700} style={styles.flex} numberOfLines={2}>
                  {item.name}
                </Txt>
                <Txt size={13} weight={700} color={colors.muted}>
                  {formatNumber(item.grams)} g · {formatNumber(item.kcal)} kcal
                </Txt>
                {editing ? (
                  <Pressable
                    onPress={() => onRemove(item.id)}
                    disabled={removingId === item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${item.name}`}
                    style={({ pressed }) => [styles.remove, pressed && { backgroundColor: colors.dangerBg }]}
                  >
                    <Icon name="trash" size={18} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
          <View style={styles.actions}>
            {!empty ? <Chip label={editing ? 'Concluir' : 'Editar'} selected={editing} onPress={onEdit} style={styles.flex} /> : null}
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
  remove: { width: TOUCH - 4, height: TOUCH - 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
