"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import type { HeroAnimationSample } from "./useHeroCardAnimation";

let rectAreaReady = false;

function AreaLight({
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
  const ref = useRef<THREE.RectAreaLight>(null);
  useLayoutEffect(() => {
    ref.current?.lookAt(0, 0, 0);
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

function SweepKeyLight({
  sampleRef,
}: {
  sampleRef: MutableRefObject<HeroAnimationSample>;
}) {
  const ref = useRef<THREE.RectAreaLight>(null);

  useFrame(() => {
    const light = ref.current;
    if (!light) return;
    const sweep = sampleRef.current.lightSweep;
    const x = THREE.MathUtils.lerp(-3.4, 3.2, sweep);
    const y = THREE.MathUtils.lerp(2.8, 1.2, sweep);
    const z = THREE.MathUtils.lerp(3.6, 2.2, sweep);
    light.position.set(x, y, z);
    light.lookAt(0, 0.02, 0);
    light.intensity = THREE.MathUtils.lerp(3.6, 5.2, Math.sin(sweep * Math.PI));
  });

  return (
    <rectAreaLight ref={ref} intensity={4.2} width={6.5} height={4.2} color="#ffffff" />
  );
}

export function HeroCardLighting({
  sampleRef,
}: {
  sampleRef: MutableRefObject<HeroAnimationSample>;
}) {
  useLayoutEffect(() => {
    if (!rectAreaReady) {
      RectAreaLightUniformsLib.init();
      rectAreaReady = true;
    }
  }, []);

  return (
    <>
      <ambientLight intensity={0.16} color="#ebe6ff" />
      <SweepKeyLight sampleRef={sampleRef} />
      <AreaLight
        intensity={1.15}
        width={5}
        height={3.5}
        color="#d4ccff"
        position={[3.2, 0.4, 2.4]}
      />
      <AreaLight
        intensity={1.55}
        width={3.5}
        height={4}
        color="#7b73ff"
        position={[0.2, -0.4, -3.4]}
      />
      <directionalLight intensity={0.28} color="#ffffff" position={[-4, 5, 2]} />
      <pointLight intensity={0.45} color="#605bdf" position={[0, -1.2, 1.5]} distance={8} decay={2} />
      <hemisphereLight args={["#f2efff", "#1a1528", 0.3]} />
    </>
  );
}
