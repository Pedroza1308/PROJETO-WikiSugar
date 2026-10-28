import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
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
 * Auth → App. Completing onboarding/login calls `navigation.reset` to "App",
 * so the Android back button can never return to the auth flow.
 */
export function RootNavigator({ onReady }: { onReady?: () => void }) {
  return (
    <NavigationContainer theme={theme} onReady={onReady}>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Root.Screen name="Auth" component={AuthStack} />
        <Root.Screen name="App" component={AppTabs} />
      </Root.Navigator>
    </NavigationContainer>
  );
}
