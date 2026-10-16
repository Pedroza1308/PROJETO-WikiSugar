import type { DailyGoals, DailyProgress, NextMeal } from '../types';

export const mockGoals: DailyGoals = { caloriesKcal: 2300, waterMl: 2900, sleepHours: 8, carbLimitG: 230 };
export const mockTodayProgress: DailyProgress = { caloriesKcal: 1300, waterMl: 1800, sleepHours: 7.35 };
export const mockNextMeal: NextMeal = { title: 'Lanche', time: '16h' };
