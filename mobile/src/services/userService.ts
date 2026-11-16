import { mockGoals, mockNextMeal, mockTodayProgress } from '../mocks/goals';
import { mockUser } from '../mocks/user';
import type { DailyGoals, DailyProgress, NextMeal, RegisterPayload, User } from '../types';
import { initialsFrom } from '../utils/format';
import { clone, delay } from './mockClient';

/**
 * User / goals / daily progress service (mocked).
 * Future: POST /auth/login, POST /auth/register, GET/PUT /me/goals, GET /me/progress/today.
 */
let user: User = clone(mockUser);
let goals: DailyGoals = clone(mockGoals);
let progress: DailyProgress = clone(mockTodayProgress);

export async function login(_email: string, _password: string): Promise<User> {
  // Mocked: accepts any credentials.
  return delay(clone(user));
}

export async function register(payload: RegisterPayload): Promise<{ user: User; goals: DailyGoals }> {
  const name = payload.name.trim() || mockUser.name;
  user = {
    ...user,
    name,
    firstName: name.split(/\s+/)[0],
    initials: initialsFrom(name),
    email: payload.email.trim() || mockUser.email,
    diabetesType: payload.diabetesType,
    restrictions: payload.restrictions,
  };
  goals = { ...goals, ...payload.goals };
  return delay({ user: clone(user), goals: clone(goals) });
}

export async function getCurrentUser(): Promise<User> {
  return delay(clone(user));
}

export async function getGoals(): Promise<DailyGoals> {
  return delay(clone(goals));
}

export async function updateGoals(next: DailyGoals): Promise<DailyGoals> {
  goals = clone(next);
  return delay(clone(goals), 200);
}

export async function getTodayProgress(): Promise<DailyProgress> {
  return delay(clone(progress));
}

export async function updateTodayProgress(patch: Partial<DailyProgress>): Promise<DailyProgress> {
  progress = { ...progress, ...patch };
  return delay(clone(progress), 100);
}

export async function getNextMeal(): Promise<NextMeal> {
  return delay(clone(mockNextMeal));
}
