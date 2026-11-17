import { AppError } from '../lib/errors';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { RegisterPayload } from '../types';
import { uploadAvatar } from './profileService';

function ensureConfigured() {
  if (!isSupabaseConfigured) throw new AppError('NOT_CONFIGURED');
}

/** E-mail uniqueness check used before creating the account. */
export async function isEmailAvailable(email: string): Promise<boolean> {
  ensureConfigured();
  const { data, error } = await supabase.rpc('is_email_available', { p_email: email.trim() });
  if (error) throw error;
  return data === true;
}

export interface SignUpResult {
  userId: string | null;
  /** True when Supabase requires e-mail confirmation (no session yet). */
  needsEmailConfirmation: boolean;
  /** False when the account was created but the optional photo failed to upload. */
  avatarSaved: boolean;
}

/**
 * Creates the account. The profile row (name, health profile and goals) is
 * created by the database trigger from these metadata.
 */
export async function signUp(payload: RegisterPayload): Promise<SignUpResult> {
  ensureConfigured();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    options: {
      data: {
        name: payload.name.trim(),
        diabetes_type: payload.diabetesType,
        restrictions: payload.restrictions,
        goal_calories_kcal: payload.goals.caloriesKcal,
        goal_water_ml: payload.goals.waterMl,
        goal_sleep_hours: payload.goals.sleepHours,
      },
    },
  });
  if (error) throw error;

  // With "Confirm email" enabled, Supabase hides duplicates by returning a user without identities.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new AppError('EMAIL_TAKEN');
  }

  let avatarSaved = true;
  if (data.session && data.user && payload.avatar) {
    try {
      await uploadAvatar(data.user.id, payload.avatar);
    } catch {
      avatarSaved = false; // the account exists; the photo can be added later in the profile
    }
  } else if (payload.avatar) {
    avatarSaved = false; // no session until the e-mail is confirmed
  }

  return { userId: data.user?.id ?? null, needsEmailConfirmation: !data.session, avatarSaved };
}

export async function signIn(email: string, password: string): Promise<void> {
  ensureConfigured();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
}

/**
 * Signs out of this device. `local` clears the stored session before calling the
 * server, so it works offline too (the server call only revokes the refresh token).
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}
