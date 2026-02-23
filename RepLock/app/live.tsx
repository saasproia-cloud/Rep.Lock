import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { RepLockLogo } from '@/components/ui/replock-logo';
import { Colors } from '@/constants/colors';
import { detectPose, isPosePluginAvailable } from '@/lib/pose/detect-pose';
import { createRepCounterState, evaluateRepFrame, getRepCounterConfig } from '@/lib/reps/rep-counter';
import { useRepLockStore } from '@/state/replock-store';
import type { ExerciseType, PoseFrameResult } from '@/types/pose';

type DebugState = {
  fps: number;
  confidence: number;
  phase: string;
  angle: number;
  pluginReady: boolean;
};

type SessionState = 'ready' | 'active';

function normalizeElapsedMs(rawElapsed: number): number {
  if (!Number.isFinite(rawElapsed) || rawElapsed <= 0) return 0;
  if (rawElapsed > 100_000) return rawElapsed / 1_000_000;
  return rawElapsed < 10 ? rawElapsed * 1000 : rawElapsed;
}

export default function LiveScreen() {
  const params = useLocalSearchParams<{ exercise?: string; target?: string }>();
  const exercise: ExerciseType = params.exercise === 'squat' ? 'squat' : 'pushup';
  const targetReps = Math.max(1, Math.min(100, Number(params.target ?? '10') || 10));

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [landmarks, setLandmarks] = useState<PoseFrameResult['landmarks']>([]);
  const [reps, setReps] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>('ready');
  const [debug, setDebug] = useState<DebugState>({
    fps: 0,
    confidence: 0,
    phase: 'ready',
    angle: 0,
    pluginReady: isPosePluginAvailable(),
  });

  const lastFrameTimestampMs = useRef<number>(0);
  const counterRef = useRef(createRepCounterState());
  const hasAutoFinished = useRef(false);
  const repConfig = useMemo(() => getRepCounterConfig(exercise), [exercise]);

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

  useEffect(() => {
    if (sessionState !== 'active') return;
    if (reps < targetReps) return;
    if (hasAutoFinished.current) return;

    hasAutoFinished.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    finishSession();
  }, [finishSession, reps, sessionState, targetReps]);

  const startSession = useCallback(() => {
    hasAutoFinished.current = false;
    lastFrameTimestampMs.current = 0;
    counterRef.current = createRepCounterState();
    setReps(0);
    setTokensEarned(0);
    setLandmarks([]);
    setDebug((current) => ({
      ...current,
      fps: 0,
      confidence: 0,
      phase: 'calibrating',
      angle: 0,
      pluginReady: isPosePluginAvailable(),
    }));
    setSessionState('active');
  }, []);

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
      const deltaMs = prevTimestamp > 0 ? normalizeElapsedMs(result.timestampMs - prevTimestamp) : 0;
      lastFrameTimestampMs.current = result.timestampMs;

      setDebug({
        fps: deltaMs > 0 ? Math.min(120, 1000 / deltaMs) : 0,
        confidence: frameEval.debug.confidence,
        phase: frameEval.next.phase,
        angle: frameEval.debug.angle,
        pluginReady: true,
      });

      if (!frameEval.repAwarded) return;
      if (hasAutoFinished.current) return;

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
      if (sessionState !== 'active') return;
      runAtTargetFps(30, () => {
        'worklet';
        const detected = detectPose(frame);
        onPoseFrameRunOnJS(detected);
      });
    },
    [onPoseFrameRunOnJS, sessionState],
  );

  const statusHint = useMemo(() => {
    if (!debug.pluginReady) {
      return 'Pose plugin missing. Rebuild iOS app.';
    }
    if (sessionState === 'ready') {
      return 'Place le telephone et lance la session.';
    }
    if (debug.confidence < repConfig.minConfidence) {
      return 'Recule un peu. Ton corps doit etre visible.';
    }
    if (debug.phase === 'calibrating') {
      return 'Position de depart en cours...';
    }
    if (exercise === 'pushup') {
      return debug.phase === 'up'
        ? `Descends (angle <= ${repConfig.downThreshold.toFixed(0)} deg)`
        : `Remonte (angle >= ${repConfig.upThreshold.toFixed(0)} deg)`;
    }
    return debug.phase === 'up'
      ? `Descends (genoux <= ${repConfig.downThreshold.toFixed(0)} deg)`
      : `Remonte (genoux >= ${repConfig.upThreshold.toFixed(0)} deg)`;
  }, [debug.confidence, debug.phase, debug.pluginReady, exercise, repConfig, sessionState]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permissionRoot}>
        <Text style={styles.permissionTitle}>Camera permission required</Text>
        <Text style={styles.permissionBody}>
          RepLock a besoin de la camera pour detecter ton squelette et compter les repetitions.
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

      <PoseOverlay landmarks={landmarks} mirrored={cameraPosition === 'front'} minVisibility={0.22} />
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
            <Text style={styles.debugText}>{debug.phase}</Text>
            <Text style={styles.debugText}>angle {debug.angle.toFixed(0)} deg</Text>
          </View>
        </View>

        <View pointerEvents="none" style={styles.brandLogoWrap}>
          <RepLockLogo size={44} elevated={false} />
        </View>

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

        {sessionState === 'ready' ? (
          <View style={styles.readyCard}>
            <Text style={styles.readyTitle}>Pret ?</Text>
            <Text style={styles.readySubtitle}>
              {targetReps} {exercise === 'pushup' ? 'pompes' : 'squats'} pour debloquer
            </Text>
            <View style={styles.readyList}>
              <Text style={styles.readyLine}>• Pose le telephone face a toi</Text>
              <Text style={styles.readyLine}>• Corps visible en entier</Text>
              <Text style={styles.readyLine}>• Mouvement complet a chaque rep</Text>
            </View>
            <PrimaryButton label="Commencer" onPress={startSession} />
          </View>
        ) : (
          <View style={styles.bottomPanel}>
            <View style={styles.hintPill}>
              <Text style={styles.hintText}>{statusHint}</Text>
            </View>
            <Text style={styles.repCountText}>
              {reps}
              <Text style={styles.repCountTarget}>/{targetReps}</Text>
            </Text>
            <PrimaryButton label="Finish" onPress={finishSession} variant="outline" />
          </View>
        )}
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
  brandLogoWrap: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 10, 16, 0.66)',
  },
  readyCard: {
    marginBottom: 24,
    backgroundColor: 'rgba(14, 10, 24, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(211, 155, 255, 0.32)',
    padding: 18,
    gap: 10,
  },
  readyTitle: {
    color: Colors.text,
    fontSize: 38,
    fontWeight: '800',
  },
  readySubtitle: {
    color: '#D9A4FF',
    fontSize: 18,
    fontWeight: '700',
  },
  readyList: {
    marginVertical: 4,
    gap: 4,
  },
  readyLine: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPanel: {
    gap: 12,
  },
  hintPill: {
    borderRadius: 14,
    backgroundColor: 'rgba(8, 12, 19, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  repCountTarget: {
    color: Colors.textMuted,
    fontSize: 42,
    fontWeight: '700',
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
