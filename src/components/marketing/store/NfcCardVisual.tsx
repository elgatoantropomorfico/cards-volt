"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Deterministic QR-like pattern for card back preview */
const QR_GRID = [
  "11111110010",
  "10000010010",
  "10111010010",
  "10111010010",
  "10111010010",
  "10000010000",
  "11111110111",
  "00000001001",
  "10110111010",
  "10010010101",
  "11111111011",
];

function QrFace({ variant }: { variant: "white" | "black" }) {
  const isWhite = variant === "white";
  return (
    <div className="flex h-full w-full items-center justify-center p-6 sm:p-8">
      <div
        className={cn(
          "grid aspect-square w-[62%] grid-cols-11 grid-rows-11 gap-[2px] rounded-lg p-2",
          isWhite ? "bg-white" : "bg-neutral-950",
        )}
      >
        {QR_GRID.flatMap((row, y) =>
          row.split("").map((cell, x) => (
            <span
              key={`${x}-${y}`}
              className={cn(
                "rounded-[1px]",
                cell === "1"
                  ? isWhite
                    ? "bg-neutral-900"
                    : "bg-white"
                  : isWhite
                    ? "bg-white"
                    : "bg-neutral-950",
              )}
            />
          )),
        )}
      </div>
    </div>
  );
}

export function NfcCardVisual({
  variant,
  size = "default",
  className,
  onFlipChange,
}: {
  variant: "white" | "black";
  size?: "default" | "hero";
  className?: string;
  onFlipChange?: (flipped: boolean) => void;
}) {
  const isWhite = variant === "white";
  const [flipped, setFlipped] = React.useState(false);

  function handleEnter() {
    setFlipped(true);
    onFlipChange?.(true);
  }

  function handleLeave() {
    setFlipped(false);
    onFlipChange?.(false);
  }

  return (
    <div
      className={cn(
        "relative shrink-0 select-none [perspective:1200px]",
        size === "hero" ? "w-[248px] sm:w-[272px]" : "w-full max-w-[260px]",
        className,
      )}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      {/* Hit area extra — evita perder hover durante el giro */}
      <div className="relative aspect-[1.586/1] w-full p-1">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[18px] blur-2xl transition-opacity duration-500",
            flipped ? "opacity-80" : "opacity-40",
            isWhite ? "bg-neutral-300/35" : "bg-violet-900/25",
          )}
        />

        <div
          className={cn(
            "relative h-full w-full rounded-[18px] border p-[1px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] [transform-style:preserve-3d]",
            "transition-transform duration-700 ease-out will-change-transform",
            isWhite
              ? "border-white/80 bg-gradient-to-br from-white via-neutral-100 to-neutral-200"
              : "border-white/10 bg-gradient-to-br from-neutral-700 via-neutral-900 to-black",
          )}
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front — logo */}
          <div
            className={cn(
              "absolute inset-0 overflow-hidden rounded-[17px] [backface-visibility:hidden]",
              isWhite
                ? "bg-gradient-to-br from-white via-neutral-50 to-neutral-100"
                : "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black",
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0",
                isWhite
                  ? "bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.06),transparent_55%)]"
                  : "bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.15),transparent_55%)]",
              )}
            />
            <div className="relative flex h-full flex-col items-center justify-center gap-3">
              <span
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-bold shadow-soft sm:h-16 sm:w-16 sm:text-3xl",
                  isWhite ? "bg-foreground text-background" : "bg-white text-neutral-950",
                )}
              >
                V
              </span>
              <p
                className={cn(
                  "font-display text-sm font-semibold tracking-tight sm:text-base",
                  isWhite ? "text-neutral-800" : "text-white/90",
                )}
              >
                Volt Cards
              </p>
            </div>
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent",
                !isWhite && "via-white/5",
              )}
            />
          </div>

          {/* Back — QR only */}
          <div
            className={cn(
              "absolute inset-0 overflow-hidden rounded-[17px] [backface-visibility:hidden] [transform:rotateY(180deg)]",
              isWhite
                ? "bg-gradient-to-br from-neutral-50 to-neutral-100"
                : "bg-gradient-to-br from-neutral-950 to-black",
            )}
          >
            <QrFace variant={variant} />
          </div>
        </div>
      </div>
    </div>
  );
}
