import { DEG } from "@/lib/card-assets";
import {
  HERO_BLACK_FINAL,
  HERO_CAMERA_FINAL,
  HERO_STACK_FINAL,
  HERO_WHITE_FINAL,
} from "../heroFinal";

export type Vec3 = [number, number, number];

export type Pose3 = {
  position: Vec3;
  rotation: Vec3;
  scale: number;
};

export type HeroKeyframe = {
  progress: number;
  camera: { position: Vec3; lookAt: Vec3; fov: number };
  stack: { position: Vec3; scale: number };
  blackCard: Pose3;
  whiteCard: Pose3 & { reveal: number };
  /** 0–1 highlight sweep across the black card */
  lightSweep: number;
};

/** Key poses — continuous interpolation; KEY_H is the live hero. */
export const heroCardKeyframes: HeroKeyframe[] = [
  // KEY_A — far 3/4 black only
  {
    progress: 0,
    camera: {
      position: [0.05, 0.35, 16.8],
      lookAt: [0, 0.05, 0],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: { position: [0, 0.05, 0], scale: 1 },
    blackCard: {
      position: [0, 0.05, 0],
      rotation: [-15 * DEG, -35 * DEG, -12 * DEG],
      scale: 1.05,
    },
    whiteCard: {
      position: [-0.2, 0.1, -2.4],
      rotation: [4 * DEG, 20 * DEG, 10 * DEG],
      scale: 0.9,
      reveal: 0,
    },
    lightSweep: 0,
  },
  // KEY_B — dolly-in + rotation starts
  {
    progress: 0.18,
    camera: {
      position: [0.08, 0.22, 13.2],
      lookAt: [0, 0.04, 0],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: { position: [0, 0.04, 0], scale: 1 },
    blackCard: {
      position: [0.02, 0.03, 0.05],
      rotation: [-10 * DEG, -22 * DEG, -8 * DEG],
      scale: 1.08,
    },
    whiteCard: {
      position: [-0.25, 0.12, -2.2],
      rotation: [4 * DEG, 16 * DEG, 9 * DEG],
      scale: 0.92,
      reveal: 0,
    },
    lightSweep: 0.25,
  },
  // KEY_C — nearly frontal, much closer
  {
    progress: 0.4,
    camera: {
      position: [0.04, 0.08, 7.4],
      lookAt: [0, 0.02, 0],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: { position: [0, 0.02, 0], scale: 1 },
    blackCard: {
      position: [0, 0.01, 0.1],
      rotation: [-3 * DEG, -6 * DEG, -2 * DEG],
      scale: 1.2,
    },
    whiteCard: {
      position: [-0.3, 0.1, -1.8],
      rotation: [3 * DEG, 12 * DEG, 7 * DEG],
      scale: 0.95,
      reveal: 0,
    },
    lightSweep: 0.55,
  },
  // KEY_D — fills viewport
  {
    progress: 0.57,
    camera: {
      position: [0, 0.02, 2.85],
      lookAt: [0, 0.01, 0],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: { position: [0, 0, 0], scale: 1 },
    blackCard: {
      position: [0, 0, 0],
      rotation: [0, 0, -0.5 * DEG],
      scale: 1.55,
    },
    whiteCard: {
      position: [0, 0, -1.2],
      rotation: [0, 0, 0],
      scale: 1.4,
      reveal: 0,
    },
    lightSweep: 0.78,
  },
  // KEY_E — camera piercing the plane (occlusion reconfigure)
  {
    progress: 0.66,
    camera: {
      // Past the card face — continuous dolly, no fade
      position: [0, 0.01, -0.55],
      lookAt: [0.05, 0, -2.2],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: { position: [0.05, 0.02, 0], scale: 0.9 },
    blackCard: {
      // Occludes viewport while spatial reconfigure happens behind the lens
      position: [0.08, 0, 0.42],
      rotation: [0, 0, 0],
      scale: 1.75,
    },
    whiteCard: {
      position: [-0.35, 0.08, -0.9],
      rotation: [2 * DEG, 6 * DEG, 5 * DEG],
      scale: 1.1,
      reveal: 0.05,
    },
    lightSweep: 0.85,
  },
  // KEY_F — pull-back toward original hero framing
  {
    progress: 0.78,
    camera: {
      position: [0.1, 0.04, 6.4],
      lookAt: [0.16, 0.04, 0],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: {
      position: [0.16, 0.04, 0],
      scale: 0.78,
    },
    blackCard: {
      position: [0.4, -0.05, 0.6],
      rotation: [-4 * DEG, -7 * DEG, -4.5 * DEG],
      scale: 1.02,
    },
    whiteCard: {
      position: [-0.6, 0.12, -1.2],
      rotation: [3.5 * DEG, 7.5 * DEG, 7.5 * DEG],
      scale: 1.13,
      reveal: 0.85,
    },
    lightSweep: 0.45,
  },
  // KEY_G — approaching live hero
  {
    progress: 0.9,
    camera: {
      position: [
        HERO_CAMERA_FINAL.position[0],
        HERO_CAMERA_FINAL.position[1],
        HERO_CAMERA_FINAL.position[2] * 0.96,
      ],
      lookAt: [...HERO_CAMERA_FINAL.lookAt],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: {
      position: [...HERO_STACK_FINAL.position],
      scale: HERO_STACK_FINAL.scale * 1.01,
    },
    blackCard: {
      position: [...HERO_BLACK_FINAL.position],
      rotation: [...HERO_BLACK_FINAL.rotation],
      scale: HERO_BLACK_FINAL.scale,
    },
    whiteCard: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 1,
    },
    lightSweep: 0.32,
  },
  // KEY_H — EXACT current hero (do not alter)
  {
    progress: 1,
    camera: {
      position: [...HERO_CAMERA_FINAL.position],
      lookAt: [...HERO_CAMERA_FINAL.lookAt],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: {
      position: [...HERO_STACK_FINAL.position],
      scale: HERO_STACK_FINAL.scale,
    },
    blackCard: {
      position: [...HERO_BLACK_FINAL.position],
      rotation: [...HERO_BLACK_FINAL.rotation],
      scale: HERO_BLACK_FINAL.scale,
    },
    whiteCard: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 1,
    },
    lightSweep: 0.28,
  },
];
