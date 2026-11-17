import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Button, Card, Chip, ErrorState, H1, H2, Icon, IconTile, ProgressBar, Screen, StatusBadge, TopBar, Txt } from '../components';
import { currentMealSlot, MEAL_SLOTS, mealSlotConfig } from '../config/rules';
import { useScreenPadding } from '../hooks/ui';
import { messageFromError } from '../lib/errors';
import type { SearchScreenProps } from '../navigation/types';
import * as foodService from '../services/foodService';
import { useApp } from '../store/AppContext';
import { colors, radius, TOUCH } from '../theme/tokens';
import type { Food, MealSlot } from '../types';
import { clamp, formatDecimal, formatNumber } from '../utils/format';
import { foodLevel, forPortion, REFERENCE_GRAMS } from '../utils/nutrition';

const STEP_G = 10;
const MIN_G = 10;
const MAX_G = 1000;

interface NutrientRow {
  label: string;
  unit: string;
  value: number | null;
  digits: number;
  /** Indented sub-item (e.g. saturated fat under total fat). */
  child?: boolean;
}

export function FoodDetailScreen({ navigation, route }: SearchScreenProps<'FoodDetail'>) {
  const px = useScreenPadding();
  const { user, goals, addFoodToMeal } = useApp();
  const [food, setFood] = useState<Food | null>(null);
  const [error, setError] = useState(false);
  const [grams, setGrams] = useState(REFERENCE_GRAMS);
  const [slot, setSlot] = useState<MealSlot>(route.params.slot ?? currentMealSlot());
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    setFood(null);
    foodService
      .getFoodById(route.params.foodId)
      .then(setFood)
      .catch(() => setError(true));
  }, [route.params.foodId]);

  useEffect(load, [load]);

  const back = () => navigation.goBack();

  if (error) {
    return (
      <Screen>
        <TopBar title="Alimento" onBack={back} />
        <ErrorState title="Alimento não encontrado" message="Verifique sua conexão e tente de novo." action={{ label: 'Tentar de novo', onPress: load }} />
      </Screen>
    );
  }

  if (!food) {
    return (
      <Screen>
        <TopBar title="Alimento" onBack={back} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando alimento" />
        </View>
      </Screen>
    );
  }

  const { level, label } = foodLevel(food);
  const portionCarbs = forPortion(food.carbsG, grams);
  const carbLimit = goals?.carbLimitG ?? 0;
  const carbShare = carbLimit > 0 && portionCarbs !== null ? portionCarbs / carbLimit : 0;
  const hasDiabetes = !!user && user.diabetesType !== 'Não tenho';
  const showAlert = level === 'high' || (hasDiabetes && level === 'moderate' && food.carbsG !== null);

  const rows: NutrientRow[] = [
    { label: 'Valor energético', unit: 'kcal', value: food.kcal, digits: 0 },
    { label: 'Carboidratos', unit: 'g', value: food.carbsG, digits: 1 },
    { label: 'Proteínas', unit: 'g', value: food.proteinG, digits: 1 },
    { label: 'Gorduras totais', unit: 'g', value: food.fatG, digits: 1 },
    { label: 'Gorduras saturadas', unit: 'g', value: food.saturatedFatG, digits: 1, child: true },
    { label: 'Fibra alimentar', unit: 'g', value: food.fiberG, digits: 1 },
    { label: 'Sódio', unit: 'mg', value: food.sodiumMg, digits: 0 },
  ];
  const hasMissing = rows.some((r) => r.value === null);
  const fmt = (v: number | null, digits: number) => (v === null ? '—' : digits === 0 ? formatNumber(Math.round(v)) : formatDecimal(v, digits));

  const add = async () => {
    setAdding(true);
    setAddError(null);
    try {
      await addFoodToMeal(slot, food, grams);
      navigation.navigate('DietTab');
    } catch (e) {
      setAddError(messageFromError(e, 'Não foi possível adicionar o alimento.'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Alimento" onBack={back} />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]}>
        <View style={styles.hero}>
          <IconTile name="utensils" size={64} iconSize={30} color={colors.foodThumbIcon} bg={colors.foodThumbBg} radius={18} />
          <View style={styles.flex}>
            <Txt size={12} weight={800} color={colors.muted} ls={0.6} upper>
              {food.category}
            </Txt>
            <H1 size={23}>{food.name}</H1>
          </View>
        </View>
        <StatusBadge level={level} label={label} />

        {showAlert ? (
          <View style={styles.alert} accessible accessibilityRole="alert">
            <Icon name="alert" size={22} color={colors.alertBorder} />
            <View style={styles.flex}>
              <Txt size={15} weight={800} color={colors.alertText}>
                Atenção aos carboidratos
              </Txt>
              <Txt size={13} color={colors.alertText} lh={1.4}>
                {hasDiabetes
                  ? `Para diabetes ${user?.diabetesType}, prefira porções menores e combine com proteínas e fibras.`
                  : 'Este alimento tem bastante carboidrato. Consuma com moderação.'}
              </Txt>
            </View>
          </View>
        ) : null}

        {/* Portion stepper */}
        <Card style={styles.portion}>
          <Txt size={15} weight={800}>
            Sua porção
          </Txt>
          <View
            style={styles.stepper}
            accessibilityRole="adjustable"
            accessibilityLabel={`Quantidade: ${grams} gramas`}
            accessibilityValue={{ min: MIN_G, max: MAX_G, now: grams, text: `${grams} gramas` }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) =>
              setGrams((g) => clamp(g + (e.nativeEvent.actionName === 'increment' ? STEP_G : -STEP_G), MIN_G, MAX_G))
            }
          >
            <StepButton icon="minus" label="Diminuir 10 gramas" disabled={grams <= MIN_G} onPress={() => setGrams((g) => clamp(g - STEP_G, MIN_G, MAX_G))} />
            <View style={styles.amount}>
              <Txt size={26} weight={800}>
                {grams}
              </Txt>
              <Txt size={13} weight={700} color={colors.muted}>
                gramas
              </Txt>
            </View>
            <StepButton icon="plus" label="Aumentar 10 gramas" disabled={grams >= MAX_G} onPress={() => setGrams((g) => clamp(g + STEP_G, MIN_G, MAX_G))} />
          </View>
        </Card>

        {/* Nutrition facts table */}
        <View style={styles.table} accessibilityRole="summary">
          <View style={[styles.tr, styles.thead]}>
            <Txt size={13} weight={800} color={colors.white} style={styles.colName}>
              Tabela nutricional
            </Txt>
            <Txt size={13} weight={800} color={colors.white} style={styles.colValue} align="right">
              {REFERENCE_GRAMS} g
            </Txt>
            <Txt size={13} weight={800} color={colors.white} style={styles.colValue} align="right">
              {grams} g
            </Txt>
          </View>
          {rows.map((r, i) => (
            <View
              key={r.label}
              style={[styles.tr, i % 2 === 1 && styles.trAlt]}
              accessible
              accessibilityLabel={
                r.value === null
                  ? `${r.label}: sem dado na tabela TACO`
                  : `${r.label}: ${fmt(r.value, r.digits)} ${r.unit} em ${REFERENCE_GRAMS} gramas, ${fmt(forPortion(r.value, grams), r.digits)} ${r.unit} na sua porção de ${grams} gramas`
              }
            >
              <Txt size={14} weight={r.child ? 600 : 800} style={[styles.colName, r.child && styles.child]}>
                {r.label} <Txt size={12} color={colors.muted}>({r.unit})</Txt>
              </Txt>
              <Txt size={14} weight={700} style={styles.colValue} align="right">
                {fmt(r.value, r.digits)}
              </Txt>
              <Txt size={14} weight={800} color={colors.primary} style={styles.colValue} align="right">
                {fmt(forPortion(r.value, grams), r.digits)}
              </Txt>
            </View>
          ))}
        </View>
        <Txt size={12} color={colors.muted} lh={1.4}>
          Porção de referência: {REFERENCE_GRAMS} g. Fonte: Tabela TACO (NEPA/UNICAMP, 4ª ed.).
          {hasMissing ? ' “—” = nutriente não analisado na TACO.' : ''}
        </Txt>

        {carbLimit > 0 && portionCarbs !== null ? (
          <Card style={styles.carbCard}>
            <View style={styles.carbHead}>
              <Txt size={14} weight={800} style={styles.flex}>
                Do seu limite diário de carboidrato
              </Txt>
              <Txt size={14} weight={800} color={carbShare > 0.35 ? colors.danger : colors.good}>
                {Math.round(carbShare * 100)}%
              </Txt>
            </View>
            <ProgressBar
              value={carbShare}
              color={carbShare > 0.35 ? colors.danger : colors.good}
              accessibilityLabel={`${Math.round(carbShare * 100)} por cento do limite de ${carbLimit} gramas de carboidrato`}
            />
            <Txt size={12} color={colors.muted}>
              Limite: {formatNumber(carbLimit)} g por dia
            </Txt>
          </Card>
        ) : null}

        <View style={styles.mealPick}>
          <H2 size={17}>Adicionar à refeição</H2>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Refeição">
            {MEAL_SLOTS.map((s) => (
              <Chip key={s.id} label={s.title} role="radio" selected={slot === s.id} onPress={() => setSlot(s.id)} />
            ))}
          </View>
        </View>

        {addError ? <Banner message={addError} /> : null}
        <Button
          label={`Adicionar ${slot === 'supper' ? 'à' : 'ao'} ${mealSlotConfig(slot).title.toLowerCase()}`}
          icon="plus"
          onPress={add}
          loading={adding}
          testID="food-add"
        />
      </ScrollView>
    </Screen>
  );
}

function StepButton({ icon, label, onPress, disabled }: { icon: 'plus' | 'minus'; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.step, pressed && { backgroundColor: colors.primarySoft }, disabled && { opacity: 0.4 }]}
    >
      <Icon name={icon} size={22} color={colors.primary} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 20, paddingBottom: 32, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  alert: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.alertBg,
    borderLeftWidth: 4,
    borderLeftColor: colors.alertBorder,
    borderRadius: radius.card,
    padding: 14,
  },
  portion: { gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  step: {
    width: TOUCH + 4,
    height: TOUCH + 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  amount: { alignItems: 'center' },
  table: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, gap: 8 },
  trAlt: { backgroundColor: colors.screenBg },
  thead: { backgroundColor: colors.ink },
  colName: { flex: 1.8 },
  colValue: { flex: 1 },
  child: { paddingLeft: 14 },
  carbCard: { gap: 10 },
  carbHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  mealPick: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
