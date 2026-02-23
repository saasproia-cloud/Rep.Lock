import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

import { PoseOverlay } from '@/components/pose/pose-overlay';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors } from '@/constants/colors';
import { detectPose, isPosePluginAvailable } from '@/lib/pose/detect-pose';
import { createRepCounterState, evaluateRepFrame } from '@/lib/reps/rep-counter';
import { useRepLockStore } from '@/state/replock-store';
import type { ExerciseType, PoseFrameResult } from '@/types/pose';

type DebugState = {
  fps: number;
  confidence: number;
  phase: string;
  angle: number;
  pluginReady: boolean;
};

export default function LiveScreen() {
  const params = useLocalSearchParams<{ exercise?: string }>();
  const exercise: ExerciseType = params.exercise === 'squat' ? 'squat' : 'pushup';
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [landmarks, setLandmarks] = useState<PoseFrameResult['landmarks']>([]);
  const [reps, setReps] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [debug, setDebug] = useState<DebugState>({
    fps: 0,
    confidence: 0,
    phase: 'calibrating',
    angle: 0,
    pluginReady: isPosePluginAvailable(),
  });
  const lastFrameTimestampMs = useRef<number>(0);
  const counterRef = useRef(createRepCounterState());

  const { tokens, addTokens } = useRepLockStore();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(cameraPosition);

  const flashOpacity = useSharedValue(0);
  const popOpacity = useSharedValue(0);
  const popScale = useSharedValue(0.75);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const popStyle = useAnimatedStyle(() => ({
    opacity: popOpacity.value,
    transform: [{ scale: popScale.value }],
  }));

  const triggerRepFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    flashOpacity.value = 0.4;
    flashOpacity.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });

    popOpacity.value = 1;
    popScale.value = 0.75;
    popScale.value = withSequence(withTiming(1.15, { duration: 140 }), withTiming(1, { duration: 160 }));
    popOpacity.value = withSequence(withTiming(1, { duration: 40 }), withDelay(500, withTiming(0, { duration: 220 })));
  }, [flashOpacity, popOpacity, popScale]);

  const onPoseFrame = useCallback(
    (result: PoseFrameResult | null) => {
      if (!result) {
        setLandmarks([]);
        setDebug((current) => ({
          ...current,
          confidence: 0,
          phase: current.pluginReady ? 'calibrating' : 'plugin-missing',
          angle: 0,
        }));
        return;
      }

      setLandmarks(result.landmarks);
      const frameEval = evaluateRepFrame(exercise, result, counterRef.current);
      counterRef.current = frameEval.next;

      const prevTimestamp = lastFrameTimestampMs.current;
      const deltaMs = prevTimestamp > 0 ? result.timestampMs - prevTimestamp : 0;
      lastFrameTimestampMs.current = result.timestampMs;

      setDebug({
        fps: deltaMs > 0 ? Math.min(120, 1000 / deltaMs) : 0,
        confidence: frameEval.debug.confidence,
        phase: frameEval.next.phase,
        angle: frameEval.debug.angle,
        pluginReady: true,
      });

      if (!frameEval.repAwarded) return;

      setReps(frameEval.next.reps);
      setTokensEarned((value) => value + 10);
      addTokens(10);
      triggerRepFeedback();
    },
    [addTokens, exercise, triggerRepFeedback],
  );

  const onPoseFrameRunOnJS = useMemo(() => Worklets.createRunOnJS(onPoseFrame), [onPoseFrame]);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(30, () => {
        'worklet';
        const detected = detectPose(frame);
        onPoseFrameRunOnJS(detected);
      });
    },
    [onPoseFrameRunOnJS],
  );

  const finishSession = useCallback(() => {
    router.replace({
      pathname: '/success',
      params: {
        exercise,
        reps: String(reps),
        tokensEarned: String(tokensEarned),
      },
    });
  }, [exercise, reps, tokensEarned]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permissionRoot}>
        <Text style={styles.permissionTitle}>Camera permission required</Text>
        <Text style={styles.permissionBody}>
          RepLock a besoin de la camera pour detecter ton squelette et compter les reps.
        </Text>
        <PrimaryButton label="Allow camera" onPress={requestPermission} />
        <PrimaryButton label="Back" onPress={() => router.replace('/')} variant="outline" />
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.permissionRoot}>
        <Text style={styles.permissionTitle}>No camera device</Text>
        <Text style={styles.permissionBody}>Impossible de trouver une camera disponible sur cet appareil.</Text>
        <PrimaryButton label="Back" onPress={() => router.replace('/')} variant="outline" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        pixelFormat="yuv"
        frameProcessor={frameProcessor}
      />

      <PoseOverlay landmarks={landmarks} mirrored={cameraPosition === 'front'} />

      <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topRow}>
          <View style={styles.tokenPill}>
            <Text style={styles.tokenLabel}>TOKENS</Text>
            <Text style={styles.tokenValue}>{tokens}</Text>
          </View>

          <View style={styles.debugPill}>
            <Text style={styles.debugText}>{exercise.toUpperCase()}</Text>
            <Text style={styles.debugText}>fps {debug.fps.toFixed(1)}</Text>
            <Text style={styles.debugText}>conf {(debug.confidence * 100).toFixed(0)}%</Text>
            <Text style={styles.debugText}>{debug.pluginReady ? 'plugin ok' : 'plugin missing'}</Text>
            <Text style={styles.debugText}>{debug.phase}</Text>
            <Text style={styles.debugText}>angle {debug.angle.toFixed(0)} deg</Text>
          </View>
        </View>

        {!debug.pluginReady && (
          <View style={styles.errorPill}>
            <Text style={styles.errorTitle}>Pose plugin manquant</Text>
            <Text style={styles.errorBody}>
              Rebuild iOS apres cette mise a jour pour activer la detection du squelette.
            </Text>
          </View>
        )}

        <View style={styles.topControls}>
          <Pressable style={styles.iconButton} onPress={() => router.replace('/')}>
            <MaterialIcons name="close" size={28} color={Colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => setCameraPosition((value) => (value === 'front' ? 'back' : 'front'))}>
            <MaterialIcons name="flip-camera-ios" size={26} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.repCountText}>{reps}</Text>
          <PrimaryButton label="Finish" onPress={finishSession} variant="outline" />
        </View>
      </SafeAreaView>

      <Animated.View pointerEvents="none" style={[styles.repPop, popStyle]}>
        <Text style={styles.repPopText}>+10</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  tokenPill: {
    backgroundColor: 'rgba(7, 10, 16, 0.72)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tokenLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  tokenValue: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 44,
  },
  debugPill: {
    backgroundColor: 'rgba(7, 10, 16, 0.72)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'flex-end',
    minWidth: 116,
  },
  debugText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  topControls: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorPill: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 95, 103, 0.2)',
    borderColor: 'rgba(255, 95, 103, 0.6)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  errorBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 10, 16, 0.66)',
  },
  bottomPanel: {
    gap: 12,
  },
  repCountText: {
    color: Colors.text,
    fontSize: 86,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 90,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 8,
  },
  repPop: {
    position: 'absolute',
    top: '47%',
    alignSelf: 'center',
    backgroundColor: 'rgba(13, 250, 121, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  repPopText: {
    color: '#04230E',
    fontSize: 30,
    fontWeight: '800',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(58, 255, 126, 0.42)',
  },
  permissionRoot: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  permissionTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  permissionBody: {
    color: Colors.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
});
