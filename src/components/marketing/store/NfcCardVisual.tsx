"use client";

import { Nfc, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export function NfcCardVisual({
  variant,
  className,
}: {
  variant: "white" | "black";
  className?: string;
}) {
  const isWhite = variant === "white";

  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] w-[min(100%,320px)] select-none",
        className,
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-[18px] blur-2xl transition-opacity",
          isWhite ? "bg-neutral-300/40" : "bg-violet-900/30",
        )}
        style={{ transform: "translateZ(-40px) scale(0.92)" }}
      />

      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-[18px] border p-[1px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)]",
          isWhite
            ? "border-white/80 bg-gradient-to-br from-white via-neutral-100 to-neutral-200"
            : "border-white/10 bg-gradient-to-br from-neutral-700 via-neutral-900 to-black",
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className={cn(
            "relative flex h-full flex-col justify-between overflow-hidden rounded-[17px] p-6",
            isWhite
              ? "bg-gradient-to-br from-white via-neutral-50 to-neutral-100"
              : "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-0 opacity-60",
              isWhite
                ? "bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.08),transparent_45%)]"
                : "bg-[radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.22),transparent_50%)]",
            )}
          />
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
            style={{
              background: isWhite ? "rgba(124,58,237,0.12)" : "rgba(236,72,153,0.18)",
            }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl font-display text-lg font-bold shadow-soft",
                  isWhite ? "bg-foreground text-background" : "bg-white text-neutral-950",
                )}
              >
                V
              </span>
              <div>
                <p
                  className={cn(
                    "font-display text-sm font-semibold tracking-tight",
                    isWhite ? "text-neutral-900" : "text-white",
                  )}
                >
                  Volt Cards
                </p>
                <p className={cn("text-[10px] uppercase tracking-[0.2em]", isWhite ? "text-neutral-400" : "text-white/45")}>
                  NFC · QR
                </p>
              </div>
            </div>
            <Nfc className={cn("h-5 w-5", isWhite ? "text-neutral-300" : "text-white/25")} />
          </div>

          <div className="relative flex items-end justify-between">
            <div className={cn("space-y-1", isWhite ? "text-neutral-500" : "text-white/35")}>
              <p className="text-[9px] font-medium uppercase tracking-[0.25em]">Tap to connect</p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn("h-1 rounded-full", isWhite ? "bg-neutral-300" : "bg-white/20")}
                    style={{ width: `${12 + i * 8}px` }}
                  />
                ))}
              </div>
            </div>
            <div
              className={cn(
                "grid h-11 w-11 place-items-center rounded-lg border",
                isWhite ? "border-neutral-200 bg-white/80 text-neutral-400" : "border-white/10 bg-white/5 text-white/40",
              )}
            >
              <QrCode className="h-5 w-5" />
            </div>
          </div>

          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent",
              !isWhite && "via-white/5",
            )}
          />
        </div>
      </div>
    </div>
  );
}
