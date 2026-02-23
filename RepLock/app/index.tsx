import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTabBar } from '@/components/ui/app-tab-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RepLockLogo } from '@/components/ui/replock-logo';
import { useAppColors } from '@/hooks/use-app-colors';
import { useRepLockStore } from '@/state/replock-store';

export default function HomeScreen() {
  const colors = useAppColors();
  const { tokens, timeCredits } = useRepLockStore();
  const totalMinutes = timeCredits.tiktok + timeCredits.instagram + timeCredits.youtube;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.bgOrnamentWrap} pointerEvents="none">
        <View style={[styles.bgOrbLarge, { backgroundColor: colors.accent }]} />
        <View style={[styles.bgOrbSmall, { backgroundColor: colors.accentAlt }]} />
      </View>

      <View style={styles.container}>
        <View style={styles.hero}>
          <RepLockLogo size={96} />
          <View style={styles.heroText}>
            <Text style={[styles.title, { color: colors.text }]}>RepLock</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Debloque tes apps en gagnant du temps avec des reps.
            </Text>
          </View>
        </View>

        <View style={[styles.tokenCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>TOKENS DISPONIBLES</Text>
          <Text style={[styles.tokenValue, { color: colors.text }]}>{tokens}</Text>
          <View style={styles.creditRow}>
            <Text style={[styles.creditText, { color: colors.textMuted }]}>TikTok {timeCredits.tiktok} min</Text>
            <Text style={[styles.creditText, { color: colors.textMuted }]}>Instagram {timeCredits.instagram} min</Text>
            <Text style={[styles.creditText, { color: colors.textMuted }]}>YouTube {timeCredits.youtube} min</Text>
          </View>
          <View style={[styles.totalMinutesPill, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <MaterialIcons name="timer" size={16} color={colors.accent} />
            <Text style={[styles.totalMinutesText, { color: colors.text }]}>{totalMinutes} min de credits totaux</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Faire des pompes"
            onPress={() => router.push({ pathname: '/live', params: { exercise: 'pushup', target: '10' } })}
          />
          <PrimaryButton
            label="Faire des squats"
            onPress={() => router.push({ pathname: '/live', params: { exercise: 'squat', target: '12' } })}
            variant="outline"
          />
        </View>

        <View style={styles.quickActions}>
          <PrimaryButton label="Ouvrir la boutique" onPress={() => router.replace('/shop')} variant="success" />
          <PrimaryButton label="Parametres" onPress={() => router.replace('/settings')} variant="outline" />
        </View>

        <AppTabBar current="home" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  bgOrnamentWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  bgOrbLarge: {
    position: 'absolute',
    top: -130,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.2,
  },
  bgOrbSmall: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.15,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  tokenCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  tokenLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  tokenValue: {
    fontSize: 66,
    lineHeight: 70,
    fontWeight: '800',
  },
  creditRow: {
    gap: 4,
  },
  creditText: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalMinutesPill: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalMinutesText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    gap: 10,
  },
  quickActions: {
    gap: 10,
    marginTop: 'auto',
  },
});
