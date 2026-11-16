import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../components/Icon';
import { Txt } from '../components/Txt';
import { DietScreen } from '../screens/DietScreen';
import { FoodDetailScreen } from '../screens/FoodDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { colors, shadows } from '../theme/tokens';
import type { AppTabParamList, HomeStackParamList, SearchStackParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

const stackOptions = { headerShown: false, contentStyle: { backgroundColor: colors.screenBg } } as const;

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
    </HomeStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={stackOptions}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="FoodDetail" component={FoodDetailScreen} />
    </SearchStack.Navigator>
  );
}

const TABS: Record<keyof AppTabParamList, { label: string; icon: IconName }> = {
  HomeTab: { label: 'Início', icon: 'home' },
  SearchTab: { label: 'Buscar', icon: 'search' },
  DietTab: { label: 'Sua Dieta', icon: 'diet' },
  JournalTab: { label: 'Diário', icon: 'journal' },
};

/** Custom tab bar matching the prototype (active tab gets a pale rounded background). */
function WikiTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { height: 84 + insets.bottom, paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name as keyof AppTabParamList];
        const color = focused ? colors.primary : colors.navInactive;
        const onPress = () => {
          // Emitting tabPress lets nested native stacks pop to top when re-tapping the active tab.
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            style={styles.item}
          >
            <View style={[styles.inner, focused && styles.innerActive]}>
              <Icon name={tab.icon} size={22} color={color} />
              <Txt size={12} weight={700} color={color} numberOfLines={1}>
                {tab.label}
              </Txt>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.screenBg } }}
      tabBar={(props) => <WikiTabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="SearchTab" component={SearchStackNavigator} />
      <Tab.Screen name="DietTab" component={DietScreen} />
      <Tab.Screen name="JournalTab" component={JournalScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 8,
    paddingTop: 8,
    ...shadows.up,
  },
  item: { flex: 1, alignItems: 'stretch', justifyContent: 'flex-start' },
  inner: {
    height: 64,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: 2,
  },
  innerActive: { backgroundColor: colors.primaryPale },
});
