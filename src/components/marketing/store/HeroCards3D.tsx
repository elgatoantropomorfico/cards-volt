"use client";

import * as React from "react";
import { CardScene } from "./cards3d/CardScene";
import { useLandingBoot } from "./LandingBoot";
import { cn } from "@/lib/utils";

export function HeroCards3D({
  fill = false,
  className,
}: {
  fill?: boolean;
  className?: string;
}) {
  const boot = useLandingBoot();
  const [ready, setReady] = React.useState(false);
  const [mountScene, setMountScene] = React.useState(false);
  const signaled = React.useRef(false);

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setMountScene(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const handleReady = React.useCallback(() => {
    setReady(true);
    if (!signaled.current) {
      signaled.current = true;
      boot?.markHeroReady();
    }
  }, [boot]);

  return (
    <div
      className={cn(
        "relative w-full",
        ready ? "overflow-visible" : "overflow-hidden",
        className
          ? className
          : cn(
              "w-[min(100%,780px)] sm:w-[min(100%,820px)] lg:w-[min(100%,880px)]",
              "-mx-3 sm:-mx-1 md:-mr-6 lg:-mr-8",
              fill
                ? "h-[min(580px,70vh)] lg:h-[min(640px,74vh)]"
                : "h-[min(440px,78vw)] sm:h-[480px]",
            ),
      )}
    >
      {mountScene ? (
        <CardScene
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            ready ? "opacity-100 overflow-visible" : "opacity-0 overflow-hidden",
          )}
          mode="hero"
          onReady={handleReady}
        />
      ) : null}
    </div>
  );
}
