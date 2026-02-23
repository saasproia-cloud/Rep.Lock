import { Canvas, Circle, Line } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { POSE_CONNECTIONS } from '@/lib/pose/connections';
import type { PoseLandmark } from '@/types/pose';

type PoseOverlayProps = {
  landmarks: PoseLandmark[];
  mirrored?: boolean;
  minVisibility?: number;
};

type ScreenPoint = {
  x: number;
  y: number;
  visibility: number;
};

export function PoseOverlay({ landmarks, mirrored = false, minVisibility = 0.4 }: PoseOverlayProps) {
  const { width, height } = useWindowDimensions();

  const points = useMemo<ScreenPoint[]>(() => {
    return landmarks.map((landmark) => ({
      x: (mirrored ? 1 - landmark.x : landmark.x) * width,
      y: landmark.y * height,
      visibility: landmark.visibility,
    }));
  }, [height, landmarks, mirrored, width]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {POSE_CONNECTIONS.map(([startIndex, endIndex]) => {
          const start = points[startIndex];
          const end = points[endIndex];
          if (!start || !end || start.visibility < minVisibility || end.visibility < minVisibility) {
            return null;
          }

          return (
            <Line
              key={`line-${startIndex}-${endIndex}`}
              p1={{ x: start.x, y: start.y }}
              p2={{ x: end.x, y: end.y }}
              color={Colors.skeletonLine}
              strokeWidth={3}
            />
          );
        })}

        {points.map((point, index) => {
          if (point.visibility < minVisibility) return null;
          return (
            <Circle
              key={`joint-${index}`}
              cx={point.x}
              cy={point.y}
              r={4}
              color={Colors.skeletonJoint}
            />
          );
        })}
      </Canvas>
    </View>
  );
}
