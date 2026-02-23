import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';

type AppTabBarProps = {
  current: 'home' | 'shop' | 'settings';
};

type TabItem = {
  key: AppTabBarProps['current'];
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: '/' | '/shop' | '/settings';
};

const TABS: TabItem[] = [
  { key: 'home', label: 'Accueil', icon: 'home-filled', route: '/' },
  { key: 'shop', label: 'Boutique', icon: 'shopping-bag', route: '/shop' },
  { key: 'settings', label: 'Parametres', icon: 'tune', route: '/settings' },
];

export function AppTabBar({ current }: AppTabBarProps) {
  const colors = useAppColors();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.tabBg, borderColor: colors.border }]}>
      {TABS.map((tab) => {
        const active = tab.key === current;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active && { backgroundColor: colors.panel }]}
            onPress={() => router.replace(tab.route)}>
            <MaterialIcons name={tab.icon} size={20} color={active ? colors.tabActive : colors.tabInactive} />
            <Text style={[styles.label, { color: active ? colors.text : colors.textMuted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
