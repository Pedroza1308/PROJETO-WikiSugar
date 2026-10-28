import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, ErrorState, H1, Icon, IconTile, Paragraph, ProgressBar, Screen, StatusBadge, TopBar, Txt } from '../components';
import { useScreenPadding } from '../hooks/ui';
import type { SearchScreenProps } from '../navigation/types';
import * as foodService from '../services/foodService';
import { useApp } from '../store/AppContext';
import { colors, radius, TOUCH } from '../theme/tokens';
import type { Food } from '../types';
import { clamp, formatDecimal, formatNumber } from '../utils/format';

const STEP_G = 10;
const MIN_G = 10;
const MAX_G = 1000;

export function FoodDetailScreen({ navigation, route }: SearchScreenProps<'FoodDetail'>) {
  const px = useScreenPadding();
  const { user, goals, addFoodToLunch } = useApp();
  const [food, setFood] = useState<Food | null>(null);
  const [error, setError] = useState(false);
  const [grams, setGrams] = useState(100);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setFood(null);
    foodService
      .getFoodById(route.params.foodId)
      .then((f) => {
        setFood(f);
        setGrams(f.baseGrams);
      })
      .catch(() => setError(true));
  }, [route.params.foodId]);

  useEffect(load, [load]);

  const back = () => navigation.goBack();

  if (error) {
    return (
      <Screen>
        <TopBar title="Alimento" onBack={back} />
        <ErrorState title="Alimento não encontrado" message="Tente buscar novamente." action={{ label: 'Tentar de novo', onPress: load }} />
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

  const n = foodService.scaleFood(food, grams);
  const carbLimit = goals?.carbLimitG ?? 0;
  const carbShare = carbLimit > 0 ? n.carbs / carbLimit : 0;
  const hasDiabetes = !!user && user.diabetesType !== 'Não tenho';
  const showAlert = food.level !== 'good' && (hasDiabetes || food.sugar >= 10);

  const add = async () => {
    setAdding(true);
    try {
      await addFoodToLunch(food.name, grams, n.kcal);
      navigation.navigate('DietTab');
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
            <Txt size={12} weight={800} color={colors.muted} ls={0.6}>
              {food.category}
            </Txt>
            <H1 size={23}>{food.name}</H1>
            <Paragraph size={13}>Porção de referência: {food.portion}</Paragraph>
          </View>
        </View>
        <StatusBadge level={food.level} label={food.status} />

        {showAlert ? (
          <View style={styles.alert} accessible accessibilityRole="alert">
            <Icon name="alert" size={22} color={colors.alertBorder} />
            <View style={styles.flex}>
              <Txt size={15} weight={800} color={colors.alertText}>
                Atenção ao índice glicêmico
              </Txt>
              <Txt size={13} color={colors.alertText} lh={1.4}>
                {hasDiabetes
                  ? `Para diabetes ${user?.diabetesType}, prefira porções menores e combine com proteínas e fibras.`
                  : 'Este alimento tem bastante açúcar. Consuma com moderação.'}
              </Txt>
            </View>
          </View>
        ) : null}

        {/* Portion stepper */}
        <Card style={styles.portion}>
          <Txt size={15} weight={800}>
            Quantidade
          </Txt>
          <View style={styles.stepper} accessibilityRole="adjustable" accessibilityLabel={`Quantidade: ${grams} gramas`}
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

        {/* Nutrition */}
        <View style={styles.grid}>
          <Nutrient label="Calorias" value={formatNumber(n.kcal)} unit="kcal" highlight />
          <Nutrient label="Carboidratos" value={formatDecimal(n.carbs)} unit="g" />
          <Nutrient label="Proteínas" value={formatDecimal(n.protein)} unit="g" />
          <Nutrient label="Gorduras" value={formatDecimal(n.fat)} unit="g" />
          <Nutrient label="Açúcares" value={formatDecimal(n.sugar)} unit="g" />
        </View>

        {carbLimit > 0 ? (
          <Card style={styles.carbCard}>
            <View style={styles.carbHead}>
              <Txt size={14} weight={800}>
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

        <Button label="Adicionar ao almoço" icon="plus" onPress={add} loading={adding} testID="food-add" />
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

function Nutrient({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <View style={[styles.nutrient, highlight && styles.nutrientHi]} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <Txt size={12} weight={700} color={highlight ? colors.primary : colors.muted}>
        {label}
      </Txt>
      <Txt size={20} weight={800} color={highlight ? colors.primary : colors.ink}>
        {value}
        <Txt size={13} weight={700} color={colors.muted}>
          {' '}
          {unit}
        </Txt>
      </Txt>
    </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutrient: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 13,
    gap: 4,
  },
  nutrientHi: { backgroundColor: colors.primaryPale, borderColor: colors.primarySoft, flexBasis: '100%' },
  carbCard: { gap: 10 },
  carbHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
