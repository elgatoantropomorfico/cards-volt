"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, useEnvironment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { CARD_ASSETS } from "@/lib/card-assets";
import { HERO_CAMERA_FINAL } from "../heroFinal";
import type { CardPose } from "../Card3D";
import { VoltCard } from "./VoltCard";
import { IPhone3D, type PhonePose } from "./IPhone3D";
import { NfcWaves } from "./NfcWaves";
import {
  sampleProductSequence,
  type ProductSequenceSample,
  type SequenceViewOpts,
} from "./useProductSequence";
import { HERO_BEATS } from "./heroSequence";
import { cn } from "@/lib/utils";

function viewOptsFromFit(fit: SceneViewportFit): SequenceViewOpts {
  return {
    orbitElevMul: fit.orbitElevMul,
    orbitRadiusMul: fit.orbitRadiusMul,
    orbitTipMul: fit.orbitTipMul,
    dollyZMul: fit.dollyZMul,
  };
}

/** Desktop = identity. Mobile only scales framing — sequence timing untouched. */
export type SceneViewportFit = {
  scale: number;
  fovAdd: number;
  distanceMul: number;
  /** Mobile: card size through intro/flip (near final-hero look, little growth) */
  cinematicCardScale?: number;
  /** Orbit / dolly tighteners (1 = desktop) */
  orbitElevMul?: number;
  orbitRadiusMul?: number;
  orbitTipMul?: number;
  dollyZMul?: number;
  /** Mobile: fade cards out into text-only hero */
  hideFinalCards?: boolean;
};

export const DESKTOP_VIEWPORT_FIT: SceneViewportFit = {
  scale: 1,
  fovAdd: 0,
  distanceMul: 1,
};

export const MOBILE_VIEWPORT_FIT: SceneViewportFit = {
  scale: 1,
  fovAdd: 5,
  distanceMul: 0.98,
  /** ≈ stack×black final presence — intro starts here, barely grows */
  cinematicCardScale: 0.76,
  orbitElevMul: 0.38,
  orbitRadiusMul: 0.68,
  orbitTipMul: 0.4,
  dollyZMul: 0.55,
  hideFinalCards: true,
};

if (typeof window !== "undefined") {
  useTexture.preload([
    CARD_ASSETS.frontBlack,
    CARD_ASSETS.frontWhite,
    CARD_ASSETS.backBlack,
    CARD_ASSETS.backWhite,
  ]);
  useEnvironment.preload({ files: CARD_ASSETS.environmentHdr });
}

let rectAreaReady = false;

function ReadySignal({ onReady }: { onReady?: () => void }) {
  React.useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

function ProductCamera({
  sampleRef,
  viewportFitRef,
}: {
  sampleRef: React.MutableRefObject<ProductSequenceSample>;
  viewportFitRef: React.MutableRefObject<SceneViewportFit>;
}) {
  const { camera } = useThree();
  const look = React.useRef(new THREE.Vector3());

  useFrame(() => {
    const s = sampleRef.current;
    const off = s.layoutOffset;
    const fit = viewportFitRef.current;
    // Truck camera slightly LEFT so a right-shifted stack reads on the right —
    // do NOT move lookAt by the full offset (that recenters the cards).
    camera.position.set(
      s.camera.position[0] - off[0] * 0.35,
      s.camera.position[1] + off[1] * 0.1,
      s.camera.position[2] * fit.distanceMul,
    );
    if ("isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
      const nextFov = s.camera.fov + fit.fovAdd;
      if (Math.abs(camera.fov - nextFov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }
    look.current.set(
      s.camera.lookAt[0] + off[0] * 0.2,
      s.camera.lookAt[1] + off[1] * 0.15,
      s.camera.lookAt[2],
    );
    camera.lookAt(look.current);
  });

  return null;
}

function SweepKey({ sampleRef }: { sampleRef: React.MutableRefObject<ProductSequenceSample> }) {
  const ref = React.useRef<THREE.RectAreaLight>(null);
  useFrame(() => {
    const light = ref.current;
    if (!light) return;
    const sweep = sampleRef.current.lightSweep;
    light.position.set(
      THREE.MathUtils.lerp(-2.8, 2.6, sweep),
      THREE.MathUtils.lerp(2.2, 1.4, sweep),
      THREE.MathUtils.lerp(3.2, 2.4, sweep),
    );
    light.lookAt(0, 0.04, 0);
    const peak = Math.sin(sweep * Math.PI);
    light.intensity = THREE.MathUtils.lerp(1.4, 2.6, peak);
    light.width = 7.2;
    light.height = 4.8;
  });
  return <rectAreaLight ref={ref} width={7.2} height={4.8} color="#ffffff" intensity={1.6} />;
}

function AreaFill({
  intensity,
  width,
  height,
  color,
  position,
}: {
  intensity: number;
  width: number;
  height: number;
  color: string;
  position: [number, number, number];
}) {
  const ref = React.useRef<THREE.RectAreaLight>(null);
  React.useLayoutEffect(() => {
    ref.current?.lookAt(0, 0.05, 0);
  }, [position]);
  return (
    <rectAreaLight
      ref={ref}
      intensity={intensity}
      width={width}
      height={height}
      color={color}
      position={position}
    />
  );
}

function ProductLighting({
  sampleRef,
}: {
  sampleRef: React.MutableRefObject<ProductSequenceSample>;
}) {
  const fillRef = React.useRef<THREE.DirectionalLight>(null);
  const frontRef = React.useRef<THREE.PointLight>(null);
  const rimRef = React.useRef<THREE.DirectionalLight>(null);
  const heroFillA = React.useRef<THREE.DirectionalLight>(null);
  const heroFillB = React.useRef<THREE.PointLight>(null);
  const heroFillC = React.useRef<THREE.PointLight>(null);

  React.useLayoutEffect(() => {
    if (!rectAreaReady) {
      RectAreaLightUniformsLib.init();
      rectAreaReady = true;
    }
  }, []);

  useFrame(() => {
    const settled = sampleRef.current.settled;
    const off = sampleRef.current.layoutOffset;
    const s = settled;

    if (fillRef.current) {
      fillRef.current.intensity = 0.28 + s * 0.3;
      fillRef.current.position.set(0.6 + off[0] * 0.4, 1.8, 7.2);
      fillRef.current.target.position.set(0.3 + off[0], 0.05 + off[1], 0);
      fillRef.current.target.updateMatrixWorld();
    }
    if (frontRef.current) {
      frontRef.current.intensity = 0.22 + s * 0.32;
      frontRef.current.position.set(0.5 + off[0], 0.35 + off[1], 5.2);
    }
    if (rimRef.current) {
      rimRef.current.intensity = 0.22 + s * 0.28;
      rimRef.current.position.set(3.5 + off[0], 1.2, 3.5);
      rimRef.current.target.position.set(0.4 + off[0], 0, 0.3);
      rimRef.current.target.updateMatrixWorld();
    }

    const lookX = 0.22 + off[0];
    const lookY = 0.05 + off[1];

    if (heroFillA.current) {
      heroFillA.current.intensity = 0.38 * s;
      heroFillA.current.position.set(lookX - 3.2, lookY + 1.4, 5.5);
      heroFillA.current.target.position.set(lookX + 0.2, lookY, 0.3);
      heroFillA.current.target.updateMatrixWorld();
    }
    if (heroFillB.current) {
      heroFillB.current.intensity = 0.42 * s;
      heroFillB.current.position.set(lookX - 1.1, lookY + 0.2, 6.2);
    }
    if (heroFillC.current) {
      heroFillC.current.intensity = 0.28 * s;
      heroFillC.current.position.set(lookX + 2.4, lookY - 0.3, 3.8);
    }
  });

  return (
    <>
      <ambientLight intensity={0.14} color="#ebe8f4" />
      <SweepKey sampleRef={sampleRef} />
      <AreaFill intensity={0.7} width={8} height={5.5} color="#ffffff" position={[-0.4, 2.4, 4.8]} />
      <AreaFill intensity={0.55} width={7} height={5} color="#d4ccff" position={[3.2, 0.4, 2.4]} />
      <AreaFill intensity={0.45} width={6} height={5} color="#c4b5fd" position={[2.8, 1.5, 3.2]} />
      <AreaFill intensity={0.5} width={5} height={5} color="#7b73ff" position={[0.2, -0.4, -3.4]} />
      <AreaFill intensity={0.35} width={6} height={5} color="#efeaff" position={[-2.8, 0.8, 2.2]} />

      <directionalLight ref={fillRef} intensity={0.35} color="#ffffff" position={[0.5, 2, 7]} />
      <directionalLight ref={rimRef} intensity={0.28} color="#efeaff" position={[3.2, 1.5, 3]} />
      <directionalLight intensity={0.18} color="#ffffff" position={[-3.5, 4, 3.5]} />
      <pointLight ref={frontRef} intensity={0.28} color="#ffffff" position={[0.4, 0.3, 5]} distance={16} decay={2} />

      <directionalLight ref={heroFillA} intensity={0} color="#f4f0ff" position={[-3.2, 1.4, 5.5]} />
      <pointLight ref={heroFillB} intensity={0} color="#ffffff" distance={14} decay={2} position={[-1.1, 0.2, 6.2]} />
      <pointLight ref={heroFillC} intensity={0} color="#e8e0ff" distance={11} decay={2} position={[2.4, -0.3, 3.8]} />

      <hemisphereLight args={["#f5f3ff", "#9a94a8", 0.22]} />
    </>
  );
}

function AnimationDriver({
  progressTargetRef,
  progressSmoothRef,
  sampleRef,
  layoutBiasRef,
  viewportFitRef,
  introLockedRef,
  blackPoseRef,
  whitePoseRef,
  phonePoseRef,
  settledRef,
  stackRef,
}: {
  progressTargetRef: React.MutableRefObject<number>;
  progressSmoothRef: React.MutableRefObject<number>;
  sampleRef: React.MutableRefObject<ProductSequenceSample>;
  layoutBiasRef: React.MutableRefObject<{ x: number; y: number }>;
  viewportFitRef: React.MutableRefObject<SceneViewportFit>;
  introLockedRef: React.MutableRefObject<boolean>;
  blackPoseRef: React.MutableRefObject<CardPose>;
  whitePoseRef: React.MutableRefObject<CardPose>;
  phonePoseRef: React.MutableRefObject<PhonePose>;
  settledRef: React.MutableRefObject<number>;
  stackRef: React.RefObject<THREE.Group | null>;
}) {
  const frozenSampleRef = React.useRef<ProductSequenceSample | null>(null);

  useFrame((_, delta) => {
    const fit = viewportFitRef.current;
    const viewOpts = viewOptsFromFit(fit);

    // Anchored final state — bake once, never re-sample mid-animation frames
    if (introLockedRef.current) {
      progressTargetRef.current = 1;
      progressSmoothRef.current = 1;
      if (!frozenSampleRef.current) {
        frozenSampleRef.current = sampleProductSequence(1, layoutBiasRef.current, viewOpts);
      }
    } else {
      frozenSampleRef.current = null;
      const target = progressTargetRef.current;
      const gap = Math.abs(target - progressSmoothRef.current);
      // Snappier near phone dock / exit so scroll doesn't outrun the animation
      const rate =
        gap > 0.05 ? 16 : target > 0.82 || (target > 0.36 && target < 0.55) ? 13 : 9.5;
      progressSmoothRef.current = THREE.MathUtils.damp(
        progressSmoothRef.current,
        target,
        rate,
        delta,
      );
      if (Math.abs(target - progressSmoothRef.current) < 0.00015) {
        progressSmoothRef.current = target;
      }
    }

    const p = progressSmoothRef.current;
    const sample =
      introLockedRef.current && frozenSampleRef.current
        ? frozenSampleRef.current
        : sampleProductSequence(p, layoutBiasRef.current, viewOpts);
    sampleRef.current = sample;
    settledRef.current = introLockedRef.current ? 1 : sample.settled;
    const sMul = fit.scale;

    const off = sample.layoutOffset;
    if (stackRef.current) {
      stackRef.current.position.set(
        sample.stack.position[0] + off[0],
        sample.stack.position[1] + off[1],
        sample.stack.position[2],
      );
      stackRef.current.scale.setScalar(sample.stack.scale * sMul);
    }

    // Mobile: large flat card through intro/flip, ease to NFC scale on reorient
    let blackScale = sample.black.scale;
    const flat = fit.cinematicCardScale;
    if (flat != null && p < HERO_BEATS.returnToHero[0]) {
      const reorient = HERO_BEATS.cardReorient[0];
      const nfc = HERO_BEATS.nfcInteraction[0];
      if (p < reorient) {
        // Tiny breathing from keyframe scale so flip still reads
        const breath = (sample.black.scale - 0.52) * 0.12;
        blackScale = flat * (1 + breath);
      } else if (p < nfc) {
        const t = cineOutLocal((p - reorient) / (nfc - reorient || 1));
        blackScale = THREE.MathUtils.lerp(flat, sample.black.scale, t);
      }
    }

    const hideFinal =
      Boolean(fit.hideFinalCards) &&
      (introLockedRef.current || sample.contentOpacity > 0.06);

    blackPoseRef.current = {
      position: sample.black.position,
      rotation: sample.black.rotation,
      scale: blackScale,
      visible: !hideFinal,
    };
    whitePoseRef.current = {
      position: sample.white.position,
      rotation: sample.white.rotation,
      scale: sample.white.scale * (0.9 + 0.1 * sample.white.reveal),
      visible: !hideFinal && sample.white.reveal > 0.02,
    };
    phonePoseRef.current = {
      position: [
        sample.phone.position[0] + off[0] * 0.12,
        sample.phone.position[1] + off[1] * 0.08,
        sample.phone.position[2],
      ],
      rotation: sample.phone.rotation,
      scale: sample.phone.scale * sMul,
      visible: sample.phone.position[1] > -4.35 && sample.phone.opacity > 0.02,
      screen: sample.phone.screen,
      glow: sample.phone.glow,
      island: sample.phone.island,
      opacity: sample.phone.opacity,
    };
  });

  return null;
}

function cineOutLocal(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3.25);
}

function SceneBody({
  progressTargetRef,
  progressSmoothRef,
  sampleRef,
  layoutBiasRef,
  viewportFitRef,
  introLockedRef,
  interactive,
  reducedMotion,
  mouse,
  onReady,
}: {
  progressTargetRef: React.MutableRefObject<number>;
  progressSmoothRef: React.MutableRefObject<number>;
  sampleRef: React.MutableRefObject<ProductSequenceSample>;
  layoutBiasRef: React.MutableRefObject<{ x: number; y: number }>;
  viewportFitRef: React.MutableRefObject<SceneViewportFit>;
  introLockedRef: React.MutableRefObject<boolean>;
  interactive: boolean;
  reducedMotion: boolean;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  onReady?: () => void;
}) {
  const stackRef = React.useRef<THREE.Group>(null);
  const settledRef = React.useRef(0);
  const initial = sampleProductSequence(0);

  const blackPoseRef = React.useRef<CardPose>({
    position: initial.black.position,
    rotation: initial.black.rotation,
    scale: initial.black.scale,
    visible: true,
  });
  const whitePoseRef = React.useRef<CardPose>({
    position: initial.white.position,
    rotation: initial.white.rotation,
    scale: initial.white.scale,
    visible: false,
  });
  const phonePoseRef = React.useRef<PhonePose>({
    position: initial.phone.position,
    rotation: initial.phone.rotation,
    scale: initial.phone.scale,
    visible: false,
    screen: 0,
    glow: 0,
    island: 0,
    opacity: 1,
  });

  return (
    <>
      <ReadySignal onReady={onReady} />
      <AnimationDriver
        progressTargetRef={progressTargetRef}
        progressSmoothRef={progressSmoothRef}
        sampleRef={sampleRef}
        layoutBiasRef={layoutBiasRef}
        viewportFitRef={viewportFitRef}
        introLockedRef={introLockedRef}
        blackPoseRef={blackPoseRef}
        whitePoseRef={whitePoseRef}
        phonePoseRef={phonePoseRef}
        settledRef={settledRef}
        stackRef={stackRef}
      />
      <ProductCamera sampleRef={sampleRef} viewportFitRef={viewportFitRef} />
      <ProductLighting sampleRef={sampleRef} />
      <Environment files={CARD_ASSETS.environmentHdr} environmentIntensity={0.22} />

      <group ref={stackRef}>
        <VoltCard
          variant="white"
          poseRef={whitePoseRef}
          settledRef={settledRef}
          hoverEnabled={false}
          interactive={interactive}
          reducedMotion={reducedMotion}
          mouse={mouse}
          floatIntensity={0.85}
          floatPhase={1.7}
        />
        <VoltCard
          variant="black"
          poseRef={blackPoseRef}
          settledRef={settledRef}
          hoverEnabled={interactive}
          interactive={interactive}
          reducedMotion={reducedMotion}
          mouse={mouse}
          floatIntensity={1}
          floatPhase={0.35}
        />
        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.06}
          scale={12}
          blur={5.2}
          far={4.5}
          color="#6b6580"
        />
      </group>

      {/* Phone lives in world space (not scaled by stack) for readable size */}
      <IPhone3D poseRef={phonePoseRef} />
      <NfcWaves sampleRef={sampleRef} />
    </>
  );
}

export function HeroProductScene({
  className,
  progressTargetRef,
  progressSmoothRef,
  sampleRef,
  layoutBiasRef,
  viewportFitRef,
  introLockedRef,
  onReady,
}: {
  className?: string;
  progressTargetRef: React.MutableRefObject<number>;
  progressSmoothRef: React.MutableRefObject<number>;
  sampleRef: React.MutableRefObject<ProductSequenceSample>;
  layoutBiasRef: React.MutableRefObject<{ x: number; y: number }>;
  viewportFitRef: React.MutableRefObject<SceneViewportFit>;
  introLockedRef: React.MutableRefObject<boolean>;
  onReady?: () => void;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const mouse = React.useRef({ x: 0, y: 0 });
  const target = React.useRef({ x: 0, y: 0 });
  const raf = React.useRef(0);
  const [interactive, setInteractive] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useLayoutEffect(() => {
    const mqHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setInteractive(mqHover.matches);
      setReducedMotion(mqMotion.matches);
    };
    sync();
    mqHover.addEventListener("change", sync);
    mqMotion.addEventListener("change", sync);
    return () => {
      mqHover.removeEventListener("change", sync);
      mqMotion.removeEventListener("change", sync);
    };
  }, []);

  React.useEffect(() => {
    if (!interactive || reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;
    const onMove = (e: PointerEvent) => {
      if (introLockedRef.current || progressSmoothRef.current < 0.96) {
        target.current.x = 0;
        target.current.y = 0;
        return;
      }
      const rect = root.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      target.current.x = Math.max(-1, Math.min(1, nx));
      target.current.y = Math.max(-1, Math.min(1, ny));
    };
    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
    };
    const tick = () => {
      mouse.current.x += (target.current.x - mouse.current.x) * 0.06;
      mouse.current.y += (target.current.y - mouse.current.y) * 0.06;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf.current);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, reducedMotion, progressSmoothRef, introLockedRef]);

  return (
    <div ref={rootRef} className={cn("relative h-full w-full", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(96,91,223,0.18)_0%,rgba(123,115,255,0.06)_45%,transparent_70%)] blur-2xl opacity-70"
      />
      <Canvas
        dpr={[1, 1.75]}
        frameloop="always"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMappingExposure: 1.05,
        }}
        camera={{
          position: [...HERO_CAMERA_FINAL.position],
          fov: HERO_CAMERA_FINAL.fov,
          near: 0.05,
          far: 80,
        }}
        style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
        onPointerMissed={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <React.Suspense fallback={null}>
          <SceneBody
            progressTargetRef={progressTargetRef}
            progressSmoothRef={progressSmoothRef}
            sampleRef={sampleRef}
            layoutBiasRef={layoutBiasRef}
            viewportFitRef={viewportFitRef}
            introLockedRef={introLockedRef}
            interactive={interactive}
            reducedMotion={reducedMotion}
            mouse={mouse}
            onReady={onReady}
          />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
