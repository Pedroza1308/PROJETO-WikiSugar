import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MealSlot } from '../types';

/** Sign-up data lives in SignupDraft (memory), not in params. */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: { email?: string; notice?: string } | undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Profile: undefined;
};

export type SearchStackParamList = {
  Search: { query?: string; slot?: MealSlot } | undefined;
  FoodDetail: { foodId: number; slot?: MealSlot };
};

export type GroupsStackParamList = {
  Groups: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupDetail: { groupId: string; name?: string };
};

export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  GroupsTab: NavigatorScreenParams<GroupsStackParamList>;
  DietTab: undefined;
  JournalTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
  /** Photo check-in (modal). `groupId` pre-selects a destination group. */
  NewCheckin: { groupId?: string } | undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootScreenProps<keyof RootStackParamList>
>;

export type TabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, T>,
  RootScreenProps<keyof RootStackParamList>
>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  TabScreenProps<keyof AppTabParamList>
>;

export type SearchScreenProps<T extends keyof SearchStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SearchStackParamList, T>,
  TabScreenProps<keyof AppTabParamList>
>;

export type GroupsScreenProps<T extends keyof GroupsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<GroupsStackParamList, T>,
  TabScreenProps<keyof AppTabParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
