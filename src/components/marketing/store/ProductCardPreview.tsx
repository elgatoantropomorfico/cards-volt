"use client";

import * as React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { productFrontSrc } from "./ProductThumb";

const CardScene = dynamic(
  () => import("./cards3d/CardScene").then((m) => m.CardScene),
  { ssr: false },
);

/**
 * Catalog preview: paints the PNG instantly, then optionally upgrades to 3D
 * when the canvas is ready — so the offer cards never feel empty/slow.
 */
export function ProductCardPreview({
  variant,
  className,
  enable3d = true,
  priority = false,
}: {
  variant: "white" | "black";
  className?: string;
  /** If false, only shows the static PNG (fastest). */
  enable3d?: boolean;
  priority?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [ready3d, setReady3d] = React.useState(false);

  React.useEffect(() => {
    if (!enable3d) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enable3d]);

  return (
    <div
      ref={ref}
      className={cn("relative mx-auto h-[220px] w-full max-w-[320px] overflow-hidden sm:h-[240px]", className)}
    >
      {/* Instant static layer — always painted first */}
      <div
        className={cn(
          "absolute inset-0 z-0 flex items-center justify-center transition-opacity duration-500",
          ready3d ? "opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        <div className="relative h-[85%] w-[78%]">
          <Image
            src={productFrontSrc(variant)}
            alt={variant === "white" ? "Tarjeta blanca Volt" : "Tarjeta negra Volt"}
            fill
            sizes="320px"
            priority={priority}
            className="object-contain drop-shadow-xl"
          />
        </div>
      </div>

      {enable3d && visible ? (
        <CardScene
          mode="static"
          variant={variant}
          className={cn(
            "absolute inset-0 z-10 transition-opacity duration-500",
            ready3d ? "opacity-100" : "opacity-0",
          )}
          onReady={() => setReady3d(true)}
        />
      ) : null}
    </div>
  );
}
