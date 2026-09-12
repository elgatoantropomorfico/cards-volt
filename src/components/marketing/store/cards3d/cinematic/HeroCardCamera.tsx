"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import type { HeroAnimationSample } from "./useHeroCardAnimation";

type Props = {
  sampleRef: React.MutableRefObject<HeroAnimationSample>;
};

/**
 * Dolly via position only — FOV stays at the hero value (no zoom cheat).
 */
export function HeroCardCamera({ sampleRef }: Props) {
  const { camera } = useThree();
  const look = React.useRef(new THREE.Vector3());

  useFrame(() => {
    const s = sampleRef.current.camera;
    camera.position.set(s.position[0], s.position[1], s.position[2]);
    if ("isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
      if (Math.abs(camera.fov - s.fov) > 0.01) {
        camera.fov = s.fov;
        camera.updateProjectionMatrix();
      }
    }
    look.current.set(s.lookAt[0], s.lookAt[1], s.lookAt[2]);
    camera.lookAt(look.current);
  });

  return null;
}
