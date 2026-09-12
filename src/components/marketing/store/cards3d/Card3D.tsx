"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { DEG } from "@/lib/card-assets";

const CARD_W = 3.42;
const CARD_H = CARD_W / 1.5858;
/** Real NFC card ~0.76mm; keep visually thin in scene units */
const CARD_D = 0.01;
const BEVEL = 0.0022;
/** Match SVG corner: rx 13.41 / width 237.26 */
const CORNER_R = CARD_W * 0.0565;

function roundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.min(r, w / 2 - 1e-6, h / 2 - 1e-6);
  shape.moveTo(x + rr, y);
  shape.lineTo(x + w - rr, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + rr);
  shape.lineTo(x + w, y + h - rr);
  shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  shape.lineTo(x + rr, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - rr);
  shape.lineTo(x, y + rr);
  shape.quadraticCurveTo(x, y, x + rr, y);
  return shape;
}

/**
 * Rounded plane with planar 0–1 UVs (ShapeGeometry defaults break PNG/SVG maps).
 * Corner radius matches the SVG / extruded body so print + rim align.
 */
function createTexturedRoundedPlane(w: number, h: number, r: number, curveSegments = 18) {
  const geo = new THREE.ShapeGeometry(roundedRectShape(w, h, r), curveSegments);
  const pos = geo.attributes.position;
  const uvs = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uvs.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  }
  uvs.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createCardGeometry(bevel = true, shrink = 1) {
  const w = CARD_W * shrink;
  const h = CARD_H * shrink;
  const r = CORNER_R * shrink;
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
    depth: CARD_D,
    bevelEnabled: bevel,
    bevelThickness: bevel ? BEVEL : 0,
    bevelSize: bevel ? BEVEL : 0,
    bevelOffset: 0,
    bevelSegments: bevel ? 4 : 1,
    curveSegments: 16,
  });
  geo.translate(0, 0, -CARD_D / 2);
  geo.computeVertexNormals();
  return geo;
}

function createCardFaceGeometry(cover = false) {
  // cover=true: oversize print + underlay so AA fringe never reveals a darker body
  const s = cover ? 1.022 : 0.999;
  const r = cover ? 1.08 : 0.995;
  return createTexturedRoundedPlane(CARD_W * s, CARD_H * s, CORNER_R * r, 28);
}

const sharedCardGeo = typeof window !== "undefined" ? createCardGeometry(true, 1) : null;
/** White body inset under the print — no black tips peeking past the face */
const sharedCardGeoFlat = typeof window !== "undefined" ? createCardGeometry(false, 0.978) : null;
const sharedFaceGeo = typeof window !== "undefined" ? createCardFaceGeometry(false) : null;
const sharedFaceCoverGeo = typeof window !== "undefined" ? createCardFaceGeometry(true) : null;

function useCardMaps(frontUrl: string, backUrl: string) {
  const [front, back] = useTexture([frontUrl, backUrl]);

  React.useLayoutEffect(() => {
    for (const tex of [front, back]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = true;
      tex.needsUpdate = true;
    }
  }, [front, back]);

  return { front, back };
}

function FaceMaterial({
  map,
  light,
}: {
  map: THREE.Texture;
  light?: boolean;
}) {
  return (
    <meshPhysicalMaterial
      map={map}
      color="#ffffff"
      metalness={light ? 0.06 : 0.1}
      roughness={light ? 0.5 : 0.45}
      clearcoat={light ? 0.18 : 0.2}
      clearcoatRoughness={light ? 0.55 : 0.68}
      reflectivity={light ? 0.1 : 0.15}
      envMapIntensity={light ? 0.2 : 0.38}
      toneMapped
      polygonOffset
      polygonOffsetFactor={-2}
      polygonOffsetUnits={-2}
    />
  );
}

/** White cards: unlit body so bevel never picks dark hemisphere/rim as a black tip */
function EdgeMaterial({ color, light }: { color: string; light?: boolean }) {
  if (light) {
    return <meshBasicMaterial color="#ffffff" toneMapped={false} />;
  }
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0.08}
      roughness={0.55}
      clearcoat={0.1}
      clearcoatRoughness={0.65}
      envMapIntensity={0.22}
      toneMapped
    />
  );
}

export type CardPose = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  visible?: boolean;
};

export type Card3DProps = {
  frontTexture: string;
  backTexture: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  floatIntensity?: number;
  floatPhase?: number;
  hoverEnabled?: boolean;
  interactive?: boolean;
  reducedMotion?: boolean;
  edgeColor?: string;
  lightFace?: boolean;
  mouse?: React.MutableRefObject<{ x: number; y: number }>;
  /** When set, position/rotation/scale are driven from this ref each frame. */
  poseRef?: React.MutableRefObject<CardPose>;
  /** 0–1 blend back to idle float / hover once cinematic settles. */
  settledRef?: React.MutableRefObject<number>;
};

export function Card3D({
  frontTexture,
  backTexture,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  floatIntensity = 1,
  floatPhase = 0,
  hoverEnabled = true,
  interactive = true,
  reducedMotion = false,
  edgeColor = "#1c1a1b",
  lightFace = false,
  mouse,
  poseRef,
  settledRef,
}: Card3DProps) {
  const { front, back } = useCardMaps(frontTexture, backTexture);
  const root = React.useRef<THREE.Group>(null);
  const flipGroup = React.useRef<THREE.Group>(null);
  const hoveredRef = React.useRef(false);
  const hoverProg = React.useRef(0);
  const flipProg = React.useRef(0);
  const t0 = React.useRef(Math.random() * 10);
  const flipArmed = React.useRef(false);
  const leaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const geo = React.useMemo(
    () =>
      lightFace
        ? (sharedCardGeoFlat ?? createCardGeometry(false, 0.978))
        : (sharedCardGeo ?? createCardGeometry(true, 1)),
    [lightFace],
  );
  const faceGeo = React.useMemo(
    () =>
      lightFace
        ? (sharedFaceCoverGeo ?? createCardFaceGeometry(true))
        : (sharedFaceGeo ?? createCardFaceGeometry(false)),
    [lightFace],
  );

  const baseRot = React.useMemo(
    () => new THREE.Euler(rotation[0], rotation[1], rotation[2]),
    [rotation],
  );
  const basePos = React.useMemo(() => new THREE.Vector3(...position), [position]);

  const lockHover = React.useCallback(() => {
    if (!hoverEnabled || !interactive) return;
    const settled = settledRef?.current ?? 1;
    if (poseRef && settled < 0.85) return;
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    hoveredRef.current = true;
    document.body.style.cursor = "pointer";
  }, [hoverEnabled, interactive, poseRef, settledRef]);

  const unlockHover = React.useCallback(() => {
    if (!hoverEnabled || !interactive) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      hoveredRef.current = false;
      document.body.style.cursor = "auto";
      leaveTimer.current = null;
    }, 140);
  }, [hoverEnabled, interactive]);

  React.useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  useFrame((_, delta) => {
    const g = root.current;
    const flip = flipGroup.current;
    if (!g || !flip) return;

    t0.current += delta;
    const t = t0.current;
    const settled = settledRef?.current ?? 1;
    const driven = Boolean(poseRef);

    if (driven && poseRef) {
      const pose = poseRef.current;
      const vis = pose.visible !== false;
      g.visible = vis;
      if (!vis) {
        flip.rotation.y = 0;
        return;
      }

      basePos.set(pose.position[0], pose.position[1], pose.position[2]);
      baseRot.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
      // scale stored on closure via local — apply below
    }

    const poseScale = driven && poseRef ? poseRef.current.scale : scale;
    const active = hoveredRef.current;
    const canHover =
      hoverEnabled && interactive && !reducedMotion && (!driven || settled > 0.85);

    if (canHover && active) {
      hoverProg.current = THREE.MathUtils.damp(hoverProg.current, 1, 8.5, delta);
      if (hoverProg.current > 0.85) flipArmed.current = true;
      flipProg.current = THREE.MathUtils.damp(
        flipProg.current,
        flipArmed.current ? 1 : 0,
        4.0,
        delta,
      );
    } else {
      flipArmed.current = false;
      flipProg.current = THREE.MathUtils.damp(flipProg.current, 0, 4.4, delta);
      if (flipProg.current < 0.1) {
        hoverProg.current = THREE.MathUtils.damp(hoverProg.current, 0, 7.2, delta);
      }
    }

    const floatGate = driven ? 0.45 + settled * 0.55 : 1;
    // Freeze idle float once cinematic is settled (locked hero) — avoids “replay” flicker
    const freezeFloat = driven && settled >= 0.999;
    const fi =
      reducedMotion || freezeFloat
        ? 0
        : floatIntensity * floatGate * (1 - hoverProg.current * 0.9);
    const floatY = Math.sin(t * 0.82 + floatPhase) * 0.045 * fi;
    const floatRx = Math.sin(t * 0.68 + floatPhase * 1.25) * 0.5 * DEG * fi;
    const floatRy = Math.sin(t * 0.52 + floatPhase * 0.85) * 0.7 * DEG * fi;
    const floatRz = Math.sin(t * 0.9 + floatPhase * 1.05) * 0.3 * DEG * fi;

    let paraX = 0;
    let paraY = 0;
    if (interactive && !reducedMotion && mouse && floatGate > 0.5) {
      paraX = mouse.current.y * 2 * DEG * floatGate;
      paraY = mouse.current.x * 3 * DEG * floatGate;
    }

    const s = hoverProg.current;

    g.position.set(basePos.x, basePos.y + floatY, basePos.z + s * 0.28);
    g.rotation.set(
      THREE.MathUtils.lerp(baseRot.x + floatRx + paraX, floatRx * 0.1, s),
      THREE.MathUtils.lerp(baseRot.y + floatRy + paraY, floatRy * 0.08, s),
      THREE.MathUtils.lerp(baseRot.z + floatRz, 0, s),
    );
    g.scale.setScalar(poseScale * (1 + s * 0.035));

    flip.rotation.y = flipProg.current * Math.PI;
  });

  const faceZ = CARD_D / 2 + (lightFace ? 0.0006 : BEVEL + 0.0008);
  const underlayZ = faceZ - 0.0004;

  return (
    <group ref={root} position={position} rotation={rotation} scale={scale}>
      {hoverEnabled ? (
        <mesh
          position={[0, 0, 0.55]}
          onPointerEnter={(e) => {
            e.stopPropagation();
            lockHover();
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            lockHover();
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            unlockHover();
          }}
          visible={false}
        >
          <boxGeometry args={[CARD_W * 1.4, CARD_H * 1.45, 1.4]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      <group ref={flipGroup}>
        {/* White: no extruded body — that silhouette IS the “franja negra”, not a light */}
        {!lightFace ? (
          <mesh geometry={geo} castShadow receiveShadow>
            <EdgeMaterial color={edgeColor} light={false} />
          </mesh>
        ) : null}

        {lightFace ? (
          <>
            <mesh geometry={faceGeo} position={[0, 0, underlayZ]} renderOrder={1}>
              <meshBasicMaterial color="#ffffff" toneMapped={false} depthWrite />
            </mesh>
            <mesh
              geometry={faceGeo}
              position={[0, 0, -underlayZ]}
              rotation={[0, Math.PI, 0]}
              renderOrder={1}
            >
              <meshBasicMaterial color="#ffffff" toneMapped={false} depthWrite />
            </mesh>
          </>
        ) : null}

        <mesh
          geometry={faceGeo}
          position={[0, 0, faceZ]}
          castShadow={!lightFace}
          renderOrder={2}
        >
          <FaceMaterial map={front} light={lightFace} />
        </mesh>

        <mesh
          geometry={faceGeo}
          position={[0, 0, -faceZ]}
          rotation={[0, Math.PI, 0]}
          castShadow={!lightFace}
          renderOrder={2}
        >
          <FaceMaterial map={back} light={lightFace} />
        </mesh>
      </group>
    </group>
  );
}
