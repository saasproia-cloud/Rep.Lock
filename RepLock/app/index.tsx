import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors } from '@/constants/colors';
import { useRepLockStore } from '@/state/replock-store';

export default function HomeScreen() {
  const { tokens, timeCredits } = useRepLockStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tokenCard}>
          <Text style={styles.tokenLabel}>TOTAL TOKENS</Text>
          <Text style={styles.tokenValue}>{tokens}</Text>
          <Text style={styles.tokenSub}>
            TikTok {timeCredits.tiktok} min · Insta {timeCredits.instagram} min · YouTube{' '}
            {timeCredits.youtube} min
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Start Pushups"
            onPress={() => router.push({ pathname: '/live', params: { exercise: 'pushup' } })}
          />
          <PrimaryButton
            label="Start Squats"
            onPress={() => router.push({ pathname: '/live', params: { exercise: 'squat' } })}
            variant="outline"
          />
          <PrimaryButton label="Shop" onPress={() => router.push('/shop')} variant="success" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  tokenCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  tokenLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  tokenValue: {
    color: Colors.text,
    fontSize: 62,
    fontWeight: '800',
    lineHeight: 66,
  },
  tokenSub: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
  },
});
