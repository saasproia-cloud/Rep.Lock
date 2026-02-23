import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors } from '@/constants/colors';
import type { ExerciseType } from '@/types/pose';

export default function SuccessScreen() {
  const params = useLocalSearchParams<{ exercise?: string; reps?: string; tokensEarned?: string }>();
  const exercise: ExerciseType = params.exercise === 'squat' ? 'squat' : 'pushup';
  const reps = Number(params.reps ?? '0');
  const tokensEarned = Number(params.tokensEarned ?? '0');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <MaterialIcons name="check" size={54} color="#073019" />
        </View>
        <Text style={styles.title}>Objective validated</Text>
        <Text style={styles.subtitle}>
          {reps} reps • +{tokensEarned} tokens
        </Text>

        <View style={styles.actions}>
          <PrimaryButton label="Back dashboard" onPress={() => router.replace('/')} variant="success" />
          <PrimaryButton
            label={`Do another ${exercise}`}
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
    backgroundColor: Colors.bg,
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
    backgroundColor: 'rgba(78, 226, 122, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4EE27A',
    shadowOpacity: 0.36,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: Colors.text,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 20,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
});
