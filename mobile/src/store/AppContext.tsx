import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LUNCH_MEAL_ID } from '../mocks/meals';
import * as journalService from '../services/journalService';
import * as mealService from '../services/mealService';
import * as userService from '../services/userService';
import type {
  DailyGoals,
  DailyProgress,
  FontScale,
  JournalDraft,
  Meal,
  NextMeal,
  RegisterPayload,
  User,
} from '../types';
import { parseHours } from '../utils/format';

export interface AddedFoodNotice {
  foodName: string;
  mealTitle: string;
}

interface AppState {
  ready: boolean;
  user: User | null;
  goals: DailyGoals | null;
  progress: DailyProgress | null;
  meals: Meal[];
  nextMeal: NextMeal | null;
  fontScale: FontScale;
  addedNotice: AddedFoodNotice | null;
}

interface AppActions {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  addWater: (ml: number) => void;
  saveGoals: (goals: DailyGoals) => Promise<void>;
  setFontScale: (scale: FontScale) => void;
  addFoodToLunch: (foodName: string, grams: number, kcal: number) => Promise<void>;
  dismissAddedNotice: () => void;
  saveJournal: (draft: JournalDraft) => Promise<void>;
}

export type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [nextMeal, setNextMeal] = useState<NextMeal | null>(null);
  const [fontScale, setFontScale] = useState<FontScale>(1);
  const [addedNotice, setAddedNotice] = useState<AddedFoodNotice | null>(null);

  // Initial bootstrap through the (mocked) service layer.
  useEffect(() => {
    let alive = true;
    Promise.all([
      userService.getCurrentUser(),
      userService.getGoals(),
      userService.getTodayProgress(),
      userService.getNextMeal(),
      mealService.getTodayMeals(),
    ])
      .then(([u, g, p, n, m]) => {
        if (!alive) return;
        setUser(u);
        setGoals(g);
        setProgress(p);
        setNextMeal(n);
        setMeals(m);
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await userService.login(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await userService.register(payload);
    setUser(res.user);
    setGoals(res.goals);
  }, []);

  const addWater = useCallback(
    (ml: number) => {
      if (!progress || !goals) return;
      const waterMl = Math.min(progress.waterMl + ml, goals.waterMl);
      setProgress({ ...progress, waterMl });
      void userService.updateTodayProgress({ waterMl });
    },
    [progress, goals],
  );

  const saveGoals = useCallback(async (next: DailyGoals) => {
    const saved = await userService.updateGoals(next);
    setGoals(saved);
  }, []);

  const addFoodToLunch = useCallback(
    async (foodName: string, grams: number, kcal: number) => {
      const updated = await mealService.addFoodToMeal(LUNCH_MEAL_ID, `${foodName} · ${grams} g`, kcal);
      setMeals(updated);
      const lunch = updated.find((m) => m.id === LUNCH_MEAL_ID);
      setAddedNotice({ foodName, mealTitle: lunch?.title ?? 'Almoço' });
    },
    [],
  );

  const dismissAddedNotice = useCallback(() => setAddedNotice(null), []);

  const saveJournal = useCallback(async (draft: JournalDraft) => {
    const entry = await journalService.saveEntry(draft);
    const sleepHours = parseHours(entry.sleep);
    const patch: Partial<DailyProgress> = { waterMl: entry.waterMl };
    if (sleepHours !== null) patch.sleepHours = sleepHours;
    const p = await userService.updateTodayProgress(patch);
    setProgress(p);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      user,
      goals,
      progress,
      meals,
      nextMeal,
      fontScale,
      addedNotice,
      login,
      register,
      addWater,
      saveGoals,
      setFontScale,
      addFoodToLunch,
      dismissAddedNotice,
      saveJournal,
    }),
    [
      ready, user, goals, progress, meals, nextMeal, fontScale, addedNotice,
      login, register, addWater, saveGoals, addFoodToLunch, dismissAddedNotice, saveJournal,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/** Global font multiplier (Profile › Tamanho do texto). */
export function useFontScale(): FontScale {
  return useContext(AppContext)?.fontScale ?? 1;
}
