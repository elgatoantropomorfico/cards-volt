"use client";

import * as React from "react";
import { CardScene } from "./cards3d/CardScene";
import { cn } from "@/lib/utils";

export function ProductCardPreview({
  variant,
  className,
}: {
  variant: "white" | "black";
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative mx-auto h-[220px] w-full max-w-[320px] overflow-hidden sm:h-[240px]", className)}
    >
      {!ready ? (
        <div className="absolute inset-0 z-10 grid place-items-center">
          <span className="sr-only">Cargando tarjeta</span>
        </div>
      ) : null}

      {visible ? (
        <CardScene
          mode="static"
          variant={variant}
          className={cn(
            "absolute inset-0 z-10 transition-opacity duration-300",
            ready ? "opacity-100" : "opacity-0",
          )}
          onReady={() => setReady(true)}
        />
      ) : null}
    </div>
  );
}
