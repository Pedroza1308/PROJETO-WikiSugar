export type DiabetesType = 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'Não tenho';

export type Restriction = 'Glúten' | 'Lactose' | 'Açúcar' | 'Outro';

export interface User {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  email: string;
  diabetesType: DiabetesType;
  restrictions: string[];
  streakDays: number;
}

export interface DailyGoals {
  caloriesKcal: number;
  waterMl: number;
  sleepHours: number;
  carbLimitG: number;
}

export interface DailyProgress {
  caloriesKcal: number;
  waterMl: number;
  /** Decimal hours, e.g. 7.35 = 7h21. */
  sleepHours: number;
}

export interface NextMeal {
  title: string;
  time: string;
}

export type FoodLevel = 'good' | 'moderate' | 'high';

export interface Food {
  id: string;
  name: string;
  category: string;
  portion: string;
  baseGrams: number;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  level: FoodLevel;
  status: string;
}

export interface Meal {
  id: string;
  title: string;
  time: string;
  kcal: number;
  foods: string[];
}

export interface JournalEntry {
  /** ISO date (yyyy-mm-dd) */
  date: string;
  waterMl: number;
  /** Free-form sleep text, e.g. "7h21" */
  sleep: string;
  tookMedication: boolean;
  medicationTime: string;
  activityType: string;
  activityMinutes: string;
  notes: string;
}

export type JournalDraft = Omit<JournalEntry, 'date'>;

export interface RegisterPayload {
  name: string;
  email: string;
  diabetesType: DiabetesType;
  restrictions: string[];
  goals: Pick<DailyGoals, 'caloriesKcal' | 'waterMl' | 'sleepHours'>;
}

export type FontScale = 1 | 1.15 | 1.3;
