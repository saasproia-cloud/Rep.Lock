import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { RepLockStoreProvider } from '@/state/replock-store';

export default function RootLayout() {
  return (
    <RepLockStoreProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#070A10' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="live" />
        <Stack.Screen name="success" />
        <Stack.Screen name="shop" />
      </Stack>
      <StatusBar style="light" />
    </RepLockStoreProvider>
  );
}
