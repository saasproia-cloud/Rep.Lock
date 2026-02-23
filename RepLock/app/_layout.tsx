import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { getColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { RepLockStoreProvider } from '@/state/replock-store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);

  return (
    <RepLockStoreProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="live" />
        <Stack.Screen name="success" />
        <Stack.Screen name="shop" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />
    </RepLockStoreProvider>
  );
}
