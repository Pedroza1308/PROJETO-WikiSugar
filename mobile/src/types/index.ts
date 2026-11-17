export type DiabetesType = 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'Não tenho';

export type Restriction = 'Glúten' | 'Lactose' | 'Açúcar' | 'Outro';

export interface User {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  email: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  diabetesType: DiabetesType;
  restrictions: string[];
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

/** Food from the TACO table. Nutrients are per 100 g; null = not analysed. */
export interface Food {
  id: number;
  name: string;
  category: string;
  kcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  carbsG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
}

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'supper';

export interface MealItem {
  id: string;
  slot: MealSlot;
  foodId: number | null;
  name: string;
  grams: number;
  kcal: number;
}

export interface Meal {
  id: MealSlot;
  title: string;
  time: string;
  kcal: number;
  items: MealItem[];
}

export interface JournalDraft {
  waterMl: number;
  /** Free-form sleep text, e.g. "7h21" */
  sleep: string;
  tookMedication: boolean;
  medicationTime: string;
  activityType: string;
  activityMinutes: string;
  notes: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  /** Local URI of the optional profile photo. */
  avatar: { uri: string; width: number; height: number } | null;
  diabetesType: DiabetesType;
  restrictions: string[];
  goals: Pick<DailyGoals, 'caloriesKcal' | 'waterMl' | 'sleepHours'>;
}

export type FontScale = 1 | 1.15 | 1.3;

export type GroupRole = 'owner' | 'member';

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  role: GroupRole;
  memberCount: number;
  maxMembers: number;
  myPoints: number;
  myRank: number;
  joinedAt: string;
}

export interface GroupSearchResult {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  memberCount: number;
  maxMembers: number;
  isMember: boolean;
  isFull: boolean;
}

export type JoinGroupResult =
  | 'OK'
  | 'NOT_FOUND'
  | 'ALREADY_MEMBER'
  | 'GROUP_FULL'
  | 'INVALID_PASSWORD'
  | 'TOO_MANY_ATTEMPTS';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: GroupRole;
  points: number;
  checkinCount: number;
  place: number;
}

export interface FeedItem {
  checkinId: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  photoUrl: string | null;
  caption: string | null;
  /** ISO timestamp of the publication (server time). */
  createdAt: string;
  points: number;
}

export interface MyCheckin {
  checkinId: string;
  photoUrl: string | null;
  caption: string | null;
  createdAt: string;
  totalPoints: number;
  groups: { groupId: string; name: string; points: number }[];
}
