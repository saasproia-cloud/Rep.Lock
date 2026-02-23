import type { PoseLandmark } from '@/types/pose';

export function calculateJointAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magnitudeAB = Math.sqrt(abx * abx + aby * aby);
  const magnitudeCB = Math.sqrt(cbx * cbx + cby * cby);
  const denominator = Math.max(magnitudeAB * magnitudeCB, 1e-6);
  const cos = Math.min(1, Math.max(-1, dot / denominator));

  return (Math.acos(cos) * 180) / Math.PI;
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
