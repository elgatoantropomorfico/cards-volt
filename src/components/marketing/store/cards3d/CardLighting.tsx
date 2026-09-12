"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

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

export function CardLighting() {
  useLayoutEffect(() => {
    if (!rectAreaReady) {
      RectAreaLightUniformsLib.init();
      rectAreaReady = true;
    }
  }, []);

  return (
    <>
      <ambientLight intensity={0.16} color="#ebe6ff" />

      <AreaLight
        intensity={4.4}
        width={6}
        height={4}
        color="#ffffff"
        position={[-2.8, 2.6, 3.2]}
      />
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

      <directionalLight intensity={0.32} color="#ffffff" position={[-4, 5, 2]} />
      <pointLight intensity={0.5} color="#605bdf" position={[0, -1.2, 1.5]} distance={8} decay={2} />
      <pointLight intensity={0.22} color="#9b8cff" position={[1.5, 1.8, -1]} distance={6} decay={2} />
      <hemisphereLight args={["#f2efff", "#1a1528", 0.32]} />
    </>
  );
}
