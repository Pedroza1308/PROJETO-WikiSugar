import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider, useApp } from './src/store/AppContext';

// Keep the native splash visible until fonts + mocked bootstrap data are ready.
void SplashScreen.preventAutoHideAsync();

function Root() {
  const { ready } = useApp();
  const [navReady, setNavReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const fontsDone = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontsDone && ready && navReady) void SplashScreen.hideAsync();
  }, [fontsDone, ready, navReady]);

  const onNavReady = useCallback(() => setNavReady(true), []);

  // Render nothing until fonts resolve so text never flashes in the system font.
  if (!fontsDone) return null;

  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator onReady={onNavReady} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
