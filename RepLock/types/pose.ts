export type PoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
  presence: number;
};

export type PoseFrameResult = {
  landmarks: PoseLandmark[];
  confidence: number;
  timestampMs: number;
};

export type ExerciseType = 'pushup' | 'squat';

export type RepPhase = 'up' | 'down' | 'calibrating';
