"use client";

import * as React from "react";
import { ScaledPhonePreview } from "@/components/marketing/ScaledPhonePreview";
import { DEMO_LINKS, demoProfileFor } from "@/lib/demo-profile";
import type { ThemeMode } from "@/lib/profile-types";
import { TEMPLATE_CATALOG, type TemplateMeta } from "@/lib/templates-meta";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

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
    <div className="group overflow-hidden rounded-2xl border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative flex flex-col items-center overflow-hidden bg-secondary/25 px-2 pb-3.5 pt-4">
        <ScaledPhonePreview profile={profile} links={DEMO_LINKS} scale={0.34} />
        <div className="mt-2.5">
          <ThemeToggle mode={mode} onChange={setMode} />
        </div>
      </div>
      <div className="flex items-start gap-2.5 p-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary">{meta.icon}</span>
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
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TEMPLATE_CATALOG.map((meta) => (
        <TemplateCard key={meta.id} meta={meta} />
      ))}
    </div>
  );
}
