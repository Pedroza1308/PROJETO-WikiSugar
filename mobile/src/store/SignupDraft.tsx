import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_GOALS } from '../config/rules';
import type { PickedImage } from '../lib/images';
import type { DailyGoals, DiabetesType } from '../types';

/**
 * Data collected across the sign-up steps. Kept in memory only (never in
 * navigation params) so the password is not stored in navigation state.
 */
export interface SignupDraft {
  name: string;
  email: string;
  password: string;
  avatar: PickedImage | null;
  diabetesType: DiabetesType;
  restrictions: string[];
  goals: Pick<DailyGoals, 'caloriesKcal' | 'waterMl' | 'sleepHours'>;
}

const EMPTY: SignupDraft = {
  name: '',
  email: '',
  password: '',
  avatar: null,
  diabetesType: 'Tipo 2',
  restrictions: ['Açúcar'],
  goals: { caloriesKcal: DEFAULT_GOALS.caloriesKcal, waterMl: DEFAULT_GOALS.waterMl, sleepHours: DEFAULT_GOALS.sleepHours },
};

interface SignupDraftValue {
  draft: SignupDraft;
  update: (patch: Partial<SignupDraft>) => void;
  reset: () => void;
}

const SignupDraftContext = createContext<SignupDraftValue | null>(null);

export function SignupDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SignupDraft>(EMPTY);
  const update = useCallback((patch: Partial<SignupDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => setDraft(EMPTY), []);
  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);
  return <SignupDraftContext.Provider value={value}>{children}</SignupDraftContext.Provider>;
}

export function useSignupDraft(): SignupDraftValue {
  const ctx = useContext(SignupDraftContext);
  if (!ctx) throw new Error('useSignupDraft must be used inside <SignupDraftProvider>');
  return ctx;
}
