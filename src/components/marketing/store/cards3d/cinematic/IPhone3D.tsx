"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CardPose } from "../Card3D";

/** Cosmic Orange — metallic copper (iPhone 17) */
const ORANGE = "#E07A45";
const ORANGE_DARK = "#B85A32";
const ORANGE_LIGHT = "#F0A06A";
const ORANGE_MATTE = "#E8905C";
const ORANGE_LOGO = "#C45A2E";

const PHONE_W = 1.12;
const PHONE_H = 2.28;
const PHONE_D = 0.085;
/** ~20% of previous bezel — near-edge screen */
const BEZEL = 0.0076;
const RADIUS = 0.13;
const SCREEN_W = PHONE_W - BEZEL * 2;
const SCREEN_H = PHONE_H - BEZEL * 2.2;
const SCREEN_Y = -0.006;

/** Notch SVG viewBox 219×71 — keep aspect on-screen */
const NOTCH_ASPECT = 219 / 71;
const NOTCH_W = 0.72;
const NOTCH_H = NOTCH_W / NOTCH_ASPECT;

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

function createTexturedRoundedPlane(w: number, h: number, r: number, curveSegments = 20) {
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

function createPhoneBodyGeo() {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(PHONE_W, PHONE_H, RADIUS), {
    depth: PHONE_D,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 4,
    curveSegments: 14,
  });
  geo.translate(0, 0, -PHONE_D / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Simplified Apple logo silhouette */
function createAppleLogoGeo() {
  const apple = new THREE.Shape();
  apple.moveTo(0, 0.052);
  apple.bezierCurveTo(0.052, 0.052, 0.068, 0.008, 0.052, -0.032);
  apple.bezierCurveTo(0.038, -0.068, 0.018, -0.072, 0, -0.05);
  apple.bezierCurveTo(-0.018, -0.072, -0.038, -0.068, -0.052, -0.032);
  apple.bezierCurveTo(-0.068, 0.008, -0.052, 0.052, 0, 0.052);
  const geo = new THREE.ShapeGeometry(apple, 28);
  geo.computeVertexNormals();
  return geo;
}

const sharedPhoneGeo = typeof window !== "undefined" ? createPhoneBodyGeo() : null;
const sharedCavityGeo =
  typeof window !== "undefined"
    ? createTexturedRoundedPlane(SCREEN_W + BEZEL * 0.9, SCREEN_H + BEZEL * 0.9, RADIUS * 0.94)
    : null;
const sharedScreenGeo =
  typeof window !== "undefined"
    ? createTexturedRoundedPlane(SCREEN_W, SCREEN_H, RADIUS * 0.94)
    : null;
const sharedMatteGeo =
  typeof window !== "undefined"
    ? createTexturedRoundedPlane(PHONE_W * 0.86, PHONE_H * 0.62, 0.08, 16)
    : null;
const sharedAppleGeo = typeof window !== "undefined" ? createAppleLogoGeo() : null;
const sharedIslandBumpGeo =
  typeof window !== "undefined"
    ? (() => {
        const geo = new THREE.ExtrudeGeometry(roundedRectShape(0.42, 0.42, 0.09), {
          depth: 0.028,
          bevelEnabled: true,
          bevelThickness: 0.006,
          bevelSize: 0.006,
          bevelSegments: 3,
          curveSegments: 12,
        });
        geo.translate(0, 0, -0.014);
        geo.computeVertexNormals();
        return geo;
      })()
    : null;

function buildProfileTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, 1024);
  bg.addColorStop(0, "#120f1a");
  bg.addColorStop(0.45, "#1a1228");
  bg.addColorStop(1, "#0d0b12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 1024);

  const glow = ctx.createRadialGradient(256, 220, 10, 256, 240, 320);
  glow.addColorStop(0, "rgba(124,58,237,0.45)");
  glow.addColorStop(1, "rgba(124,58,237,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 1024);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "600 18px system-ui,sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("9:41", 36, 48);
  ctx.textAlign = "right";
  ctx.fillText("▮▮▮", 476, 48);

  ctx.beginPath();
  ctx.arc(256, 210, 78, 0, Math.PI * 2);
  const av = ctx.createLinearGradient(180, 140, 330, 280);
  av.addColorStop(0, "#a855f7");
  av.addColorStop(1, "#7c3aed");
  ctx.fillStyle = av;
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "700 44px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MV", 256, 214);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px system-ui,sans-serif";
  ctx.fillText("Mateo Vargas", 256, 330);
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = "500 20px system-ui,sans-serif";
  ctx.fillText("CEO · Arcline Studio", 256, 368);

  roundRect(ctx, 148, 400, 216, 34, 17);
  ctx.fillStyle = "rgba(124,58,237,0.35)";
  ctx.fill();
  ctx.fillStyle = "#ddd6fe";
  ctx.font = "600 15px system-ui,sans-serif";
  ctx.fillText("Volt Cards", 256, 419);

  const actions = [
    { label: "Guardar contacto", fill: "#7c3aed" },
    { label: "WhatsApp", fill: "rgba(255,255,255,0.09)" },
    { label: "Instagram", fill: "rgba(255,255,255,0.09)" },
    { label: "LinkedIn", fill: "rgba(255,255,255,0.09)" },
  ];
  actions.forEach((a, i) => {
    const y = 470 + i * 92;
    roundRect(ctx, 56, y, 400, 70, 20);
    ctx.fillStyle = a.fill;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 22px system-ui,sans-serif";
    ctx.fillText(a.label, 256, y + 38);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function SideButton({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial color={ORANGE_DARK} metalness={0.92} roughness={0.22} clearcoat={0.4} />
    </mesh>
  );
}

function Lens({ position, r = 0.055 }: { position: [number, number, number]; r?: number }) {
  return (
    <group position={position}>
      <mesh>
        <ringGeometry args={[r * 0.72, r + 0.01, 32]} />
        <meshPhysicalMaterial color={ORANGE} metalness={0.95} roughness={0.18} clearcoat={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[r * 0.72, 32]} />
        <meshPhysicalMaterial color="#0a0a0a" metalness={0.9} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[r * 0.38, 24]} />
        <meshPhysicalMaterial color="#1a2233" metalness={0.85} roughness={0.08} />
      </mesh>
    </group>
  );
}

function CameraIsland() {
  const bump = React.useMemo(
    () =>
      sharedIslandBumpGeo ??
      (() => {
        const geo = new THREE.ExtrudeGeometry(roundedRectShape(0.42, 0.42, 0.09), {
          depth: 0.028,
          bevelEnabled: true,
          bevelThickness: 0.006,
          bevelSize: 0.006,
          bevelSegments: 3,
          curveSegments: 12,
        });
        geo.translate(0, 0, -0.014);
        geo.computeVertexNormals();
        return geo;
      })(),
    [],
  );

  return (
    <group>
      <mesh geometry={bump} rotation={[0, Math.PI, 0]}>
        <meshPhysicalMaterial
          color={ORANGE}
          metalness={0.94}
          roughness={0.2}
          clearcoat={0.55}
          clearcoatRoughness={0.18}
        />
      </mesh>
      <group position={[0, 0, -0.03]}>
        <Lens position={[-0.08, 0.08, 0]} />
        <Lens position={[0.08, 0.08, 0]} />
        <Lens position={[0.08, -0.08, 0]} />
        <mesh position={[-0.08, -0.1, 0.001]}>
          <circleGeometry args={[0.018, 20]} />
          <meshPhysicalMaterial
            color="#f5f0e8"
            metalness={0.3}
            roughness={0.35}
            emissive="#fff8f0"
            emissiveIntensity={0.15}
          />
        </mesh>
        <mesh position={[-0.02, -0.14, 0.001]}>
          <circleGeometry args={[0.008, 12]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.04, -0.15, 0.001]}>
          <circleGeometry args={[0.006, 12]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </group>
    </group>
  );
}

function PhoneBack() {
  const matteGeo = React.useMemo(
    () => sharedMatteGeo ?? createTexturedRoundedPlane(PHONE_W * 0.86, PHONE_H * 0.62, 0.08, 16),
    [],
  );
  const appleGeo = React.useMemo(() => sharedAppleGeo ?? createAppleLogoGeo(), []);
  const backZ = -PHONE_D / 2 - 0.001;

  return (
    <group>
      {/* Matte Cosmic Orange inset panel */}
      <mesh geometry={matteGeo} position={[0, -0.06, backZ]} rotation={[0, Math.PI, 0]}>
        <meshPhysicalMaterial
          color={ORANGE_MATTE}
          metalness={0.12}
          roughness={0.72}
          clearcoat={0.08}
        />
      </mesh>
      {/* Apple logo — tone-on-tone darker copper */}
      <mesh
        geometry={appleGeo}
        position={[0, -0.02, backZ - 0.002]}
        rotation={[0, Math.PI, 0]}
        scale={1.15}
      >
        <meshPhysicalMaterial color={ORANGE_LOGO} metalness={0.35} roughness={0.45} />
      </mesh>
      {/* Antenna band */}
      <mesh position={[0.42, -0.85, -PHONE_D / 2]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.012, 0.28, 0.002]} />
        <meshPhysicalMaterial color={ORANGE_DARK} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Camera island — top-left of back */}
      <group position={[-0.28, 0.72, backZ - 0.01]}>
        <CameraIsland />
      </group>
    </group>
  );
}

/** Load /notch/notch.svg → canvas texture (SVG Image alone often yields 0×0 in WebGL) */
function useNotchSvgTexture() {
  const [tex, setTex] = React.useState<THREE.CanvasTexture | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const res = await fetch("/notch/notch.svg");
        const svgText = await res.text();
        const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("notch svg load failed"));
          img.src = objectUrl!;
        });
        if (cancelled) return;
        const W = 1095;
        const H = 355;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        const t = new THREE.CanvasTexture(canvas);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.premultiplyAlpha = false;
        t.needsUpdate = true;
        setTex(t);
      } catch {
        // silent — notch stays hidden if asset missing
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
  return tex;
}

export type PhonePose = CardPose & {
  screen: number;
  glow: number;
  island: number;
  opacity?: number;
};

export function IPhone3D({
  poseRef,
}: {
  poseRef: React.MutableRefObject<PhonePose>;
}) {
  const root = React.useRef<THREE.Group>(null);
  const dimRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const notchMat = React.useRef<THREE.MeshBasicMaterial>(null);

  const bodyGeo = React.useMemo(() => sharedPhoneGeo ?? createPhoneBodyGeo(), []);
  const cavityGeo = React.useMemo(
    () =>
      sharedCavityGeo ??
      createTexturedRoundedPlane(SCREEN_W + BEZEL * 0.9, SCREEN_H + BEZEL * 0.9, RADIUS * 0.94),
    [],
  );
  const screenGeo = React.useMemo(
    () => sharedScreenGeo ?? createTexturedRoundedPlane(SCREEN_W, SCREEN_H, RADIUS * 0.94),
    [],
  );
  const profileTex = React.useMemo(() => {
    if (typeof document === "undefined") return null;
    return buildProfileTexture();
  }, []);
  const notchTex = useNotchSvgTexture();

  React.useEffect(() => {
    if (!notchMat.current || !notchTex) return;
    notchMat.current.map = notchTex;
    notchMat.current.needsUpdate = true;
  }, [notchTex]);

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const pose = poseRef.current;
    const fade = Math.min(1, Math.max(0, pose.opacity ?? 1));
    const visible = pose.position[1] > -4.35 && fade > 0.02;
    g.visible = visible;
    if (!visible) return;

    g.position.set(pose.position[0], pose.position[1], pose.position[2]);
    g.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
    g.scale.setScalar(pose.scale);

    // Soft whole-phone fade during exit (fall-down)
    g.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if (!mat || !("opacity" in mat)) continue;
        const m = mat as THREE.Material & { opacity: number; transparent: boolean; depthWrite: boolean };
        if (m.userData._phoneBaseOp === undefined) {
          m.userData._phoneBaseOp = m.opacity;
          m.userData._phoneWasTransparent = m.transparent;
        }
        m.transparent = fade < 0.999 || !!m.userData._phoneWasTransparent;
        m.opacity = (m.userData._phoneBaseOp as number) * fade;
        m.depthWrite = fade > 0.92 && !m.userData._phoneWasTransparent;
      }
    });

    if (dimRef.current) {
      dimRef.current.opacity = (1 - Math.min(1, Math.max(0, pose.screen))) * fade;
      dimRef.current.userData._phoneBaseOp = 1;
    }

    // Notch stays readable while island is up (don't kill it when profile reveals)
    const island = Math.min(1, Math.max(0, pose.island));
    const ease = island * island * (3 - 2 * island);
    if (notchMat.current) {
      notchMat.current.opacity = ease * fade;
      notchMat.current.userData._phoneBaseOp = 1;
      notchMat.current.visible = ease * fade > 0.02 && !!notchTex;
    }
  });

  const cavityZ = PHONE_D / 2 + 0.005;
  const screenZ = PHONE_D / 2 + 0.014;
  const notchZ = screenZ + 0.003;
  const halfW = PHONE_W / 2;
  const notchY = SCREEN_Y + SCREEN_H / 2 - NOTCH_H * 0.42 - 0.02;

  return (
    <group ref={root}>
      <mesh geometry={bodyGeo} castShadow>
        <meshPhysicalMaterial
          color={ORANGE}
          metalness={0.92}
          roughness={0.22}
          clearcoat={0.55}
          clearcoatRoughness={0.18}
          emissive={ORANGE_LIGHT}
          emissiveIntensity={0.03}
        />
      </mesh>

      <PhoneBack />

      <mesh geometry={cavityGeo} position={[0, SCREEN_Y, cavityZ]} renderOrder={1}>
        <meshBasicMaterial color="#050505" />
      </mesh>

      <mesh geometry={screenGeo} position={[0, SCREEN_Y, screenZ]} renderOrder={2}>
        <meshBasicMaterial map={profileTex ?? undefined} color="#ffffff" toneMapped={false} />
      </mesh>

      <mesh geometry={screenGeo} position={[0, SCREEN_Y, screenZ + 0.001]} renderOrder={3}>
        <meshBasicMaterial ref={dimRef} color="#000000" transparent opacity={1} depthWrite={false} />
      </mesh>

      {/* Notch SVG — screen stack, always on top of dim/profile */}
      <mesh position={[0, notchY, notchZ]} renderOrder={8}>
        <planeGeometry args={[NOTCH_W, NOTCH_H]} />
        <meshBasicMaterial
          ref={notchMat}
          map={notchTex ?? undefined}
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <SideButton position={[-halfW - 0.012, 0.35, 0]} size={[0.022, 0.22, 0.045]} />
      <SideButton position={[-halfW - 0.012, 0.08, 0]} size={[0.022, 0.12, 0.045]} />
      <SideButton position={[-halfW - 0.012, -0.1, 0]} size={[0.022, 0.12, 0.045]} />
      <SideButton position={[halfW + 0.012, 0.2, 0]} size={[0.022, 0.28, 0.045]} />
    </group>
  );
}
