import type { Frame } from 'react-native-vision-camera';
import { VisionCameraProxy } from 'react-native-vision-camera';

import type { PoseFrameResult } from '@/types/pose';

let posePlugin = VisionCameraProxy.initFrameProcessorPlugin('poseLandmarker', {});

function getPosePlugin() {
  'worklet';
  if (posePlugin != null) return posePlugin;
  posePlugin = VisionCameraProxy.initFrameProcessorPlugin('poseLandmarker', {});
  return posePlugin;
}

export function isPosePluginAvailable(): boolean {
  if (posePlugin == null) {
    posePlugin = VisionCameraProxy.initFrameProcessorPlugin('poseLandmarker', {});
  }
  return posePlugin != null;
}

export function detectPose(frame: Frame): PoseFrameResult | null {
  'worklet';
  const plugin = getPosePlugin();
  if (plugin == null) {
    return null;
  }

  return plugin.call(frame) as unknown as PoseFrameResult | null;
}
