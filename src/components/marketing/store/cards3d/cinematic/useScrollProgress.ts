"use client";

import * as React from "react";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/**
 * Scroll → progress 0..1 on a tall sticky track.
 * Writes to a ref every frame of scroll (no React churn for the GL loop).
 * When locked, progress stays pinned at 1 (no scroll re-measure / replay).
 */
export function useScrollProgress(
  trackRef: React.RefObject<HTMLElement | null>,
  progressTargetRef: React.MutableRefObject<number>,
  opts?: {
    reducedMotion?: boolean;
    locked?: boolean;
    onProgress?: (p: number) => void;
  },
) {
  const reduced = opts?.reducedMotion ?? false;
  const locked = opts?.locked ?? false;
  const onProgress = opts?.onProgress;

  React.useEffect(() => {
    if (reduced || locked) {
      progressTargetRef.current = 1;
      onProgress?.(1);
      return;
    }

    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const trackH = el.offsetHeight;
      const viewH = window.innerHeight;
      const scrollable = Math.max(1, trackH - viewH);
      const scrolled = clamp01(-rect.top / scrollable);
      progressTargetRef.current = scrolled;
      onProgress?.(scrolled);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [trackRef, progressTargetRef, reduced, locked, onProgress]);
}
