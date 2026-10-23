import '../global.css';

import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StockPilotDatabaseProvider } from '@/lib/db/provider';

import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Prevent native splash from auto-hiding until initial font assets are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  return (
    <StockPilotDatabaseProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="launch" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
        <Stack.Screen name="order-review" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/new-sale"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modal/add-product"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modal/record-expense"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="explore-sellers" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="setup-check" options={{ headerShown: true, title: 'Foundation Check' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Page not found' }} />
      </Stack>
    </StockPilotDatabaseProvider>
  );
}
