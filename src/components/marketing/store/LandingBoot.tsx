"use client";

import * as React from "react";
import { VoltLoader } from "./VoltLoader";
import { cn } from "@/lib/utils";

type LandingBootCtx = {
  markHeroReady: () => void;
};

const LandingBootContext = React.createContext<LandingBootCtx | null>(null);

export function useLandingBoot() {
  return React.useContext(LandingBootContext);
}

export function LandingBootProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [fadeOut, setFadeOut] = React.useState(false);

  const markHeroReady = React.useCallback(() => {
    setFadeOut(true);
    window.setTimeout(() => setReady(true), 380);
  }, []);

  React.useEffect(() => {
    if (ready) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [ready]);

  // Safety: never block the page forever
  React.useEffect(() => {
    const t = window.setTimeout(() => markHeroReady(), 8000);
    return () => window.clearTimeout(t);
  }, [markHeroReady]);

  const value = React.useMemo(() => ({ markHeroReady }), [markHeroReady]);

  return (
    <LandingBootContext.Provider value={value}>
      {children}
      {!ready ? (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300",
            fadeOut ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          aria-busy="true"
          aria-live="polite"
        >
          {/* Blurred page underneath + white veil at 90% */}
          <div
            aria-hidden
            className="absolute inset-0 bg-white/90 backdrop-blur-md"
          />
          <VoltLoader size={64} label="Cargando Volt Cards" className="relative z-[1]" />
        </div>
      ) : null}
    </LandingBootContext.Provider>
  );
}
