import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { NewCheckinScreen } from '../screens/NewCheckinScreen';
import { useApp } from '../store/AppContext';
import { colors } from '../theme/tokens';
import { AppTabs } from './AppTabs';
import { AuthStack } from './AuthStack';
import type { RootStackParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();

const theme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.screenBg,
    card: colors.surface,
    text: colors.ink,
    border: colors.line,
  },
};

/**
 * The Supabase session decides which screens exist: signing in, signing up or
 * restoring a stored session shows the app; signing out (or an expired session)
 * shows the auth flow. History is replaced, so "back" never crosses the boundary.
 */
export function RootNavigator({ onReady }: { onReady?: () => void }) {
  const { session } = useApp();
  return (
    <NavigationContainer theme={theme} onReady={onReady}>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {session ? (
          <>
            <Root.Screen name="App" component={AppTabs} />
            <Root.Screen
              name="NewCheckin"
              component={NewCheckinScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        ) : (
          <Root.Screen name="Auth" component={AuthStack} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
