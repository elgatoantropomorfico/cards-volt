"use client";

import { ContactShadows } from "@react-three/drei";
import { Card3D } from "./Card3D";
import { CARD_ASSETS } from "@/lib/card-assets";
import {
  HERO_BLACK_FINAL,
  HERO_STACK_FINAL,
  HERO_WHITE_FINAL,
} from "./heroFinal";
import * as React from "react";

type CardStackProps = {
  hoverEnabled?: boolean;
  interactive?: boolean;
  reducedMotion?: boolean;
  mouse?: React.MutableRefObject<{ x: number; y: number }>;
};

/** Static hero stack — values must stay in sync with heroFinal / KEY_H. */
export function CardStack({
  hoverEnabled = true,
  interactive = true,
  reducedMotion = false,
  mouse,
}: CardStackProps) {
  return (
    <group position={HERO_STACK_FINAL.position} scale={HERO_STACK_FINAL.scale}>
      <Card3D
        frontTexture={CARD_ASSETS.frontWhite}
        backTexture={CARD_ASSETS.backWhite}
        position={HERO_WHITE_FINAL.position}
        rotation={HERO_WHITE_FINAL.rotation}
        scale={HERO_WHITE_FINAL.scale}
        floatIntensity={0.85}
        floatPhase={1.7}
        hoverEnabled={false}
        interactive={interactive}
        reducedMotion={reducedMotion}
        edgeColor="#ffffff"
        lightFace
        mouse={mouse}
      />

      <Card3D
        frontTexture={CARD_ASSETS.frontBlack}
        backTexture={CARD_ASSETS.backBlack}
        position={HERO_BLACK_FINAL.position}
        rotation={HERO_BLACK_FINAL.rotation}
        scale={HERO_BLACK_FINAL.scale}
        floatIntensity={1}
        floatPhase={0.35}
        hoverEnabled={hoverEnabled}
        interactive={interactive}
        reducedMotion={reducedMotion}
        edgeColor="#1a1819"
        mouse={mouse}
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
  );
}
