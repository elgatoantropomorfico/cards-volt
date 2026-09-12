import { DEG } from "@/lib/card-assets";

/**
 * Exact final hero composition — derived from CardStack + CardScene.
 * progress = 1 MUST match these values (no hand-tuned approximations).
 */
export const HERO_CAMERA_FINAL = {
  position: [0.15, 0.05, 9.1] as [number, number, number],
  fov: 25,
  lookAt: [0.22, 0.05, 0] as [number, number, number],
};

export const HERO_STACK_FINAL = {
  position: [0.22, 0.05, 0] as [number, number, number],
  scale: 0.74,
};

export const HERO_BLACK_FINAL = {
  /** Parked on the right of the hero — keep this translation */
  position: [0.48, -0.08, 0.7] as [number, number, number],
  /**
   * Same camera-relative angle as intro “sexy” pose (left edge closer),
   * only parked at the final hero position.
   * Intro keyframe: [-10°, -22°, -8°]
   */
  rotation: [-10 * DEG, -22 * DEG, -8 * DEG] as [number, number, number],
  scale: 1,
};

export const HERO_WHITE_FINAL = {
  position: [-0.7, 0.14, -1.35] as [number, number, number],
  rotation: [4 * DEG, 8 * DEG, 8 * DEG] as [number, number, number],
  scale: 1.14,
};
