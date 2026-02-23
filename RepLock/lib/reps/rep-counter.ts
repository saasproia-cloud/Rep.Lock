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
    minConfidence: 0.55,
    downThreshold: 100,
    upThreshold: 155,
    minRepGapMs: 450,
  },
  squat: {
    minConfidence: 0.55,
    downThreshold: 105,
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
  return values;
}

function computePushupFrame(landmarks: PoseLandmark[]): RepFrameDebug {
  const left = visibleLandmarks(landmarks, [JOINTS.leftShoulder, JOINTS.leftElbow, JOINTS.leftWrist]);
  const right = visibleLandmarks(landmarks, [JOINTS.rightShoulder, JOINTS.rightElbow, JOINTS.rightWrist]);
  if (!left || !right) return { angle: 0, confidence: 0 };

  const leftAngle = calculateJointAngle(left[0], left[1], left[2]);
  const rightAngle = calculateJointAngle(right[0], right[1], right[2]);
  const confidence = average([
    left[0].visibility,
    left[1].visibility,
    left[2].visibility,
    right[0].visibility,
    right[1].visibility,
    right[2].visibility,
  ]);

  return { angle: average([leftAngle, rightAngle]), confidence };
}

function computeSquatFrame(landmarks: PoseLandmark[]): RepFrameDebug {
  const left = visibleLandmarks(landmarks, [JOINTS.leftHip, JOINTS.leftKnee, JOINTS.leftAnkle]);
  const right = visibleLandmarks(landmarks, [JOINTS.rightHip, JOINTS.rightKnee, JOINTS.rightAnkle]);
  if (!left || !right) return { angle: 0, confidence: 0 };

  const leftAngle = calculateJointAngle(left[0], left[1], left[2]);
  const rightAngle = calculateJointAngle(right[0], right[1], right[2]);
  const confidence = average([
    left[0].visibility,
    left[1].visibility,
    left[2].visibility,
    right[0].visibility,
    right[1].visibility,
    right[2].visibility,
  ]);

  return { angle: average([leftAngle, rightAngle]), confidence };
}

export function createRepCounterState(): RepCounterState {
  return {
    reps: 0,
    phase: 'calibrating',
    lastRepTimestampMs: 0,
  };
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
    if (result.timestampMs - previous.lastRepTimestampMs < config.minRepGapMs) {
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
