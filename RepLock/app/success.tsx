import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { RepLockLogo } from '@/components/ui/replock-logo';
import { useAppColors } from '@/hooks/use-app-colors';
import type { ExerciseType } from '@/types/pose';

export default function SuccessScreen() {
  const colors = useAppColors();
  const params = useLocalSearchParams<{ exercise?: string; reps?: string; tokensEarned?: string }>();
  const exercise: ExerciseType = params.exercise === 'squat' ? 'squat' : 'pushup';
  const reps = Number(params.reps ?? '0');
  const tokensEarned = Number(params.tokensEarned ?? '0');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <RepLockLogo size={72} />
        <View style={[styles.badge, { backgroundColor: colors.success, shadowColor: colors.success }]}>
          <MaterialIcons name="check" size={54} color="#08361A" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Session validee</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {reps} reps | +{tokensEarned} tokens
        </Text>

        <View style={styles.actions}>
          <PrimaryButton label="Retour accueil" onPress={() => router.replace('/')} variant="success" />
          <PrimaryButton
            label={`Refaire ${exercise === 'pushup' ? 'des pompes' : 'des squats'}`}
            onPress={() => router.replace({ pathname: '/live', params: { exercise } })}
            variant="outline"
          />
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  badge: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
});
