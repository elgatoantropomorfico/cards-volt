"use client";

import * as React from "react";
import { ScaledPhonePreview } from "@/components/marketing/ScaledPhonePreview";
import { DEMO_LINKS, demoProfileFor } from "@/lib/demo-profile";
import type { ThemeMode } from "@/lib/profile-types";
import { TEMPLATE_CATALOG, type TemplateMeta } from "@/lib/templates-meta";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";

function ThemeToggle({
  mode,
  onChange,
}: {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border bg-background p-0.5 shadow-soft">
      <button
        type="button"
        onClick={() => onChange("LIGHT")}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
          mode === "LIGHT"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={mode === "LIGHT"}
      >
        <Sun className="h-3 w-3" />
        Claro
      </button>
      <button
        type="button"
        onClick={() => onChange("DARK")}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
          mode === "DARK"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={mode === "DARK"}
      >
        <Moon className="h-3 w-3" />
        Oscuro
      </button>
    </div>
  );
}

function TemplateCard({ meta }: { meta: TemplateMeta }) {
  const [mode, setMode] = React.useState<ThemeMode>(meta.dark ? "DARK" : "LIGHT");
  const profile = React.useMemo(() => demoProfileFor(meta.id, mode), [meta.id, mode]);

  return (
    <div className="group h-full overflow-hidden rounded-2xl border bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-violet-500/25 hover:shadow-pop">
      <div className="relative flex flex-col items-center overflow-hidden bg-secondary/20 px-2 pb-3.5 pt-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <ScaledPhonePreview profile={profile} links={DEMO_LINKS} scale={0.32} />
        <div className="relative mt-2.5">
          <ThemeToggle mode={mode} onChange={setMode} />
        </div>
      </div>
      <div className="flex items-start gap-2.5 p-3.5">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary transition group-hover:bg-violet-500/10"
          style={{ color: meta.defaultColor }}
        >
          {meta.icon}
        </span>
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold">{meta.name}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{meta.tagline}</div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">{meta.niche}</div>
        </div>
      </div>
    </div>
  );
}

export function TemplatesShowcase() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(true);

  const updateArrows = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }, []);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  function scrollByPage(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-slide]");
    const step = slide ? slide.offsetWidth + 12 : el.clientWidth * 0.85;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background via-background/80 to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background via-background/80 to-transparent sm:w-16" />

      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={!canPrev}
        aria-label="Plantillas anteriores"
        className={cn(
          "absolute left-1 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border bg-background/90 shadow-soft backdrop-blur transition hover:bg-card sm:left-3 sm:h-10 sm:w-10",
          !canPrev && "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={!canNext}
        aria-label="Plantillas siguientes"
        className={cn(
          "absolute right-1 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border bg-background/90 shadow-soft backdrop-blur transition hover:bg-card sm:right-3 sm:h-10 sm:w-10",
          !canNext && "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div
        ref={trackRef}
        className={cn(
          "flex gap-3 overflow-x-auto overscroll-x-contain px-1 py-1",
          "scroll-smooth snap-x snap-mandatory",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {TEMPLATE_CATALOG.map((meta) => (
          <div
            key={meta.id}
            data-slide
            className="w-[calc(100%-0.5rem)] shrink-0 snap-start sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
          >
            <TemplateCard meta={meta} />
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Deslizá o usá las flechas · {TEMPLATE_CATALOG.length} plantillas
      </p>
    </div>
  );
}
