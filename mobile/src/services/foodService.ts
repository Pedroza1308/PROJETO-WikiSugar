import { mockFoods } from '../mocks/foods';
import { mockRecentSearches } from '../mocks/journal';
import type { Food } from '../types';
import { normalize } from '../utils/format';
import { clone, delay, fail } from './mockClient';

/**
 * Food service (mocked).
 * Future: GET /foods?q=... on the Express backend, which proxies the FatSecret API.
 */

/** Searches foods by name (accent and case insensitive). The query "erro" simulates a failure. */
export async function searchFoods(query: string): Promise<Food[]> {
  const q = normalize(query);
  if (q === 'erro') return fail('Falha simulada na busca');
  const results = mockFoods.filter((f) => normalize(f.name).includes(q));
  return delay(clone(results));
}

export async function getFoodById(id: string): Promise<Food> {
  const food = mockFoods.find((f) => f.id === id);
  if (!food) return fail('Alimento não encontrado');
  return delay(clone(food));
}

export async function getRecentSearches(): Promise<string[]> {
  return delay([...mockRecentSearches], 0);
}

/** Scales the nutrition of a food (defined per `baseGrams`) to the given grams. */
export function scaleFood(food: Food, grams: number) {
  const f = grams / food.baseGrams;
  return {
    kcal: Math.round(food.kcal * f),
    carbs: food.carbs * f,
    protein: food.protein * f,
    fat: food.fat * f,
    sugar: food.sugar * f,
  };
}
