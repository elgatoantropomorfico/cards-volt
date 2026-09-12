import * as THREE from "three";
import {
  heroCardKeyframes,
  type HeroKeyframe,
  type Pose3,
  type Vec3,
} from "./heroCardKeyframes";

export type HeroAnimationSample = {
  camera: { position: Vec3; lookAt: Vec3; fov: number };
  stack: { position: Vec3; scale: number };
  blackCard: Pose3;
  whiteCard: Pose3 & { reveal: number };
  lightSweep: number;
  /** Content / interactivity gates */
  contentOpacity: number;
  canvasDock: number;
  settled: number;
};

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

/** Cinematic ease-in-out (smoothstep) — heavy, precise, no elastic. */
export function cineEase(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function easeInOutCubic(t: number) {
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

function findSpan(progress: number): { a: HeroKeyframe; b: HeroKeyframe; u: number } {
  const keys = heroCardKeyframes;
  const p = clamp01(progress);
  if (p <= keys[0].progress) return { a: keys[0], b: keys[0], u: 0 };
  const last = keys[keys.length - 1];
  if (p >= last.progress) return { a: last, b: last, u: 0 };

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.progress && p <= b.progress) {
      const span = b.progress - a.progress || 1;
      const raw = (p - a.progress) / span;
      // Heavier ease through occlusion for continuity; standard cine elsewhere
      const u =
        a.progress >= 0.57 && b.progress <= 0.71
          ? easeInOutCubic(raw)
          : cineEase(raw);
      return { a, b, u };
    }
  }
  return { a: last, b: last, u: 0 };
}

/**
 * Pure sampler: maps normalized progress → camera / card / light poses.
 * Safe to call every frame.
 */
export function sampleHeroCardAnimation(progress: number): HeroAnimationSample {
  const { a, b, u } = findSpan(progress);
  const p = clamp01(progress);

  const blackCard = lerpPose(a.blackCard, b.blackCard, u);
  const whiteBase = lerpPose(a.whiteCard, b.whiteCard, u);
  const whiteReveal = lerp(a.whiteCard.reveal, b.whiteCard.reveal, u);

  return {
    camera: {
      position: lerpVec3(a.camera.position, b.camera.position, u),
      lookAt: lerpVec3(a.camera.lookAt, b.camera.lookAt, u),
      fov: lerp(a.camera.fov, b.camera.fov, u),
    },
    stack: {
      position: lerpVec3(a.stack.position, b.stack.position, u),
      scale: lerp(a.stack.scale, b.stack.scale, u),
    },
    blackCard,
    whiteCard: { ...whiteBase, reveal: whiteReveal },
    lightSweep: lerp(a.lightSweep, b.lightSweep, u),
    contentOpacity: cineEase(clamp01((p - 0.78) / 0.17)),
    /** 0 = fullscreen cinematic stage, 1 = docked in original hero card slot */
    canvasDock: cineEase(clamp01((p - 0.72) / 0.24)),
    settled: cineEase(clamp01((p - 0.95) / 0.05)),
  };
}

export function useHeroCardAnimation(progress: number): HeroAnimationSample {
  return sampleHeroCardAnimation(progress);
}
