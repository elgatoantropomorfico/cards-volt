"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ProductSequenceSample } from "./useProductSequence";

/** Soft violet-volt — matches notch halo / brand */
const WAVE_COLOR = "#b794f6";
const OP_MAX = 0.36;
const OP_MED = 0.2;
const OP_LOW = 0.1;

type ArcRefs = {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  index: number; // 0 inner, 1 mid, 2 outer
};

/**
 * Pulse choreography (scrub-reversible via phase 0→1):
 * 1 appears max → 2 max + 1 med → 3 max + 2 med + 1 low
 * → 3 out + 2 low + 1 med → 2 out + 1 low → 1 out
 */
function opacitiesForPhase(phase: number): [number, number, number] {
  if (phase <= 0 || phase >= 1) return [0, 0, 0];

  const keys: { t: number; o: [number, number, number] }[] = [
    { t: 0.0, o: [0, 0, 0] },
    { t: 0.1, o: [OP_MAX, 0, 0] },
    { t: 0.22, o: [OP_MED, OP_MAX, 0] },
    { t: 0.34, o: [OP_LOW, OP_MED, OP_MAX] },
    { t: 0.48, o: [OP_MED, OP_LOW, 0] },
    { t: 0.6, o: [OP_LOW, 0, 0] },
    { t: 0.72, o: [0, 0, 0] },
    { t: 1.0, o: [0, 0, 0] },
  ];

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!;
    const b = keys[i + 1]!;
    if (phase >= a.t && phase <= b.t) {
      const u = (phase - a.t) / (b.t - a.t || 1);
      const s = u * u * (3 - 2 * u);
      return [
        a.o[0] + (b.o[0] - a.o[0]) * s,
        a.o[1] + (b.o[1] - a.o[1]) * s,
        a.o[2] + (b.o[2] - a.o[2]) * s,
      ];
    }
  }
  return [0, 0, 0];
}

/**
 * Soft horizontal NFC arcs ( ))) / ((( ) toward Acercá / Conectá.
 * Thin, violet-volt, pulse sequence — not bounce-in/out.
 */
export function NfcWaves({
  sampleRef,
}: {
  sampleRef: React.MutableRefObject<ProductSequenceSample>;
}) {
  const group = React.useRef<THREE.Group>(null);
  const arcs = React.useRef<ArcRefs[]>([]);

  React.useEffect(() => {
    return () => {
      arcs.current = [];
    };
  }, []);

  useFrame(() => {
    const phase = sampleRef.current.nfcWaves;
    const g = group.current;
    if (!g) return;

    const ops = opacitiesForPhase(phase);
    const any = ops[0] + ops[1] + ops[2] > 0.01;
    g.visible = any;
    if (!any) return;

    // Near Dynamic Island / notch (world ≈ phone.y + local notch Y)
    const phone = sampleRef.current.phone;
    g.position.set(
      phone.position[0],
      phone.position[1] + 1.02,
      phone.position[2] + 0.1,
    );

    for (const arc of arcs.current) {
      const op = ops[arc.index] ?? 0;
      arc.mat.opacity = op;
      // Barely breathe outward — subtle, not bounce
      const breathe = 1 + (op / OP_MAX) * 0.04 * (arc.index + 1);
      arc.mesh.scale.setScalar(breathe);
    }
  });

  const register =
    (index: number) =>
    (mesh: THREE.Mesh | null) => {
      if (!mesh) return;
      if (arcs.current.some((a) => a.mesh === mesh)) return;
      arcs.current.push({
        mesh,
        mat: mesh.material as THREE.MeshBasicMaterial,
        index,
      });
    };

  // Thin strokes; radii spaced like the mock
  const radii = [
    [0.2, 0.208],
    [0.3, 0.308],
    [0.4, 0.408],
  ] as const;
  const spread = 1.05; // ~60° of arc — soft, not a full ring

  return (
    <group ref={group} visible={false}>
      {/* Left arcs — open toward Acercá (−X) */}
      <group position={[-0.52, 0, 0]}>
        {radii.map(([inner, outer], i) => (
          <mesh key={`L${i}`} ref={register(i)}>
            <ringGeometry
              args={[inner, outer, 64, 1, Math.PI - spread / 2, spread]}
            />
            <meshBasicMaterial
              color={WAVE_COLOR}
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Right arcs — open toward Conectá (+X) */}
      <group position={[0.52, 0, 0]}>
        {radii.map(([inner, outer], i) => (
          <mesh key={`R${i}`} ref={register(i)}>
            <ringGeometry args={[inner, outer, 64, 1, -spread / 2, spread]} />
            <meshBasicMaterial
              color={WAVE_COLOR}
              transparent
              opacity={0}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
