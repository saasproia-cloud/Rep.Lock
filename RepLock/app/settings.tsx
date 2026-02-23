import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTabBar } from '@/components/ui/app-tab-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RepLockLogo } from '@/components/ui/replock-logo';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRepLockStore } from '@/state/replock-store';

export default function SettingsScreen() {
  const colors = useAppColors();
  const colorScheme = useColorScheme();
  const { tokens, timeCredits, resetProgress } = useRepLockStore();

  const onReset = () => {
    Alert.alert('Reinitialiser les donnees ?', 'Tokens et credits seront remis a zero.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: () => resetProgress(),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <RepLockLogo size={70} />
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Parametres</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Base MVP complete et propre.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Theme</Text>
          <Text style={[styles.cardLine, { color: colors.textMuted }]}>
            Mode actuel: {colorScheme === 'light' ? 'clair' : 'sombre'} (automatique systeme)
          </Text>
          <Text style={[styles.cardLine, { color: colors.textMuted }]}>
            Palette: violet / noir selon ton logo officiel.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Compte local</Text>
          <Text style={[styles.cardLine, { color: colors.textMuted }]}>Tokens: {tokens}</Text>
          <Text style={[styles.cardLine, { color: colors.textMuted }]}>TikTok: {timeCredits.tiktok} min</Text>
          <Text style={[styles.cardLine, { color: colors.textMuted }]}>Instagram: {timeCredits.instagram} min</Text>
          <Text style={[styles.cardLine, { color: colors.textMuted }]}>YouTube: {timeCredits.youtube} min</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Tester la detection (1 rep)"
            onPress={() => router.push({ pathname: '/live', params: { exercise: 'pushup', target: '1' } })}
          />
          <PrimaryButton label="Reinitialiser progression" onPress={onReset} variant="outline" />
          <PrimaryButton label="Aller a la boutique" onPress={() => router.replace('/shop')} variant="success" />
        </View>

        <AppTabBar current="settings" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardLine: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    marginTop: 'auto',
    gap: 10,
  },
});
