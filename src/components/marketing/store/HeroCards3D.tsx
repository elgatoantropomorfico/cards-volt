"use client";

import { NfcCardVisual } from "./NfcCardVisual";
import { cn } from "@/lib/utils";

/**
 * Hero cards — sin parallax ni motion wrappers en la negra.
 * El flip es idéntico al catálogo (mismo NfcCardVisual, sin transforms padre).
 */
export function HeroCards3D({ fill = false }: { fill?: boolean }) {
  return (
    <div className="flex w-full items-center justify-center py-2">
      <div
        className={cn(
          "relative flex w-full items-center justify-center",
          fill
            ? "h-[min(440px,52vh)] max-w-[640px] lg:h-[min(480px,56vh)]"
            : "h-[min(340px,72vw)] max-w-[520px] sm:h-[360px]",
        )}
      >
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-[420px] rounded-full bg-gradient-mesh opacity-50 blur-3xl" />

        <div
          className={cn(
            "relative w-[min(100%,460px)]",
            fill ? "h-[340px] max-w-[560px] lg:h-[380px]" : "h-[280px] max-w-[460px]",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute top-1/2 z-10 -translate-y-[54%] -rotate-[12deg]",
              fill ? "left-[4%]" : "left-[2%] sm:left-[6%]",
            )}
          >
            <div className="animate-hero-card-float">
              <NfcCardVisual variant="white" size={fill ? "hero-lg" : "hero"} flippable={false} />
            </div>
          </div>

          <div
            className={cn(
              "absolute top-1/2 z-20 -translate-y-1/2",
              fill ? "right-[4%]" : "right-[2%] sm:right-[6%]",
            )}
          >
            <NfcCardVisual variant="black" size={fill ? "hero-lg" : "hero"} />
          </div>
        </div>
      </div>
    </div>
  );
}
