import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { mealSlotConfig, nextMealSlot } from '../config/rules';
import { AppError, messageFromError } from '../lib/errors';
import type { PickedImage } from '../lib/images';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import * as authService from '../services/authService';
import * as journalService from '../services/journalService';
import * as mealService from '../services/mealService';
import * as profileService from '../services/profileService';
import type { ProfileRow } from '../services/profileService';
import type {
  DailyGoals,
  DailyProgress,
  FontScale,
  Food,
  JournalDraft,
  Meal,
  MealSlot,
  NextMeal,
  RegisterPayload,
  User,
} from '../types';
import { initialsFrom, parseHours, toIsoDate } from '../utils/format';

export interface AddedFoodNotice {
  foodName: string;
  mealTitle: string;
  mealId: MealSlot;
}

type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AppData {
  /** The stored session was restored (navigation can render). */
  authReady: boolean;
  /** authReady and, when signed in, the profile finished loading (splash can hide). */
  ready: boolean;
  session: Session | null;
  user: User | null;
  profileError: string | null;
  goals: DailyGoals | null;
  progress: DailyProgress | null;
  journal: JournalDraft | null;
  meals: Meal[];
  nextMeal: NextMeal | null;
  streakDays: number;
  fontScale: FontScale;
  addedNotice: AddedFoodNotice | null;
}

interface AppActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<authService.SignUpResult>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  /** Reloads today's journal, meals and streak (e.g. after a check-in). */
  refreshToday: () => Promise<void>;
  addWater: (ml: number) => Promise<void>;
  saveGoals: (goals: DailyGoals) => Promise<void>;
  saveJournal: (draft: JournalDraft) => Promise<void>;
  addFoodToMeal: (slot: MealSlot, food: Food, grams: number) => Promise<void>;
  removeMealItem: (itemId: string) => Promise<void>;
  updateAvatar: (image: PickedImage) => Promise<void>;
  setFontScale: (scale: FontScale) => void;
  dismissAddedNotice: () => void;
}

export type AppContextValue = AppData & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [journal, setJournal] = useState<JournalDraft | null>(null);
  const [meals, setMeals] = useState<Meal[]>(() => mealService.buildMeals([]));
  const [streakDays, setStreakDays] = useState(0);
  const [fontScale, setFontScale] = useState<FontScale>(1);
  const [addedNotice, setAddedNotice] = useState<AddedFoodNotice | null>(null);
  const [clock, setClock] = useState(() => new Date());

  const userId = session?.user.id ?? null;
  const email = session?.user.email ?? '';
  // Guards against late responses of a previous account after logout/login.
  const activeUser = useRef<string | null>(null);

  // Restore the stored session and follow sign-in / sign-out / token refresh.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) setSession(data.session);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setAuthReady(true);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) setSession(next);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    setProfileStatus('loading');
    try {
      const p = await profileService.getProfile(uid);
      if (activeUser.current !== uid) return;
      setProfile(p);
      setProfileError(null);
      setProfileStatus('ready');
    } catch (e) {
      if (activeUser.current !== uid) return;
      setProfileError(messageFromError(e, 'Não foi possível carregar seu perfil.'));
      setProfileStatus('error');
    }
  }, []);

  const refreshStreak = useCallback(async (uid: string) => {
    try {
      const days = await profileService.getStreak();
      if (activeUser.current === uid) setStreakDays(days);
    } catch {
      // keep the last known value
    }
  }, []);

  const refreshTodayFor = useCallback(
    async (uid: string) => {
      const date = toIsoDate();
      const [j, m] = await Promise.allSettled([journalService.getEntry(uid, date), mealService.getMeals(uid, date)]);
      if (activeUser.current !== uid) return;
      if (j.status === 'fulfilled') setJournal(j.value);
      else setJournal((prev) => prev ?? { ...journalService.EMPTY_JOURNAL });
      if (m.status === 'fulfilled') setMeals(m.value);
      setClock(new Date());
      await refreshStreak(uid);
    },
    [refreshStreak],
  );

  // Load everything for the signed-in account; clear it on sign-out.
  useEffect(() => {
    activeUser.current = userId;
    if (!userId) {
      setProfile(null);
      setProfileStatus('idle');
      setProfileError(null);
      setJournal(null);
      setMeals(mealService.buildMeals([]));
      setStreakDays(0);
      setAddedNotice(null);
      return;
    }
    void loadProfile(userId);
    void refreshTodayFor(userId);
  }, [userId, loadProfile, refreshTodayFor]);

  // Back to the foreground: the day may have changed.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active' && activeUser.current) void refreshTodayFor(activeUser.current);
    });
    return () => sub.remove();
  }, [refreshTodayFor]);

  const requireUser = useCallback((): string => {
    if (!activeUser.current) throw new AppError('NOT_AUTHENTICATED');
    return activeUser.current;
  }, []);

  const signIn = useCallback((mail: string, password: string) => authService.signIn(mail, password), []);

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      const result = await authService.signUp(payload);
      // The photo is saved right after the profile is created: fetch the profile again to show it.
      if (result.userId && !result.needsEmailConfirmation && payload.avatar && result.avatarSaved) {
        void loadProfile(result.userId);
      }
      return result;
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const reloadProfile = useCallback(async () => {
    const uid = requireUser();
    await loadProfile(uid);
  }, [loadProfile, requireUser]);

  const refreshToday = useCallback(async () => {
    if (activeUser.current) await refreshTodayFor(activeUser.current);
  }, [refreshTodayFor]);

  const addWater = useCallback(
    async (ml: number) => {
      const uid = requireUser();
      if (!profile) return;
      const current = journal?.waterMl ?? 0;
      const next = Math.min(current + ml, Number(profile.goal_water_ml));
      if (next === current) return;
      setJournal((j) => ({ ...(j ?? journalService.EMPTY_JOURNAL), waterMl: next }));
      try {
        await journalService.setWater(uid, toIsoDate(), next);
        void refreshStreak(uid);
      } catch (e) {
        setJournal((j) => (j ? { ...j, waterMl: current } : j));
        throw e;
      }
    },
    [journal, profile, refreshStreak, requireUser],
  );

  const saveGoals = useCallback(
    async (next: DailyGoals) => {
      const uid = requireUser();
      setProfile(await profileService.updateGoals(uid, next));
    },
    [requireUser],
  );

  const saveJournal = useCallback(
    async (draft: JournalDraft) => {
      const uid = requireUser();
      setJournal(await journalService.saveEntry(uid, toIsoDate(), draft));
      void refreshStreak(uid);
    },
    [refreshStreak, requireUser],
  );

  const addFoodToMeal = useCallback(
    async (slot: MealSlot, food: Food, grams: number) => {
      const uid = requireUser();
      const date = toIsoDate();
      await mealService.addFood(uid, date, slot, food, grams);
      setMeals(await mealService.getMeals(uid, date));
      setAddedNotice({ foodName: food.name, mealTitle: mealSlotConfig(slot).title, mealId: slot });
      void refreshStreak(uid);
    },
    [refreshStreak, requireUser],
  );

  const removeMealItem = useCallback(
    async (itemId: string) => {
      const uid = requireUser();
      await mealService.removeItem(itemId);
      setMeals(await mealService.getMeals(uid, toIsoDate()));
    },
    [requireUser],
  );

  const updateAvatar = useCallback(
    async (image: PickedImage) => {
      const uid = requireUser();
      setProfile(await profileService.uploadAvatar(uid, image, profile?.avatar_path));
    },
    [profile?.avatar_path, requireUser],
  );

  const dismissAddedNotice = useCallback(() => setAddedNotice(null), []);

  const user = useMemo<User | null>(() => {
    if (!profile || !userId || profile.id !== userId) return null;
    const name = profile.name.trim();
    return {
      id: profile.id,
      name,
      firstName: name.split(/\s+/)[0] ?? name,
      initials: initialsFrom(name),
      email,
      avatarPath: profile.avatar_path,
      avatarUrl: profileService.avatarUrl(profile.avatar_path),
      diabetesType: profile.diabetes_type,
      restrictions: profile.restrictions ?? [],
    };
  }, [profile, userId, email]);

  const goals = useMemo(() => (user && profile ? profileService.goalsFromProfile(profile) : null), [user, profile]);

  const progress = useMemo<DailyProgress | null>(() => {
    if (!user) return null;
    return {
      caloriesKcal: Math.round(meals.reduce((sum, m) => sum + m.kcal, 0)),
      waterMl: journal?.waterMl ?? 0,
      sleepHours: journal?.sleep ? (parseHours(journal.sleep) ?? 0) : 0,
    };
  }, [user, meals, journal]);

  const nextMeal = useMemo<NextMeal | null>(() => {
    const { slot, tomorrow } = nextMealSlot(clock);
    return { title: slot.title, time: tomorrow ? `amanhã, ${slot.time}` : slot.time };
  }, [clock]);

  const ready = authReady && (!userId || profileStatus === 'ready' || profileStatus === 'error');

  const value = useMemo<AppContextValue>(
    () => ({
      authReady,
      ready,
      session,
      user,
      profileError,
      goals,
      progress,
      journal,
      meals,
      nextMeal,
      streakDays,
      fontScale,
      addedNotice,
      signIn,
      signUp,
      signOut,
      reloadProfile,
      refreshToday,
      addWater,
      saveGoals,
      saveJournal,
      addFoodToMeal,
      removeMealItem,
      updateAvatar,
      setFontScale,
      dismissAddedNotice,
    }),
    [
      authReady, ready, session, user, profileError, goals, progress, journal, meals, nextMeal, streakDays,
      fontScale, addedNotice, signIn, signUp, signOut, reloadProfile, refreshToday, addWater, saveGoals,
      saveJournal, addFoodToMeal, removeMealItem, updateAvatar, dismissAddedNotice,
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
