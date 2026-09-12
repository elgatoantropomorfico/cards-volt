"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { CARD_ASSETS } from "@/lib/card-assets";
import { HERO_CAMERA_FINAL } from "../heroFinal";
import { HeroCardCamera } from "./HeroCardCamera";
import { HeroCardLighting } from "./HeroCardLighting";
import { VoltCard } from "./VoltCard";
import {
  sampleHeroCardAnimation,
  type HeroAnimationSample,
} from "./useHeroCardAnimation";
import type { CardPose } from "../Card3D";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  useTexture.preload([
    CARD_ASSETS.frontBlack,
    CARD_ASSETS.frontWhite,
    CARD_ASSETS.backBlack,
    CARD_ASSETS.backWhite,
  ]);
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  React.useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

function AnimationDriver({
  progressTargetRef,
  progressSmoothRef,
  sampleRef,
  blackPoseRef,
  whitePoseRef,
  settledRef,
  stackRef,
}: {
  progressTargetRef: React.MutableRefObject<number>;
  progressSmoothRef: React.MutableRefObject<number>;
  sampleRef: React.MutableRefObject<HeroAnimationSample>;
  blackPoseRef: React.MutableRefObject<CardPose>;
  whitePoseRef: React.MutableRefObject<CardPose>;
  settledRef: React.MutableRefObject<number>;
  stackRef: React.RefObject<THREE.Group | null>;
}) {
  useFrame((_, delta) => {
    const target = progressTargetRef.current;
    progressSmoothRef.current = THREE.MathUtils.damp(
      progressSmoothRef.current,
      target,
      7.2,
      delta,
    );
    if (Math.abs(target - progressSmoothRef.current) < 0.0002) {
      progressSmoothRef.current = target;
    }

    const sample = sampleHeroCardAnimation(progressSmoothRef.current);
    sampleRef.current = sample;
    settledRef.current = sample.settled;

    if (stackRef.current) {
      stackRef.current.position.set(
        sample.stack.position[0],
        sample.stack.position[1],
        sample.stack.position[2],
      );
      stackRef.current.scale.setScalar(sample.stack.scale);
    }

    blackPoseRef.current = {
      position: sample.blackCard.position,
      rotation: sample.blackCard.rotation,
      scale: sample.blackCard.scale,
      visible: true,
    };
    whitePoseRef.current = {
      position: sample.whiteCard.position,
      rotation: sample.whiteCard.rotation,
      scale: sample.whiteCard.scale,
      visible: sample.whiteCard.reveal > 0.02,
    };
  });

  return null;
}

function SceneBody({
  progressTargetRef,
  progressSmoothRef,
  sampleRef,
  interactive,
  reducedMotion,
  mouse,
  onReady,
}: {
  progressTargetRef: React.MutableRefObject<number>;
  progressSmoothRef: React.MutableRefObject<number>;
  sampleRef: React.MutableRefObject<HeroAnimationSample>;
  interactive: boolean;
  reducedMotion: boolean;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  onReady?: () => void;
}) {
  const stackRef = React.useRef<THREE.Group>(null);
  const settledRef = React.useRef(0);
  const initial = sampleHeroCardAnimation(0);

  const blackPoseRef = React.useRef<CardPose>({
    position: initial.blackCard.position,
    rotation: initial.blackCard.rotation,
    scale: initial.blackCard.scale,
    visible: true,
  });
  const whitePoseRef = React.useRef<CardPose>({
    position: initial.whiteCard.position,
    rotation: initial.whiteCard.rotation,
    scale: initial.whiteCard.scale,
    visible: false,
  });

  return (
    <>
      <ReadySignal onReady={onReady} />
      <AnimationDriver
        progressTargetRef={progressTargetRef}
        progressSmoothRef={progressSmoothRef}
        sampleRef={sampleRef}
        blackPoseRef={blackPoseRef}
        whitePoseRef={whitePoseRef}
        settledRef={settledRef}
        stackRef={stackRef}
      />
      <HeroCardCamera sampleRef={sampleRef} />
      <HeroCardLighting sampleRef={sampleRef} />
      <Environment preset="city" environmentIntensity={0.25} />

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
          opacity={0.2}
          scale={11}
          blur={3.4}
          far={4.2}
          color="#2a1f4d"
        />
      </group>
    </>
  );
}

export function HeroCardScene({
  className,
  progressTargetRef,
  progressSmoothRef,
  sampleRef,
  onReady,
}: {
  className?: string;
  progressTargetRef: React.MutableRefObject<number>;
  progressSmoothRef: React.MutableRefObject<number>;
  sampleRef: React.MutableRefObject<HeroAnimationSample>;
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
      if (progressSmoothRef.current < 0.95) {
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
  }, [interactive, reducedMotion, progressSmoothRef]);

  return (
    <div ref={rootRef} className={cn("relative h-full w-full", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(96,91,223,0.22)_0%,rgba(123,115,255,0.08)_45%,transparent_70%)] blur-2xl"
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
          far: 60,
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
