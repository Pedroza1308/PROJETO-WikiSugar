import { mockMeals } from '../mocks/meals';
import type { Meal } from '../types';
import { clone, delay } from './mockClient';

/**
 * Meal plan service (mocked). Keeps an in-memory copy for the session.
 * Future: GET /meals/today, POST /meals/:id/items.
 */
let meals: Meal[] = clone(mockMeals);

export async function getTodayMeals(): Promise<Meal[]> {
  return delay(clone(meals));
}

export async function addFoodToMeal(mealId: string, label: string, kcal: number): Promise<Meal[]> {
  meals = meals.map((m) =>
    m.id === mealId ? { ...m, kcal: m.kcal + kcal, foods: [...m.foods, label] } : m,
  );
  return delay(clone(meals), 150);
}
