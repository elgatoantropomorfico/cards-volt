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

/**
 * Narrative beats → progress 0→1.
 * Typography + NFC approach get oversized progress so scroll feels Apple-premium.
 */
export const HERO_BEATS = {
  intro: [0.0, 0.05] as const,
  cardFlip: [0.05, 0.11] as const,
  /** Shorter hold after typography — was dragging the scroll */
  opportunityMessage: [0.11, 0.36] as const,
  cardReorient: [0.36, 0.42] as const,
  phoneRise: [0.42, 0.48] as const,
  nfcInteraction: [0.48, 0.70] as const,
  /** Soft dolly out, then camera-only orbit to back */
  dollyOut: [0.70, 0.76] as const,
  orbitReveal: [0.76, 0.88] as const,
  returnToHero: [0.88, 1.0] as const,
} as const;

export type TextSideWindow = {
  appear: [number, number];
  hold: [number, number];
  disappear: [number, number];
  /** Long window → slow soft alpha halo across glyphs */
  sweep: [number, number];
};

export type TextLane = {
  id: "opportunity" | "connect";
  left: string;
  right: string;
  rightLines?: [string, string];
  leftWindow: TextSideWindow;
  rightWindow: TextSideWindow;
};

export const HERO_TEXT_LANES: TextLane[] = [
  {
    id: "opportunity",
    left: "Una tarjeta",
    right: "Muchas oportunidades",
    rightLines: ["Muchas", "oportunidades"],
    leftWindow: {
      appear: [0.11, 0.14],
      hold: [0.14, 0.32],
      disappear: [0.32, 0.36],
      sweep: [0.14, 0.24],
    },
    rightWindow: {
      appear: [0.155, 0.185],
      hold: [0.185, 0.32],
      disappear: [0.32, 0.36],
      sweep: [0.18, 0.28],
    },
  },
  {
    id: "connect",
    left: "Acercá",
    right: "Conectá",
    leftWindow: {
      appear: [0.52, 0.55],
      hold: [0.55, 0.66],
      disappear: [0.66, 0.70],
      sweep: [0.55, 0.62],
    },
    rightWindow: {
      appear: [0.555, 0.585],
      hold: [0.585, 0.66],
      disappear: [0.66, 0.70],
      sweep: [0.585, 0.645],
    },
  },
];

export type SequenceKeyframe = {
  progress: number;
  camera: { position: Vec3; lookAt: Vec3; fov: number };
  stack: { position: Vec3; scale: number };
  black: Pose3;
  white: Pose3 & { reveal: number };
  phone: Pose3 & { screen: number; glow: number; island: number };
  lightSweep: number;
};

/** Intro: pequeña (cerca del tamaño NFC); flip: apenas un poco más */
const INTRO_CARD_SCALE = 0.52;
const FLIP_CARD_SCALE = 0.6;
/** Physically credible vs iPhone */
const NFC_CARD_SCALE = 0.48;

export const PHONE_REST: Pose3 = {
  position: [0.15, -0.35, 0.55],
  rotation: [0, 0, 0],
  scale: 1.15,
};

/**
 * Key poses for the 7 beats.
 * Faces: front = volt.ai (+Z), back = QR (−Z).
 * Start FRONT → flip to QR → flip again to front → vertical NFC (card BEHIND phone).
 */
export const heroSequenceKeyframes: SequenceKeyframe[] = [
  // ——— M1: pequeña, FRONT (volt.ai) ———
  {
    progress: 0,
    camera: { position: [0, 0.08, 10.5], lookAt: [0, 0.05, 0], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0.05, 0], scale: 1 },
    black: {
      position: [0, 0.05, 0],
      rotation: [-10 * DEG, -22 * DEG, -8 * DEG],
      scale: INTRO_CARD_SCALE,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -5.6, 0.55],
      rotation: [4 * DEG, -8 * DEG, 0],
      scale: 1.15,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.2,
  },
  {
    progress: 0.05,
    camera: { position: [0.02, 0.06, 10.2], lookAt: [0, 0.04, 0], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0.04, 0], scale: 1 },
    black: {
      position: [0, 0.04, 0.02],
      rotation: [-10 * DEG, -20 * DEG, -8 * DEG],
      scale: INTRO_CARD_SCALE,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -5.6, 0.55],
      rotation: [4 * DEG, -8 * DEG, 0],
      scale: 1.15,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.35,
  },
  // ——— Flip 1 done: QR + typography begins ———
  {
    progress: 0.11,
    camera: { position: [0.04, 0.05, 9.6], lookAt: [0, 0.04, 0], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0.04, 0], scale: 1 },
    black: {
      position: [0, 0.04, 0],
      rotation: [-8 * DEG, Math.PI - 20 * DEG, -6 * DEG],
      scale: FLIP_CARD_SCALE,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -5.6, 0.55],
      rotation: [3 * DEG, -6 * DEG, 0],
      scale: 1.15,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.15,
  },
  // ——— Sniper hold A: text readable, sweep starts ———
  {
    progress: 0.18,
    camera: { position: [0.03, 0.045, 9.5], lookAt: [0, 0.035, 0], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0.035, 0], scale: 1 },
    black: {
      position: [0, 0.035, 0.01],
      rotation: [-7.5 * DEG, Math.PI - 18 * DEG, -5.5 * DEG],
      scale: FLIP_CARD_SCALE,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -5.6, 0.55],
      rotation: [2.5 * DEG, -5.5 * DEG, 0],
      scale: 1.15,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.22,
  },
  // ——— Sniper hold B (compressed) ———
  {
    progress: 0.26,
    camera: { position: [0.02, 0.04, 9.4], lookAt: [0, 0.03, 0], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0.03, 0], scale: 1 },
    black: {
      position: [0, 0.03, 0],
      rotation: [-7 * DEG, Math.PI - 16 * DEG, -5 * DEG],
      scale: FLIP_CARD_SCALE,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -5.6, 0.55],
      rotation: [2 * DEG, -5 * DEG, 0],
      scale: 1.15,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.25,
  },
  // ——— End opportunity; flip 2 → front, already on phone axis ———
  {
    progress: 0.36,
    camera: { position: [0.1, 0.05, 9.0], lookAt: [0.1, 0.06, 0], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0.02, 0], scale: 1 },
    black: {
      position: [0.15, 0.55, 0.02],
      rotation: [-3 * DEG, -6 * DEG, 48 * DEG],
      scale: 0.54,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      // Just under the frame — full opacity, short pop-up next
      position: [0.15, -4.55, 0.55],
      rotation: [1 * DEG, -2 * DEG, 0],
      scale: 1.15,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.28,
  },
  // ——— Vertical + phone almost home — short dock distance ———
  {
    progress: 0.42,
    camera: { position: [0.15, 0.06, 8.2], lookAt: [0.15, 0.12, 0.15], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0, 0], scale: 1 },
    black: {
      position: [0.15, 1.05, -0.08],
      rotation: [-1 * DEG, 0, 86 * DEG],
      scale: NFC_CARD_SCALE,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -0.45, 0.55],
      rotation: [0, 0, 0],
      scale: 1.15,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.3,
  },
  // ——— Phone locked; card snaps into NFC ———
  {
    progress: 0.48,
    camera: { position: [0.15, 0.08, 7.5], lookAt: [0.15, 0.2, 0.2], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0, 0], scale: 1 },
    black: {
      position: [0.15, 0.95, -0.12],
      rotation: [-1 * DEG, 0, 90 * DEG],
      scale: NFC_CARD_SCALE * 0.95,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -0.35, 0.55],
      rotation: [0, 0, 0],
      scale: 1.15,
      screen: 0,
      glow: 0.35,
      island: 1,
    },
    lightSweep: 0.32,
  },
  {
    progress: 0.54,
    camera: { position: [0.15, 0.08, 7.5], lookAt: [0.15, 0.2, 0.2], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0, 0], scale: 1 },
    black: {
      position: [0.15, 0.95, -0.12],
      rotation: [-1 * DEG, 0, 90 * DEG],
      scale: NFC_CARD_SCALE * 0.95,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -0.35, 0.55],
      rotation: [0, 0, 0],
      scale: 1.15,
      screen: 0.55,
      glow: 1,
      island: 1,
    },
    lightSweep: 0.34,
  },
  {
    progress: 0.6,
    camera: { position: [0.15, 0.08, 7.5], lookAt: [0.15, 0.2, 0.2], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0, 0], scale: 1 },
    black: {
      position: [0.15, 0.95, -0.12],
      rotation: [-1 * DEG, 0, 90 * DEG],
      scale: NFC_CARD_SCALE * 0.95,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -0.35, 0.55],
      rotation: [0, 0, 0],
      scale: 1.15,
      screen: 1,
      glow: 0.4,
      island: 1,
    },
    lightSweep: 0.34,
  },
  // ——— Hold interlocking NFC (objects FROZEN through orbit) ———
  {
    progress: 0.7,
    camera: { position: [0.15, 0.08, 7.5], lookAt: [0.15, 0.2, 0.2], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0, 0], scale: 1 },
    black: {
      position: [0.15, 0.95, -0.12],
      rotation: [-1 * DEG, 0, 90 * DEG],
      scale: NFC_CARD_SCALE * 0.95,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -0.35, 0.55],
      rotation: [0, 0, 0],
      scale: 1.15,
      screen: 1,
      glow: 0.3,
      island: 1,
    },
    lightSweep: 0.32,
  },
  // Camera-only markers (dolly + orbit driven in sampler; objects locked)
  {
    progress: 0.76,
    camera: { position: [0.15, 0.08, 10.2], lookAt: [0.15, 0.2, 0.2], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0, 0], scale: 1 },
    black: {
      position: [0.15, 0.95, -0.12],
      rotation: [-1 * DEG, 0, 90 * DEG],
      scale: NFC_CARD_SCALE * 0.95,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -0.35, 0.55],
      rotation: [0, 0, 0],
      scale: 1.15,
      screen: 1,
      glow: 0.25,
      island: 1,
    },
    lightSweep: 0.34,
  },
  {
    progress: 0.88,
    camera: { position: [0.15, 2.4, -9.8], lookAt: [0.15, 0.2, 0.2], fov: HERO_CAMERA_FINAL.fov },
    stack: { position: [0, 0, 0], scale: 1 },
    black: {
      position: [0.15, 0.95, -0.12],
      rotation: [-1 * DEG, 0, 90 * DEG],
      scale: NFC_CARD_SCALE * 0.95,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 0,
    },
    phone: {
      position: [0.15, -0.35, 0.55],
      rotation: [0, 0, 0],
      scale: 1.15,
      screen: 1,
      glow: 0.2,
      island: 1,
    },
    lightSweep: 0.36,
  },
  // Exit continuity is sampler-driven (phone fade+fall, card → hero)
  {
    progress: 1,
    camera: {
      position: [HERO_CAMERA_FINAL.position[0] - 0.45, HERO_CAMERA_FINAL.position[1], 9.8],
      lookAt: [HERO_CAMERA_FINAL.lookAt[0] + 0.2, HERO_CAMERA_FINAL.lookAt[1], 0],
      fov: HERO_CAMERA_FINAL.fov,
    },
    stack: {
      position: [...HERO_STACK_FINAL.position],
      scale: HERO_STACK_FINAL.scale,
    },
    black: {
      position: [...HERO_BLACK_FINAL.position],
      rotation: [...HERO_BLACK_FINAL.rotation],
      scale: HERO_BLACK_FINAL.scale,
    },
    white: {
      position: [...HERO_WHITE_FINAL.position],
      rotation: [...HERO_WHITE_FINAL.rotation],
      scale: HERO_WHITE_FINAL.scale,
      reveal: 1,
    },
    phone: {
      position: [0.15, -8.5, 0.55],
      rotation: [0, 0, 0],
      scale: 1.1,
      screen: 0,
      glow: 0,
      island: 0,
    },
    lightSweep: 0.28,
  },
];

/** Soft Y-only settle under phone (same X — no lateral bounce) */
export const CARD_TO_PHONE_CURVE: Vec3[] = [
  [0.15, 1.05, -0.08],
  [0.15, 1.0, -0.1],
  [0.15, 0.97, -0.115],
  [0.15, 0.95, -0.12],
];

export const CARD_EXIT_CURVE: Vec3[] = [
  [0.15, 0.95, -0.08],
  [0.35, 0.7, 0.2],
  [0.5, 0.35, 0.45],
  [0.48, -0.08, 0.7],
];

/** Locked interlocking pose during camera-only orbit */
export const NFC_LOCK = {
  black: {
    position: [0.15, 0.95, -0.12] as Vec3,
    rotation: [-1 * DEG, 0, 90 * DEG] as Vec3,
    scale: NFC_CARD_SCALE * 0.95,
  },
  phone: {
    position: [0.15, -0.35, 0.55] as Vec3,
    rotation: [0, 0, 0] as Vec3,
    scale: 1.15,
    screen: 1,
    glow: 0.25,
    island: 1,
  },
  lookAt: [0.15, 0.2, 0.2] as Vec3,
};