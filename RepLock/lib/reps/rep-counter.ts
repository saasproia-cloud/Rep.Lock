import { average, calculateJointAngle } from '@/lib/pose/geometry';
import type { ExerciseType, PoseFrameResult, PoseLandmark, RepPhase } from '@/types/pose';

type RepCounterConfig = {
  minConfidence: number;
  downThreshold: number;
  upThreshold: number;
  minRepGapMs: number;
};

export type RepCounterState = {
  reps: number;
  phase: RepPhase;
  lastRepTimestampMs: number;
};

export type RepFrameDebug = {
  confidence: number;
  angle: number;
};

const configByExercise: Record<ExerciseType, RepCounterConfig> = {
  pushup: {
    minConfidence: 0.26,
    downThreshold: 112,
    upThreshold: 155,
    minRepGapMs: 450,
  },
  squat: {
    minConfidence: 0.24,
    downThreshold: 108,
    upThreshold: 165,
    minRepGapMs: 500,
  },
};

const JOINTS = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

function visibleLandmarks(landmarks: PoseLandmark[], indices: number[]): PoseLandmark[] | null {
  const values = indices.map((index) => landmarks[index]).filter(Boolean);
  if (values.length !== indices.length) return null;
  if (values.some((point) => point.visibility <= 0.01)) return null;
  return values;
}

function combineFrameDebug(candidates: RepFrameDebug[]): RepFrameDebug {
  if (candidates.length === 0) {
    return { angle: 0, confidence: 0 };
  }

  return {
    angle: average(candidates.map((entry) => entry.angle)),
    confidence: average(candidates.map((entry) => entry.confidence)),
  };
}

function computeSideDebug(
  landmarks: PoseLandmark[],
  indices: [number, number, number],
): RepFrameDebug | null {
  const side = visibleLandmarks(landmarks, indices);
  if (!side) return null;

  const angle = calculateJointAngle(side[0], side[1], side[2]);
  const confidence = average([side[0].visibility, side[1].visibility, side[2].visibility]);
  if (!Number.isFinite(angle)) return null;

  return { angle, confidence };
}

function computePushupFrame(landmarks: PoseLandmark[]): RepFrameDebug {
  const left = computeSideDebug(landmarks, [JOINTS.leftShoulder, JOINTS.leftElbow, JOINTS.leftWrist]);
  const right = computeSideDebug(landmarks, [JOINTS.rightShoulder, JOINTS.rightElbow, JOINTS.rightWrist]);

  return combineFrameDebug([left, right].filter(Boolean) as RepFrameDebug[]);
}

function computeSquatFrame(landmarks: PoseLandmark[]): RepFrameDebug {
  const left = computeSideDebug(landmarks, [JOINTS.leftHip, JOINTS.leftKnee, JOINTS.leftAnkle]);
  const right = computeSideDebug(landmarks, [JOINTS.rightHip, JOINTS.rightKnee, JOINTS.rightAnkle]);

  return combineFrameDebug([left, right].filter(Boolean) as RepFrameDebug[]);
}

export function createRepCounterState(): RepCounterState {
  return {
    reps: 0,
    phase: 'calibrating',
    lastRepTimestampMs: 0,
  };
}

export function getRepCounterConfig(exercise: ExerciseType): RepCounterConfig {
  return configByExercise[exercise];
}

function normalizeElapsedMs(rawElapsed: number): number {
  if (!Number.isFinite(rawElapsed) || rawElapsed <= 0) return 0;
  // Some native frame timestamps can be in seconds or nanoseconds.
  if (rawElapsed > 100_000) return rawElapsed / 1_000_000;
  return rawElapsed < 10 ? rawElapsed * 1000 : rawElapsed;
}

export function evaluateRepFrame(
  exercise: ExerciseType,
  result: PoseFrameResult,
  previous: RepCounterState,
): { next: RepCounterState; repAwarded: boolean; debug: RepFrameDebug } {
  const config = configByExercise[exercise];
  const debug = exercise === 'pushup' ? computePushupFrame(result.landmarks) : computeSquatFrame(result.landmarks);

  if (debug.confidence < config.minConfidence) {
    return {
      next: { ...previous, phase: 'calibrating' },
      repAwarded: false,
      debug,
    };
  }

  if (previous.phase === 'calibrating') {
    return {
      next: {
        ...previous,
        phase: debug.angle >= config.upThreshold ? 'up' : 'down',
      },
      repAwarded: false,
      debug,
    };
  }

  if (previous.phase === 'up' && debug.angle <= config.downThreshold) {
    return {
      next: {
        ...previous,
        phase: 'down',
      },
      repAwarded: false,
      debug,
    };
  }

  if (previous.phase === 'down' && debug.angle >= config.upThreshold) {
    const elapsedMs = normalizeElapsedMs(result.timestampMs - previous.lastRepTimestampMs);
    if (previous.lastRepTimestampMs > 0 && elapsedMs < config.minRepGapMs) {
      return {
        next: {
          ...previous,
          phase: 'up',
        },
        repAwarded: false,
        debug,
      };
    }

    return {
      next: {
        reps: previous.reps + 1,
        phase: 'up',
        lastRepTimestampMs: result.timestampMs,
      },
      repAwarded: true,
      debug,
    };
  }

  return {
    next: previous,
    repAwarded: false,
    debug,
  };
}
