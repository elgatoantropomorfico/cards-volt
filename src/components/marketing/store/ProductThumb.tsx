"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const FRONT: Record<"white" | "black", string> = {
  white: "/cards/front-white.png",
  black: "/cards/front-black.png",
};

/**
 * Static product thumbnail — instant paint, no WebGL.
 * Use in cart, checkout, admin and any compact UI.
 */
export function ProductThumb({
  variant,
  className,
  priority = false,
  alt,
}: {
  variant: "white" | "black";
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        variant === "white" ? "bg-neutral-100" : "bg-neutral-900",
        className,
      )}
    >
      <Image
        src={FRONT[variant]}
        alt={alt ?? (variant === "white" ? "Tarjeta blanca Volt" : "Tarjeta negra Volt")}
        fill
        sizes="(max-width: 768px) 40vw, 200px"
        priority={priority}
        className="object-contain p-1.5 drop-shadow-md"
      />
    </div>
  );
}

export function productFrontSrc(variant: "white" | "black") {
  return FRONT[variant];
}
