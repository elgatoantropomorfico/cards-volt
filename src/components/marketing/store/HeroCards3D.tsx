"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { NfcCardVisual } from "./NfcCardVisual";

function FloatingCard({
  variant,
  className,
  floatY,
  duration,
  delay = 0,
}: {
  variant: "white" | "black";
  className?: string;
  floatY: number;
  duration: number;
  delay?: number;
}) {
  return (
    <div className={className}>
      <motion.div
        animate={{ y: [0, floatY, 0] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <NfcCardVisual variant={variant} size="hero" />
      </motion.div>
    </div>
  );
}

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
    <div className="flex w-full items-center justify-center py-2">
      <div
        ref={containerRef}
        className="relative flex h-[min(340px,72vw)] w-full max-w-[520px] items-center justify-center [perspective:1400px] sm:h-[360px]"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-[420px] rounded-full bg-gradient-mesh opacity-50 blur-3xl" />

        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative flex h-[280px] w-[min(100%,460px)] max-w-[460px] items-center justify-center"
        >
          <FloatingCard
            variant="white"
            floatY={-8}
            duration={6}
            className="absolute left-[2%] top-1/2 z-10 -translate-y-[54%] -rotate-[12deg] sm:left-[6%]"
          />
          <FloatingCard
            variant="black"
            floatY={10}
            duration={5.5}
            delay={0.35}
            className="absolute right-[2%] top-1/2 z-20 -translate-y-[46%] rotate-[10deg] sm:right-[6%]"
          />
        </motion.div>
      </div>
    </div>
  );
}
