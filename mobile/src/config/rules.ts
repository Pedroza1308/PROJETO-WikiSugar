import type { DailyGoals, MealSlot } from '../types';

/**
 * Business rules shown in the UI. The database is the source of truth and
 * enforces the same values (supabase/migrations: private.group_max_members()
 * and private.checkin_points()); these constants only drive labels/validation.
 */
export const GROUP_MAX_MEMBERS = 10;
export const CHECKIN_POINTS = 10;
export const GROUP_NAME_MIN = 3;
export const GROUP_NAME_MAX = 60;
export const GROUP_PASSWORD_MIN = 4;
export const TEXT_MAX = 280;

/** Suggested goals for a new account (editable in onboarding and profile). */
export const DEFAULT_GOALS: DailyGoals = { caloriesKcal: 2300, waterMl: 2900, sleepHours: 8, carbLimitG: 230 };

/** Same ranges as the CHECK constraints in public.profiles. */
export const GOAL_LIMITS: Record<keyof DailyGoals, { min: number; max: number; label: string; unit: string }> = {
  caloriesKcal: { min: 500, max: 10000, label: 'Calorias', unit: 'kcal' },
  waterMl: { min: 250, max: 10000, label: 'Água', unit: 'mL' },
  sleepHours: { min: 1, max: 16, label: 'Sono', unit: 'horas' },
  carbLimitG: { min: 0, max: 1000, label: 'Carboidratos', unit: 'g' },
};

/** Returns an error message for the first goal outside its allowed range, or null. */
export function validateGoals(goals: Partial<DailyGoals>): string | null {
  for (const key of Object.keys(goals) as (keyof DailyGoals)[]) {
    const value = goals[key];
    const limit = GOAL_LIMITS[key];
    if (value === undefined || !Number.isFinite(value) || value < limit.min || value > limit.max) {
      return `${limit.label}: use um valor entre ${limit.min} e ${limit.max} ${limit.unit}.`;
    }
  }
  return null;
}

export interface MealSlotConfig {
  id: MealSlot;
  title: string;
  time: string;
  /** Hour the meal usually starts, used to suggest the next/current meal. */
  startHour: number;
}

/** Fixed structure of the day plan (the foods come from the database). */
export const MEAL_SLOTS: readonly MealSlotConfig[] = [
  { id: 'breakfast', title: 'Café da manhã', time: '7h–8h', startHour: 7 },
  { id: 'lunch', title: 'Almoço', time: '12h–13h', startHour: 12 },
  { id: 'snack', title: 'Lanche / Pós-treino', time: '16h', startHour: 16 },
  { id: 'dinner', title: 'Jantar', time: '19h–21h', startHour: 19 },
  { id: 'supper', title: 'Ceia', time: '22h', startHour: 22 },
];

export function mealSlotConfig(slot: MealSlot): MealSlotConfig {
  return MEAL_SLOTS.find((s) => s.id === slot) ?? MEAL_SLOTS[0];
}

/** The meal the user is most likely eating now (default when adding a food). */
export function currentMealSlot(now: Date = new Date()): MealSlot {
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  if (h < 21.5) return 'dinner';
  return 'supper';
}

/** Next meal that has not started yet; after the last one, tomorrow's breakfast. */
export function nextMealSlot(now: Date = new Date()): { slot: MealSlotConfig; tomorrow: boolean } {
  const next = MEAL_SLOTS.find((s) => s.startHour > now.getHours());
  return next ? { slot: next, tomorrow: false } : { slot: MEAL_SLOTS[0], tomorrow: true };
}
