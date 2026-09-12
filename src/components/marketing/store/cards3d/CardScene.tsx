"use client";

import * as React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import { Card3D } from "./Card3D";
import { CardLighting } from "./CardLighting";
import { CardStack } from "./CardStack";
import { CARD_ASSETS, DEG } from "@/lib/card-assets";
import { HERO_CAMERA_FINAL } from "./heroFinal";
import { cn } from "@/lib/utils";

// Warm textures ASAP so hero + catalog don't flash empty
if (typeof window !== "undefined") {
  useTexture.preload([
    CARD_ASSETS.frontBlack,
    CARD_ASSETS.frontWhite,
    CARD_ASSETS.backBlack,
    CARD_ASSETS.backWhite,
  ]);
}

function DemandInvalidate() {
  const invalidate = useThree((s) => s.invalidate);
  React.useEffect(() => {
    invalidate();
    const t = window.setTimeout(() => invalidate(), 120);
    return () => window.clearTimeout(t);
  }, [invalidate]);
  return null;
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  React.useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

function HeroSceneContent({
  hoverEnabled,
  interactive,
  reducedMotion,
  mouse,
  onReady,
}: {
  hoverEnabled: boolean;
  interactive: boolean;
  reducedMotion: boolean;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  onReady?: () => void;
}) {
  return (
    <>
      <ReadySignal onReady={onReady} />
      <CardLighting />
      <Environment preset="city" environmentIntensity={0.25} />
      <CardStack
        hoverEnabled={hoverEnabled}
        interactive={interactive}
        reducedMotion={reducedMotion}
        mouse={mouse}
      />
    </>
  );
}

function StaticSceneContent({
  variant,
  onReady,
}: {
  variant: "white" | "black";
  onReady?: () => void;
}) {
  const isWhite = variant === "white";
  return (
    <>
      <ReadySignal onReady={onReady} />
      <CardLighting />
      <Environment preset="city" environmentIntensity={0.22} />
      <DemandInvalidate />
      <group position={[0, 0.02, 0]} scale={0.92}>
        <Card3D
          frontTexture={isWhite ? CARD_ASSETS.frontWhite : CARD_ASSETS.frontBlack}
          backTexture={isWhite ? CARD_ASSETS.backWhite : CARD_ASSETS.backBlack}
          position={[0, 0, 0]}
          rotation={[-6 * DEG, isWhite ? 12 * DEG : -12 * DEG, isWhite ? 4 * DEG : -4 * DEG]}
          scale={1}
          floatIntensity={0}
          hoverEnabled={false}
          interactive={false}
          reducedMotion
          edgeColor={isWhite ? "#ffffff" : "#1a1819"}
          lightFace={isWhite}
        />
      </group>
    </>
  );
}

export function CardScene({
  className,
  mode = "hero",
  variant = "black",
  onReady,
}: {
  className?: string;
  mode?: "hero" | "static";
  variant?: "white" | "black";
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
    if (mode !== "hero" || !interactive || reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;

    const onMove = (e: PointerEvent) => {
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
  }, [mode, interactive, reducedMotion]);

  const isStatic = mode === "static";

  return (
    <div
      ref={rootRef}
      className={cn("relative h-full w-full overflow-visible", className)}
    >
      {!isStatic ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(96,91,223,0.22)_0%,rgba(123,115,255,0.08)_45%,transparent_70%)] blur-2xl"
        />
      ) : null}

      <Canvas
        dpr={isStatic ? [1, 1.5] : [1, 1.75]}
        frameloop={isStatic ? "demand" : "always"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: isStatic ? "low-power" : "high-performance",
          toneMappingExposure: 1.05,
        }}
        camera={
          isStatic
            ? { position: [0, 0.05, 5.4], fov: 28, near: 0.1, far: 40 }
            : {
                position: [...HERO_CAMERA_FINAL.position],
                fov: HERO_CAMERA_FINAL.fov,
                near: 0.1,
                far: 50,
              }
        }
        style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
        onPointerMissed={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <React.Suspense fallback={null}>
          {isStatic ? (
            <StaticSceneContent variant={variant} onReady={onReady} />
          ) : (
            <HeroSceneContent
              hoverEnabled={interactive}
              interactive={interactive}
              reducedMotion={reducedMotion}
              mouse={mouse}
              onReady={onReady}
            />
          )}
        </React.Suspense>
      </Canvas>
    </div>
  );
}
