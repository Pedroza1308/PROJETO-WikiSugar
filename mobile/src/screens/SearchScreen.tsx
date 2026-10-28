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
import { useScreenPadding } from '../hooks/ui';
import type { SearchScreenProps } from '../navigation/types';
import * as foodService from '../services/foodService';
import { useApp } from '../store/AppContext';
import { colors, radius, shadows } from '../theme/tokens';
import type { Food } from '../types';
import { formatDecimal, formatNumber } from '../utils/format';

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

  const hasDiabetes = !!user && user.diabetesType !== 'Não tenho';

  useEffect(() => {
    void foodService.getRecentSearches().then(setRecent);
  }, []);

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
    if (q.length === 0) {
      requestId.current++;
      setResults([]);
      setStatus('idle');
      return;
    }
    const t = setTimeout(() => void runSearch(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const openFood = (food: Food) => {
    setRecent((prev) => [food.name, ...prev.filter((r) => r !== food.name)].slice(0, 5));
    navigation.navigate('FoodDetail', { foodId: food.id });
  };

  return (
    <Screen keyboard>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: px }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <Eyebrow>Busca inteligente</Eyebrow>
          <H1 size={26}>O que você vai comer?</H1>
          <Paragraph>Veja calorias, carboidratos e alertas para o seu perfil.</Paragraph>
        </View>

        <Field
          icon="search"
          placeholder="Buscar alimento (ex.: arroz)"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar alimento"
          onSubmitEditing={() => query.trim() && void runSearch(query.trim())}
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
                    : 'Avisamos quando um alimento não combina com as suas restrições.'}
                </Txt>
              </View>
            </View>
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
            message={`Não achamos resultados para “${query.trim()}”. Tente outro nome.`}
          />
        ) : null}

        {status === 'done' && results.length > 0 ? (
          <View style={styles.group}>
            <Txt size={13} weight={700} color={colors.muted} accessibilityLiveRegion="polite">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </Txt>
            {results.map((food) => (
              <FoodRow key={food.id} food={food} warn={hasDiabetes && food.level === 'high'} onPress={() => openFood(food)} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function FoodRow({ food, warn, onPress }: { food: Food; warn: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}. ${formatNumber(food.kcal)} quilocalorias e ${formatDecimal(food.carbs)} gramas de carboidrato por ${food.baseGrams} gramas. ${food.status}`}
      accessibilityHint="Abre os detalhes do alimento"
      style={({ pressed }) => [styles.row, warn && styles.rowWarn, pressed && { backgroundColor: colors.primaryPale }]}
    >
      <IconTile name="utensils" size={46} color={colors.foodThumbIcon} bg={colors.foodThumbBg} />
      <View style={styles.rowBody}>
        <Txt size={11} weight={800} color={colors.muted} ls={0.6}>
          {food.category}
        </Txt>
        <Txt size={16} weight={800} numberOfLines={2}>
          {food.name}
        </Txt>
        <Txt size={13} color={colors.muted}>
          {formatNumber(food.kcal)} kcal · {formatDecimal(food.carbs)} g carb. · {food.baseGrams} g
        </Txt>
        <StatusBadge level={food.level} label={food.status} />
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
