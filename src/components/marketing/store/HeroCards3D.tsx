"use client";

import { NfcCardVisual } from "./NfcCardVisual";

/**
 * Hero cards — sin parallax ni motion wrappers en la negra.
 * El flip es idéntico al catálogo (mismo NfcCardVisual, sin transforms padre).
 */
export function HeroCards3D() {
  return (
    <div className="flex w-full items-center justify-center py-2">
      <div className="relative flex h-[min(340px,72vw)] w-full max-w-[520px] items-center justify-center sm:h-[360px]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-[420px] rounded-full bg-gradient-mesh opacity-50 blur-3xl" />

        <div className="relative h-[280px] w-[min(100%,460px)] max-w-[460px]">
          {/* Blanca: decorativa, sin interacción */}
          <div className="pointer-events-none absolute left-[2%] top-1/2 z-10 -translate-y-[54%] -rotate-[12deg] sm:left-[6%]">
            <div className="animate-hero-card-float">
              <NfcCardVisual variant="white" size="hero" flippable={false} />
            </div>
          </div>

          {/* Negra: mismo componente y flip que el catálogo */}
          <div className="absolute right-[2%] top-1/2 z-20 -translate-y-1/2 sm:right-[6%]">
            <NfcCardVisual variant="black" size="hero" />
          </div>
        </div>
      </div>
    </div>
  );
}
