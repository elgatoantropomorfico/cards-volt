"use client";

import { TEMPLATE_CATALOG } from "@/lib/templates-meta";
import { cn } from "@/lib/utils";

function PreviewSwatch({ from, to, pill, dark }: { from: string; to: string; pill: string; dark?: boolean }) {
  return (
    <div className="relative h-full w-full" style={{ background: `linear-gradient(180deg, ${from}, ${to})` }}>
      <div className="absolute inset-x-3 top-3 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full" style={{ background: pill, opacity: 0.9 }} />
        <div className={cn("h-2 flex-1 rounded-full", dark ? "bg-white/30" : "bg-slate-900/20")} />
      </div>
      <div className="absolute inset-x-3 top-12 space-y-1.5">
        <div className={cn("h-1.5 w-3/4 rounded", dark ? "bg-white/40" : "bg-slate-900/25")} />
        <div className={cn("h-1.5 w-1/2 rounded", dark ? "bg-white/25" : "bg-slate-900/15")} />
      </div>
      <div className="absolute inset-x-3 bottom-3 space-y-1.5">
        <div className="h-3 rounded" style={{ background: pill, opacity: 0.85 }} />
        <div className={cn("h-2 rounded", dark ? "bg-white/15" : "bg-slate-900/10")} />
      </div>
    </div>
  );
}

export function TemplatesShowcase() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TEMPLATE_CATALOG.map((t) => (
        <div
          key={t.id}
          className="group overflow-hidden rounded-2xl border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop"
        >
          <div className="relative aspect-[4/5] overflow-hidden">
            <PreviewSwatch from={t.previewFrom} to={t.previewTo} pill={t.previewPill} dark={t.dark} />
          </div>
          <div className="flex items-start gap-2.5 p-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary">{t.icon}</span>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold">{t.name}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t.tagline}</div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">{t.niche}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
