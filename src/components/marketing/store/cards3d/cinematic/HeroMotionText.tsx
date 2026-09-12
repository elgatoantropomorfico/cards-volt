"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Dark gray — not pure black */
const TEXT_GRAY = "text-[#3f3f46]";
/** Pink-violet in the Comprar button family (no bg-clip on blurred chars) */
const ACCENT_FILL = "text-[#c026d3]";

export function HeroMotionText({
  text,
  amount,
  sweep = 0,
  align = "left",
  className,
  stagger = 0.032,
  accent = false,
}: {
  text: string;
  amount: number;
  /** 0→1 soft alpha halo across glyphs only */
  sweep?: number;
  align?: "left" | "right" | "center";
  className?: string;
  stagger?: number;
  accent?: boolean;
}) {
  const chars = React.useMemo(() => Array.from(text), [text]);
  const n = Math.max(1, chars.length);
  const show = amount >= 0.02;
  /** Wide sigma → soft defocused halo, not a hard bar */
  const sigma = 0.18;

  return (
    <div
      className={cn(
        "relative inline-block max-w-full",
        align === "right" && "ml-auto text-right",
        align === "center" && "mx-auto text-center",
        align === "left" && "mr-auto text-left",
      )}
      aria-hidden={amount < 0.05}
      style={{ opacity: show ? 1 : 0 }}
    >
      <p
        className={cn(
          "relative font-display text-[clamp(1.15rem,2.4vw,1.95rem)] font-semibold leading-[0.95] tracking-[-0.02em]",
          accent ? ACCENT_FILL : TEXT_GRAY,
          className,
        )}
      >
        {chars.map((ch, i) => {
          const start = (i / n) * Math.min(0.45, stagger * n);
          const local = Math.min(1, Math.max(0, (amount - start) / Math.max(0.22, 1 - start)));
          const eased = local * local * (3 - 2 * local);
          const blur = accent ? 0 : (1 - eased) * 2.5;

          // Soft gaussian alpha only on this glyph (not a block overlay)
          const center = (i + 0.5) / n;
          const d = (center - sweep) / sigma;
          const halo = sweep > 0.01 && sweep < 0.99 ? Math.exp(-0.5 * d * d) : 0;

          return (
            <span key={`${i}-${ch}`} className="relative inline-block will-change-transform">
              <span
                className="inline-block"
                style={{
                  opacity: eased,
                  transform: `translateY(${(1 - eased) * 7}px)`,
                  filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                  transition: `opacity 60ms ${EASE}, transform 60ms ${EASE}, filter 60ms ${EASE}`,
                  whiteSpace: ch === " " ? "pre" : undefined,
                  // ~50% of default word gap (inline-block nbsp runs wide)
                  ...(ch === " " ? { width: "0.28em", overflow: "hidden" } : null),
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
              {/* Soft defocused alpha pass — glyph-clipped */}
              {ch !== " " && halo > 0.02 ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 inline-block select-none"
                  style={{
                    color: accent ? "#ffe4f5" : "#ffffff",
                    opacity: halo * 0.42 * eased,
                    filter: "blur(4.5px)",
                    mixBlendMode: "soft-light",
                    transform: `translateY(${(1 - eased) * 7}px)`,
                  }}
                >
                  {ch}
                </span>
              ) : null}
            </span>
          );
        })}
      </p>
    </div>
  );
}

export type HeroBeatLayout = "sides" | "stack" | "diagonal";

export function HeroBeatTypography({
  left,
  right,
  leftAmount,
  rightAmount,
  leftSweep = 0,
  rightSweep = 0,
  accentRight = false,
  rightLines,
  layout = "sides",
  className,
}: {
  left: string;
  right: string;
  leftAmount: number;
  rightAmount: number;
  leftSweep?: number;
  rightSweep?: number;
  accentRight?: boolean;
  rightLines?: [string, string];
  /** sides = desktop L/R; stack = mobile top/bottom; diagonal = Acercá UL / Conectá BR */
  layout?: HeroBeatLayout;
  className?: string;
}) {
  const visible = leftAmount > 0.01 || rightAmount > 0.01;
  if (!visible) return null;

  const textSize = "text-[clamp(1.05rem,5.2vw,1.65rem)] md:text-[clamp(1.15rem,2.4vw,1.95rem)]";

  const rightBlock = rightLines ? (
    <div className="flex min-w-0 flex-col gap-0 leading-none">
      <HeroMotionText
        text={rightLines[0]}
        amount={rightAmount}
        sweep={rightSweep}
        align={layout === "sides" ? "left" : layout === "stack" ? "center" : "left"}
        accent={accentRight}
        className={cn("leading-[0.92] tracking-[-0.03em]", textSize)}
      />
      <HeroMotionText
        text={rightLines[1]}
        amount={Math.max(0, rightAmount - 0.06)}
        sweep={Math.max(0, rightSweep - 0.06)}
        align={layout === "sides" ? "left" : layout === "stack" ? "center" : "left"}
        stagger={0.026}
        accent={accentRight}
        className={cn("-mt-1 leading-[0.92] tracking-[-0.03em]", textSize)}
      />
    </div>
  ) : (
    <HeroMotionText
      text={right}
      amount={rightAmount}
      sweep={rightSweep}
      align={layout === "sides" ? "left" : layout === "stack" ? "center" : "right"}
      accent={accentRight}
      className={textSize}
    />
  );

  if (layout === "stack") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-5 pt-[max(7.25rem,25.5%)] pb-[22.5%]",
          className,
        )}
      >
        <div className="flex w-full justify-center">
          <HeroMotionText
            text={left}
            amount={leftAmount}
            sweep={leftSweep}
            align="center"
            className={textSize}
          />
        </div>
        <div className="flex w-full justify-center">{rightBlock}</div>
      </div>
    );
  }

  if (layout === "diagonal") {
    return (
      <div className={cn("pointer-events-none absolute inset-0 z-20", className)}>
        <div className="absolute left-4 top-[max(5.25rem,17.5%)] sm:left-6">
          <HeroMotionText
            text={left}
            amount={leftAmount}
            sweep={leftSweep}
            align="left"
            className={textSize}
          />
        </div>
        <div className="absolute right-4 top-[max(5.25rem,17.5%)] sm:right-6">
          {rightBlock}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-center justify-center",
        className,
      )}
    >
      <div className="grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_minmax(72px,0.55fr)_minmax(0,1.15fr)] items-center gap-3 px-4 sm:gap-12 sm:px-10 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.95fr)_minmax(0,1.15fr)] md:gap-12 lg:max-w-7xl lg:gap-16 lg:px-14">
        <HeroMotionText
          text={left}
          amount={leftAmount}
          sweep={leftSweep}
          align="right"
          className={textSize}
        />
        <div aria-hidden />
        {rightLines ? (
          <div className="flex min-w-0 translate-x-[calc(10%+14px)] flex-col items-start gap-0 text-left leading-none sm:translate-x-[calc(20%+20px)] md:translate-x-[calc(22%+24px)]">
            {rightBlock}
          </div>
        ) : (
          <div
            className="translate-x-[calc(10%+14px)] sm:translate-x-[calc(20%+20px)] md:translate-x-[calc(22%+24px)]"
            style={{ wordSpacing: "-0.12em" }}
          >
            {rightBlock}
          </div>
        )}
      </div>
    </div>
  );
}
