"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { NfcCardVisual } from "./NfcCardVisual";

export function HeroCards3D() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 24 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 24 });

  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);

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
    <div className="flex w-full items-center justify-center">
      <div
        ref={containerRef}
        className="relative flex h-[300px] w-full max-w-[440px] items-center justify-center sm:h-[320px] [perspective:1400px]"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-[360px] rounded-full bg-gradient-mesh opacity-45 blur-3xl" />

        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative flex items-center justify-center"
        >
          <div className="relative h-[200px] w-[min(100%,380px)] max-w-[380px]">
            <motion.div
              className="absolute left-[4%] top-1/2 z-10 w-[52%] max-w-[220px] -translate-y-[52%] -rotate-[11deg]"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <NfcCardVisual variant="white" />
            </motion.div>

            <motion.div
              className="absolute right-[4%] top-1/2 z-20 w-[52%] max-w-[220px] -translate-y-[48%] rotate-[9deg]"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            >
              <NfcCardVisual variant="black" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
