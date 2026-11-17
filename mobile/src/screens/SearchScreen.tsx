import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Chip,
  EmptyState,
  ErrorState,
  Eyebrow,
  Field,
  H1,
  H2,
  Icon,
  IconTile,
  Paragraph,
  Screen,
  StatusBadge,
  Txt,
} from '../components';
import { mealSlotConfig } from '../config/rules';
import { useScreenPadding } from '../hooks/ui';
import type { SearchScreenProps } from '../navigation/types';
import * as foodService from '../services/foodService';
import { addRecentSearch, getRecentSearches } from '../services/recentSearches';
import { useApp } from '../store/AppContext';
import { colors, radius, shadows } from '../theme/tokens';
import type { Food } from '../types';
import { formatDecimal, formatNumber } from '../utils/format';
import { foodLevel } from '../utils/nutrition';

type Status = 'idle' | 'loading' | 'done' | 'error';

const DEBOUNCE_MS = 300;

export function SearchScreen({ navigation, route }: SearchScreenProps<'Search'>) {
  const px = useScreenPadding();
  const { user } = useApp();
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [results, setResults] = useState<Food[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [recent, setRecent] = useState<string[]>([]);
  const requestId = useRef(0);
  const slot = route.params?.slot;

  const hasDiabetes = !!user && user.diabetesType !== 'Não tenho';

  useEffect(() => {
    if (user) setRecent(getRecentSearches(user.id));
  }, [user]);

  // Allow other screens to open Search with a pre-filled query.
  useEffect(() => {
    if (route.params?.query !== undefined) setQuery(route.params.query);
  }, [route.params?.query]);

  const runSearch = useCallback(async (q: string) => {
    const id = ++requestId.current;
    setStatus('loading');
    try {
      const found = await foodService.searchFoods(q);
      if (id !== requestId.current) return; // a newer search superseded this one
      setResults(found);
      setStatus('done');
    } catch {
      if (id === requestId.current) setStatus('error');
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      requestId.current++;
      setResults([]);
      setStatus('idle');
      return;
    }
    const t = setTimeout(() => void runSearch(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const openFood = (food: Food) => {
    const term = query.trim();
    if (user && term) setRecent(addRecentSearch(user.id, term));
    navigation.navigate('FoodDetail', { foodId: food.id, slot });
  };

  return (
    <Screen keyboard>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Eyebrow>Busca inteligente</Eyebrow>
          <H1 size={26}>O que você vai comer?</H1>
          <Paragraph>
            {slot
              ? `Escolha um alimento para adicionar em ${mealSlotConfig(slot).title}.`
              : 'Veja a tabela nutricional completa e alertas para o seu perfil.'}
          </Paragraph>
        </View>

        <Field
          icon="search"
          placeholder="Buscar alimento (ex.: arroz integral)"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar alimento"
          onSubmitEditing={() => query.trim().length >= 2 && void runSearch(query.trim())}
        />

        {status === 'idle' ? (
          <>
            {recent.length > 0 ? (
              <View style={styles.group}>
                <H2 size={17}>Buscas recentes</H2>
                <View style={styles.chips}>
                  {recent.map((r) => (
                    <Chip key={r} label={r} icon="clock" onPress={() => setQuery(r)} />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.info}>
              <IconTile name="alert" size={42} color={colors.alertBorder} bg={colors.white} />
              <View style={styles.flex}>
                <Txt size={15} weight={800} color={colors.alertText}>
                  Alertas personalizados
                </Txt>
                <Txt size={13} color={colors.alertText} lh={1.4}>
                  {hasDiabetes
                    ? `Avisamos quando um alimento for alto em carboidrato para quem tem diabetes ${user?.diabetesType}.`
                    : 'Avisamos quando um alimento for alto em carboidrato.'}
                </Txt>
              </View>
            </View>

            <Txt size={12} color={colors.muted}>
              Dados nutricionais: Tabela Brasileira de Composição de Alimentos (TACO), NEPA/UNICAMP.
            </Txt>
          </>
        ) : null}

        {status === 'loading' ? (
          <View style={styles.loading} accessibilityLiveRegion="polite" accessibilityLabel="Buscando alimentos">
            <ActivityIndicator color={colors.primary} />
            <Txt size={14} weight={700} color={colors.muted}>
              Buscando…
            </Txt>
          </View>
        ) : null}

        {status === 'error' ? (
          <ErrorState
            title="Não foi possível buscar"
            message="Verifique sua conexão e tente novamente."
            action={{ label: 'Tentar de novo', onPress: () => void runSearch(query.trim()) }}
          />
        ) : null}

        {status === 'done' && results.length === 0 ? (
          <EmptyState
            icon="search"
            title="Nenhum alimento encontrado"
            message={`Não achamos resultados para “${query.trim()}”. Tente um nome mais simples, como “arroz” ou “banana”.`}
          />
        ) : null}

        {status === 'done' && results.length > 0 ? (
          <View style={styles.group}>
            <Txt size={13} weight={700} color={colors.muted} accessibilityLiveRegion="polite">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </Txt>
            {results.map((food) => (
              <FoodRow key={food.id} food={food} warn={hasDiabetes && foodLevel(food).level === 'high'} onPress={() => openFood(food)} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function FoodRow({ food, warn, onPress }: { food: Food; warn: boolean; onPress: () => void }) {
  const { level, label } = foodLevel(food);
  const kcal = food.kcal === null ? 'sem dado de' : formatNumber(food.kcal);
  const carbs = food.carbsG === null ? '—' : formatDecimal(food.carbsG);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}. ${kcal} quilocalorias e ${carbs} gramas de carboidrato por 100 gramas. ${label}`}
      accessibilityHint="Abre a tabela nutricional"
      style={({ pressed }) => [styles.row, warn && styles.rowWarn, pressed && { backgroundColor: colors.primaryPale }]}
    >
      <IconTile name="utensils" size={46} color={colors.foodThumbIcon} bg={colors.foodThumbBg} />
      <View style={styles.rowBody}>
        <Txt size={11} weight={800} color={colors.muted} ls={0.6} upper numberOfLines={1}>
          {food.category}
        </Txt>
        <Txt size={16} weight={800} numberOfLines={2}>
          {food.name}
        </Txt>
        <Txt size={13} color={colors.muted}>
          {food.kcal === null ? '—' : formatNumber(food.kcal)} kcal · {carbs} g carb. · 100 g
        </Txt>
        <StatusBadge level={level} label={label} />
      </View>
      <Icon name="chevron" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 24, paddingBottom: 32, gap: 18 },
  intro: { gap: 6 },
  group: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.alertBg,
    borderLeftWidth: 4,
    borderLeftColor: colors.alertBorder,
    borderRadius: radius.card,
    padding: 14,
  },
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 13,
    ...shadows.card,
  },
  rowWarn: { borderColor: colors.dangerBg, borderLeftWidth: 4, borderLeftColor: colors.danger },
  rowBody: { flex: 1, gap: 3 },
});
