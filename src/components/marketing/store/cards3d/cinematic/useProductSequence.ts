import * as THREE from "three";
import {
  HERO_BLACK_FINAL,
  HERO_CAMERA_FINAL,
  HERO_STACK_FINAL,
  HERO_WHITE_FINAL,
} from "../heroFinal";
import {
  HERO_BEATS,
  HERO_TEXT_LANES,
  NFC_LOCK,
  heroSequenceKeyframes,
  type Pose3,
  type SequenceKeyframe,
  type TextLane,
  type TextSideWindow,
  type Vec3,
} from "./heroSequence";

export type ProductSequenceSample = {
  camera: { position: Vec3; lookAt: Vec3; fov: number };
  stack: { position: Vec3; scale: number };
  black: Pose3;
  white: Pose3 & { reveal: number };
  phone: Pose3 & { screen: number; glow: number; island: number; opacity: number };
  lightSweep: number;
  /** 0–1 phase across the NFC pulse cycle (scrub-reversible) */
  nfcWaves: number;
  contentOpacity: number;
  settled: number;
  layoutOffset: Vec3;
  text: Record<
    TextLane["id"],
    { left: number; right: number; leftSweep: number; rightSweep: number }
  >;
};

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

export function cineOut(t: number) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3.25);
}

export function cineInOut(t: number) {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _qm = new THREE.Quaternion();
const _ea = new THREE.Euler();
const _eb = new THREE.Euler();
const _em = new THREE.Euler();

function slerpEuler(a: Vec3, b: Vec3, t: number): Vec3 {
  _ea.set(a[0], a[1], a[2], "XYZ");
  _eb.set(b[0], b[1], b[2], "XYZ");
  _qa.setFromEuler(_ea);
  _qb.setFromEuler(_eb);
  _qm.slerpQuaternions(_qa, _qb, t);
  _em.setFromQuaternion(_qm, "XYZ");
  return [_em.x, _em.y, _em.z];
}

function lerpPose(a: Pose3, b: Pose3, t: number): Pose3 {
  return {
    position: lerpVec3(a.position, b.position, t),
    rotation: slerpEuler(a.rotation, b.rotation, t),
    scale: lerp(a.scale, b.scale, t),
  };
}

function findSpan(progress: number): { a: SequenceKeyframe; b: SequenceKeyframe; u: number } {
  const keys = heroSequenceKeyframes;
  const p = clamp01(progress);
  if (p <= keys[0].progress) return { a: keys[0], b: keys[0], u: 0 };
  const last = keys[keys.length - 1];
  if (p >= last.progress) return { a: last, b: last, u: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.progress && p <= b.progress) {
      const raw = (p - a.progress) / (b.progress - a.progress || 1);
      return { a, b, u: cineInOut(raw) };
    }
  }
  return { a: last, b: last, u: 0 };
}

export function textSideAmount(progress: number, win: TextSideWindow): number {
  const p = clamp01(progress);
  const [a0, a1] = win.appear;
  const [d0, d1] = win.disappear;
  if (p < a0 || p > d1) return 0;
  if (p >= a1 && p <= d0) return 1;
  if (p < a1) return cineOut((p - a0) / (a1 - a0 || 1));
  return 1 - cineOut((p - d0) / (d1 - d0 || 1));
}

export function textSideSweep(progress: number, win: TextSideWindow): number {
  const p = clamp01(progress);
  const [s0, s1] = win.sweep;
  if (p <= s0) return 0;
  if (p >= s1) return 1;
  return cineInOut((p - s0) / (s1 - s0 || 1));
}

/** Waves start as soon as NFC docks */
function nfcWavesAmount(p: number): number {
  const start = HERO_BEATS.nfcInteraction[0];
  const end = HERO_BEATS.nfcInteraction[0] + 0.14;
  if (p <= start || p >= end) return 0;
  return (p - start) / (end - start);
}

const NFC_FOV = HERO_CAMERA_FINAL.fov; // keep same lens — no FOV cut
const NFC_CAM_Z = 7.5;
const DOLLY_Z = 10.2; // soft pull-back before orbit
const LOOK: Vec3 = [...NFC_LOCK.lookAt];

export type SequenceViewOpts = {
  orbitElevMul?: number;
  orbitRadiusMul?: number;
  orbitTipMul?: number;
  dollyZMul?: number;
};

/** Dolly out only — same lookAt/FOV, objects frozen */
function sampleDollyCamera(tRaw: number, opts: SequenceViewOpts = {}) {
  const t = cineOut(clamp01(tRaw));
  const dollyZ = lerp(NFC_CAM_Z, NFC_CAM_Z + (DOLLY_Z - NFC_CAM_Z) * (opts.dollyZMul ?? 1), t);
  return {
    position: [LOOK[0], 0.08, dollyZ] as Vec3,
    lookAt: [...LOOK] as Vec3,
    fov: NFC_FOV,
  };
}

/**
 * Orbit at constant radius (= dolly end distance).
 * Same path as before, plus a slight contrapicado (camera lower, look higher).
 */
function sampleOrbitCamera(tRaw: number, opts: SequenceViewOpts = {}) {
  const t = cineInOut(clamp01(tRaw));
  const elevMul = opts.orbitElevMul ?? 1;
  const radiusMul = opts.orbitRadiusMul ?? 1;
  const tipMul = opts.orbitTipMul ?? 1;
  const dollyEndZ = NFC_CAM_Z + (DOLLY_Z - NFC_CAM_Z) * (opts.dollyZMul ?? 1);

  const angle = t * Math.PI * 0.92;
  const radius = Math.hypot(0, 0.08 - LOOK[1], dollyEndZ - LOOK[2]) * radiusMul;
  const elevStart = 0.08 - LOOK[1];
  const elev = lerp(elevStart, 2.2 * elevMul, Math.pow(t, 0.9));

  // Contrapicado: same orbit, but tip the view — cam a bit lower, aim a bit higher
  const tip = t * 0.85 * tipMul;
  const camY = LOOK[1] + elev - tip * 1.25;
  const lookY = LOOK[1] + tip * 0.65;

  return {
    position: [
      LOOK[0] + Math.sin(angle) * radius,
      camY,
      LOOK[2] + Math.cos(angle) * radius,
    ] as Vec3,
    lookAt: [LOOK[0], lookY, LOOK[2]] as Vec3,
    fov: NFC_FOV,
  };
}

function orbitEndCamera(opts: SequenceViewOpts = {}) {
  return sampleOrbitCamera(1, opts);
}

export function sampleProductSequence(
  progress: number,
  layoutBias: { x: number; y: number } = { x: 0, y: 0 },
  viewOpts: SequenceViewOpts = {},
): ProductSequenceSample {
  const p = clamp01(progress);
  const { a, b, u } = findSpan(p);

  let black = lerpPose(a.black, b.black, u);
  let phoneBase = lerpPose(a.phone, b.phone, u);
  let phoneScreen = lerp(a.phone.screen, b.phone.screen, u);
  let phoneGlow = lerp(a.phone.glow, b.phone.glow, u);
  let phoneIsland = lerp(a.phone.island, b.phone.island, u);
  let phoneOpacity = 1;
  let camera = {
    position: lerpVec3(a.camera.position, b.camera.position, u),
    lookAt: lerpVec3(a.camera.lookAt, b.camera.lookAt, u),
    fov: lerp(a.camera.fov, b.camera.fov, u),
  };

  const dolly = HERO_BEATS.dollyOut;
  const orbit = HERO_BEATS.orbitReveal;
  const exitStart = HERO_BEATS.returnToHero[0];
  const nfcLockPose = HERO_BEATS.nfcInteraction[0]; // card docked
  const nfcCamHold = nfcLockPose;

  // ——— After dock: freeze camera so the phone doesn't "swim" ———
  if (p >= nfcCamHold && p < dolly[0]) {
    camera = {
      position: [LOOK[0], 0.08, NFC_CAM_Z] as Vec3,
      lookAt: [...LOOK] as Vec3,
      fov: NFC_FOV,
    };
  }

  // ——— From card settle: freeze interlocking pose (screen/glow still evolve) ———
  if (p >= nfcLockPose && p < exitStart) {
    black = {
      position: [...NFC_LOCK.black.position] as Vec3,
      rotation: [...NFC_LOCK.black.rotation] as Vec3,
      scale: NFC_LOCK.black.scale,
    };
    phoneBase = {
      position: [...NFC_LOCK.phone.position] as Vec3,
      rotation: [...NFC_LOCK.phone.rotation] as Vec3,
      scale: NFC_LOCK.phone.scale,
    };
    if (p >= dolly[0]) {
      phoneScreen = NFC_LOCK.phone.screen;
      phoneGlow = NFC_LOCK.phone.glow;
      phoneIsland = NFC_LOCK.phone.island;
    }
  }

  // ——— Dolly out (camera only, same FOV) ———
  if (p >= dolly[0] && p < dolly[1]) {
    const t = (p - dolly[0]) / (dolly[1] - dolly[0] || 1);
    camera = sampleDollyCamera(t, viewOpts);
  }

  // ——— Orbit (camera only, constant radius — continues from dolly end) ———
  if (p >= orbit[0] && p <= orbit[1]) {
    const t = (p - orbit[0]) / (orbit[1] - orbit[0] || 1);
    camera = sampleOrbitCamera(t, viewOpts);
  }

  // ——— Continuous exit: phone fade+fall, card rises/rotates to hero ———
  if (p > exitStart) {
    const t = cineInOut(clamp01((p - exitStart) / (1 - exitStart)));
    const endCam = orbitEndCamera(viewOpts);
    const heroCam = {
      position: [
        HERO_CAMERA_FINAL.position[0] - 0.45,
        HERO_CAMERA_FINAL.position[1],
        HERO_CAMERA_FINAL.position[2] + 0.7,
      ] as Vec3,
      lookAt: [
        HERO_CAMERA_FINAL.lookAt[0] + 0.2,
        HERO_CAMERA_FINAL.lookAt[1],
        HERO_CAMERA_FINAL.lookAt[2],
      ] as Vec3,
      fov: HERO_CAMERA_FINAL.fov,
    };
    camera = {
      position: lerpVec3(endCam.position, heroCam.position, t),
      lookAt: lerpVec3(endCam.lookAt, heroCam.lookAt, t),
      fov: lerp(endCam.fov, heroCam.fov, t),
    };

    black = lerpPose(NFC_LOCK.black, HERO_BLACK_FINAL, t);
    phoneBase = {
      position: [
        NFC_LOCK.phone.position[0],
        lerp(NFC_LOCK.phone.position[1], -6.2, cineOut(t)),
        NFC_LOCK.phone.position[2],
      ] as Vec3,
      rotation: [...NFC_LOCK.phone.rotation] as Vec3,
      scale: lerp(NFC_LOCK.phone.scale, NFC_LOCK.phone.scale * 0.92, t),
    };
    phoneOpacity = 1 - cineOut(clamp01(t / 0.85));
    phoneScreen = NFC_LOCK.phone.screen * (1 - t);
    phoneGlow = 0;
    phoneIsland = NFC_LOCK.phone.island * (1 - t);
  }

  // White only after black has come back through camera (late exit) — never pop mid-orbit
  let whiteReveal = 0;
  if (p > exitStart) {
    const t = cineInOut(clamp01((p - exitStart) / (1 - exitStart)));
    whiteReveal = t < 0.62 ? 0 : cineOut((t - 0.62) / 0.38);
  }
  const white = {
    position: [...HERO_WHITE_FINAL.position] as Vec3,
    rotation: [...HERO_WHITE_FINAL.rotation] as Vec3,
    scale: HERO_WHITE_FINAL.scale,
    reveal: whiteReveal,
  };

  // Layout bias only after phone is mostly gone — soft park to the right
  const layoutGate =
    p > exitStart
      ? cineOut(clamp01((cineInOut(clamp01((p - exitStart) / (1 - exitStart))) - 0.45) / 0.55))
      : 0;
  const layoutOffset: Vec3 = [layoutBias.x * layoutGate, layoutBias.y * layoutGate, 0];

  // Stack scale eases to final during exit (no sudden shrink mid-orbit)
  let stackPos: Vec3 = lerpVec3(a.stack.position, b.stack.position, u);
  let stackScale = lerp(a.stack.scale, b.stack.scale, u);
  if (p >= nfcLockPose && p < exitStart) {
    stackPos = [0, 0, 0];
    stackScale = 1;
  } else if (p >= exitStart) {
    const t = cineInOut(clamp01((p - exitStart) / (1 - exitStart)));
    stackPos = lerpVec3([0, 0, 0], [...HERO_STACK_FINAL.position] as Vec3, t);
    stackScale = lerp(1, HERO_STACK_FINAL.scale, t);
  }

  const text = {
    opportunity: {
      left: textSideAmount(p, HERO_TEXT_LANES[0].leftWindow),
      right: textSideAmount(p, HERO_TEXT_LANES[0].rightWindow),
      leftSweep: textSideSweep(p, HERO_TEXT_LANES[0].leftWindow),
      rightSweep: textSideSweep(p, HERO_TEXT_LANES[0].rightWindow),
    },
    connect: {
      left: textSideAmount(p, HERO_TEXT_LANES[1].leftWindow),
      right: textSideAmount(p, HERO_TEXT_LANES[1].rightWindow),
      leftSweep: textSideSweep(p, HERO_TEXT_LANES[1].leftWindow),
      rightSweep: textSideSweep(p, HERO_TEXT_LANES[1].rightWindow),
    },
  };

  // Hero UI / card self-glow kick in during exit — earlier so lock doesn't feel stalled
  const contentOpacity = cineOut(clamp01((p - 0.9) / 0.1));
  const settled = cineOut(clamp01((p - 0.92) / 0.08));

  return {
    camera,
    stack: { position: stackPos, scale: stackScale },
    black,
    white,
    phone: {
      ...phoneBase,
      screen: phoneScreen,
      glow: phoneGlow,
      island: phoneIsland,
      opacity: phoneOpacity,
    },
    lightSweep: lerp(a.lightSweep, b.lightSweep, u),
    nfcWaves: nfcWavesAmount(p),
    contentOpacity,
    settled,
    layoutOffset,
    text,
  };
}
