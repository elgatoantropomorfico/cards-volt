"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { NfcCardVisual } from "./NfcCardVisual";

export function HeroCards3D() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 22 });

  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [10, -10]);

  function onMouseMove(e: React.MouseEvent) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-[min(420px,70vw)] w-full max-w-lg items-center justify-center [perspective:1400px] md:h-[440px] md:max-w-xl"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-mesh opacity-50 blur-3xl" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-full w-full"
      >
        <motion.div
          className="absolute left-1/2 top-1/2 w-[72%] max-w-[280px] -translate-x-[78%] -translate-y-[58%]"
          style={{ transformStyle: "preserve-3d", zIndex: 1 }}
          animate={{ y: [0, -10, 0], rotateZ: [-14, -11, -14] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <NfcCardVisual variant="white" className="shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]" />
        </motion.div>

        <motion.div
          className="absolute left-1/2 top-1/2 w-[78%] max-w-[300px] -translate-x-[22%] -translate-y-[42%]"
          style={{ transformStyle: "preserve-3d", zIndex: 2 }}
          animate={{ y: [0, 12, 0], rotateZ: [10, 13, 10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
          <NfcCardVisual variant="black" className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)]" />
        </motion.div>
      </motion.div>
    </div>
  );
}
