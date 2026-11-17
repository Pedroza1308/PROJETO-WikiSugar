// Persists the auth session in SQLite-backed `localStorage` (survives app restarts).
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

/** False when mobile/.env.local is missing; the app shows a setup message instead of crashing. */
export const isSupabaseConfigured = url.startsWith('https://') && key.length > 20;

export const supabase = createClient(isSupabaseConfigured ? url : 'https://not-configured.invalid', key || 'missing', {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export const BUCKETS = { avatars: 'avatars', checkins: 'checkins' } as const;
