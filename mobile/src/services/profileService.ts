import { AppError } from '../lib/errors';
import { PickedImage, readFile, toJpeg, newObjectName } from '../lib/images';
import { BUCKETS, supabase } from '../lib/supabase';
import type { DailyGoals, DiabetesType } from '../types';

/** Row of public.profiles. */
export interface ProfileRow {
  id: string;
  name: string;
  avatar_path: string | null;
  diabetes_type: DiabetesType;
  restrictions: string[];
  goal_calories_kcal: number;
  goal_water_ml: number;
  goal_sleep_hours: number;
  goal_carb_limit_g: number;
}

const PROFILE_COLUMNS =
  'id, name, avatar_path, diabetes_type, restrictions, goal_calories_kcal, goal_water_ml, goal_sleep_hours, goal_carb_limit_g';

export async function getProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).single();
  if (error) throw error;
  return data as ProfileRow;
}

export function goalsFromProfile(p: ProfileRow): DailyGoals {
  return {
    caloriesKcal: Number(p.goal_calories_kcal),
    waterMl: Number(p.goal_water_ml),
    sleepHours: Number(p.goal_sleep_hours),
    carbLimitG: Number(p.goal_carb_limit_g),
  };
}

export async function updateGoals(userId: string, goals: DailyGoals): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      goal_calories_kcal: Math.round(goals.caloriesKcal),
      goal_water_ml: Math.round(goals.waterMl),
      goal_sleep_hours: Math.round(goals.sleepHours * 100) / 100,
      goal_carb_limit_g: Math.round(goals.carbLimitG),
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

/** Public URL of a profile photo (the avatars bucket is public). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKETS.avatars).getPublicUrl(path).data.publicUrl;
}

/**
 * Uploads a new profile photo to avatars/<uid>/..., points the profile to it and
 * removes the previous file. Each upload gets a new name, so caches never show
 * the old picture.
 */
export async function uploadAvatar(userId: string, image: PickedImage, previousPath?: string | null): Promise<ProfileRow> {
  const jpeg = await toJpeg(image, 512, 0.8);
  const path = newObjectName(userId);
  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.avatars)
    .upload(path, await readFile(jpeg), { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) {
    await supabase.storage.from(BUCKETS.avatars).remove([path]);
    throw error;
  }
  if (previousPath && previousPath !== path) {
    // Best effort: an orphan file is harmless.
    void supabase.storage.from(BUCKETS.avatars).remove([previousPath]);
  }
  return data as ProfileRow;
}

/** Consecutive days with any record (check-in, journal or meal). */
export async function getStreak(): Promise<number> {
  let tz = 'America/Sao_Paulo';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
  } catch {
    // keep the default time zone
  }
  const { data, error } = await supabase.rpc('my_streak', { p_tz: tz });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export function assertSignedIn(userId: string | null | undefined): asserts userId is string {
  if (!userId) throw new AppError('NOT_AUTHENTICATED');
}
