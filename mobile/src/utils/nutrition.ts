import type { Food, FoodLevel } from '../types';

/** TACO values are per 100 g. */
export const REFERENCE_GRAMS = 100;

/** Scales a per-100 g nutrient to the given portion (null stays null = no data). */
export function forPortion(value: number | null, grams: number): number | null {
  return value === null ? null : (value * grams) / REFERENCE_GRAMS;
}

/**
 * Carbohydrate level per 100 g, used for the badge and the diabetes alert:
 * < 15 g adequado · 15–25 g moderado · > 25 g alto.
 */
export function foodLevel(food: Pick<Food, 'carbsG'>): { level: FoodLevel; label: string } {
  const carbs = food.carbsG;
  if (carbs === null) return { level: 'moderate', label: 'Sem dado de carboidrato' };
  if (carbs < 15) return { level: 'good', label: 'Adequado' };
  if (carbs <= 25) return { level: 'moderate', label: 'Moderado' };
  return { level: 'high', label: 'Alto em carboidrato' };
}
