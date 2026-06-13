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
  onFlipChange,
}: {
  variant: "white" | "black";
  className?: string;
  floatY: number;
  duration: number;
  delay?: number;
  onFlipChange?: (flipped: boolean) => void;
}) {
  return (
    <div className={className}>
      <motion.div
        animate={{ y: [0, floatY, 0] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <NfcCardVisual variant={variant} size="hero" onFlipChange={onFlipChange} />
      </motion.div>
    </div>
  );
}

export function HeroCards3D() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cardHoverRef = React.useRef(0);
  const [parallaxPaused, setParallaxPaused] = React.useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 28 });

  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [5, -5]);

  function onCardFlipChange(flipped: boolean) {
    cardHoverRef.current = Math.max(0, cardHoverRef.current + (flipped ? 1 : -1));
    const paused = cardHoverRef.current > 0;
    setParallaxPaused(paused);
    if (paused) {
      mouseX.set(0);
      mouseY.set(0);
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (parallaxPaused) return;
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
            onFlipChange={onCardFlipChange}
            className="absolute left-[2%] top-1/2 z-10 -translate-y-[54%] -rotate-[12deg] sm:left-[6%]"
          />
          <FloatingCard
            variant="black"
            floatY={10}
            duration={5.5}
            delay={0.35}
            onFlipChange={onCardFlipChange}
            className="absolute right-[2%] top-1/2 z-20 -translate-y-[46%] rotate-[10deg] sm:right-[6%]"
          />
        </motion.div>
      </div>
    </div>
  );
}
