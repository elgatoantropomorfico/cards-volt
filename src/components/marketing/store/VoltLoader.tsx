"use client";

import { cn } from "@/lib/utils";

export function VoltLoader({
  className,
  size = 56,
  label = "Cargando",
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  const ring = size + 14;

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: ring, height: ring }}
      role="status"
      aria-label={label}
    >
      <span
        aria-hidden
        className="absolute inset-0 animate-volt-spin rounded-full border-2 border-transparent border-t-[#7b73ff] border-r-[#7b73ff]/40"
      />
      <img
        src="/brand/volt-mark.png"
        alt=""
        width={size}
        height={size}
        className="relative z-[1] h-auto w-auto rounded-full"
        style={{ width: size, height: size }}
        draggable={false}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
