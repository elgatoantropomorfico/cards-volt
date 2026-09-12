"use client";

import * as React from "react";
import { Card3D, type CardPose } from "../Card3D";
import { CARD_ASSETS } from "@/lib/card-assets";

type VoltCardProps = {
  variant: "black" | "white";
  poseRef: React.MutableRefObject<CardPose>;
  settledRef: React.MutableRefObject<number>;
  hoverEnabled?: boolean;
  interactive?: boolean;
  reducedMotion?: boolean;
  mouse?: React.MutableRefObject<{ x: number; y: number }>;
  floatIntensity?: number;
  floatPhase?: number;
};

/**
 * Volt NFC card mesh driven by cinematic poses (progress 0→1).
 * Final pose must match CardStack / heroFinal.
 */
export function VoltCard({
  variant,
  poseRef,
  settledRef,
  hoverEnabled = false,
  interactive = false,
  reducedMotion = false,
  mouse,
  floatIntensity = 1,
  floatPhase = 0,
}: VoltCardProps) {
  const isWhite = variant === "white";

  return (
    <Card3D
      frontTexture={isWhite ? CARD_ASSETS.frontWhite : CARD_ASSETS.frontBlack}
      backTexture={isWhite ? CARD_ASSETS.backWhite : CARD_ASSETS.backBlack}
      position={poseRef.current.position}
      rotation={poseRef.current.rotation}
      scale={poseRef.current.scale}
      poseRef={poseRef}
      settledRef={settledRef}
      floatIntensity={floatIntensity}
      floatPhase={floatPhase}
      hoverEnabled={hoverEnabled}
      interactive={interactive}
      reducedMotion={reducedMotion}
          edgeColor={isWhite ? "#ffffff" : "#2a2829"}
      lightFace={isWhite}
      mouse={mouse}
    />
  );
}
