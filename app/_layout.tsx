import '../global.css';

import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
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
    </>
  );
}
