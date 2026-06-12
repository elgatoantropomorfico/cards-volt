"use client";

import { ScaledPhonePreview } from "@/components/marketing/ScaledPhonePreview";
import { DEMO_LINKS, DEMO_PERSONAS, demoProfileFor } from "@/lib/demo-profile";
import type { Template, ThemeMode } from "@/lib/profile-types";
import { TEMPLATE_CATALOG, type TemplateMeta } from "@/lib/templates-meta";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

const SPAN: Partial<Record<Template, string>> = {
  MINIMAL: "sm:col-span-1",
  CORPORATE: "sm:col-span-1",
  NOIR: "sm:col-span-2 lg:col-span-1",
  BLOOM: "sm:col-span-2",
  STUDIO: "sm:col-span-1",
  NOVA: "sm:col-span-1",
  VIVID: "sm:col-span-2",
};

function ModePreview({
  template,
  mode,
  scale,
}: {
  template: Template;
  mode: ThemeMode;
  scale: number;
}) {
  const profile = demoProfileFor(template, mode);
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border bg-background/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
        {mode === "LIGHT" ? <Sun className="h-2.5 w-2.5" /> : <Moon className="h-2.5 w-2.5" />}
        {mode === "LIGHT" ? "Claro" : "Oscuro"}
      </span>
      <ScaledPhonePreview profile={profile} links={DEMO_LINKS} scale={scale} />
    </div>
  );
}

function TemplateCard({
  meta,
  featured,
  className,
}: {
  meta: TemplateMeta;
  featured?: boolean;
  className?: string;
}) {
  const persona = DEMO_PERSONAS[meta.id];
  const scale = featured ? 0.4 : 0.3;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-pop",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-50"
        style={{
          background: `linear-gradient(165deg, ${meta.previewFrom} 0%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-30"
        style={{ background: meta.previewPill }}
      />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-background/90 shadow-soft"
            style={{ color: meta.defaultColor }}
          >
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold sm:text-lg">{meta.name}</h3>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                {meta.niche.split("·")[0]?.trim()}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-[12px]">{meta.tagline}</p>
            <p className="mt-2 truncate text-[11px] font-medium" style={{ color: meta.defaultColor }}>
              {persona.fullName}
              <span className="font-normal text-muted-foreground"> · {persona.companyName}</span>
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-auto flex items-end justify-center pt-5",
            featured ? "gap-5 sm:gap-10" : "gap-1 sm:gap-3",
          )}
        >
          <ModePreview template={meta.id} mode="LIGHT" scale={scale} />
          <ModePreview template={meta.id} mode="DARK" scale={scale} />
        </div>
      </div>
    </article>
  );
}

export function TemplatesShowcase() {
  const featured = TEMPLATE_CATALOG.find((t) => t.id === "PREMIUM")!;
  const rest = TEMPLATE_CATALOG.filter((t) => t.id !== "PREMIUM");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="rounded-full border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft">
          8 plantillas · 2 modos cada una
        </span>
        <span className="rounded-full bg-gradient-to-r from-violet-600/15 to-fuchsia-600/15 px-3 py-1 text-[11px] font-semibold text-foreground">
          16 looks distintos
        </span>
      </div>

      <TemplateCard
        meta={featured}
        featured
        className="border-violet-500/25 bg-gradient-to-br from-violet-500/[0.07] via-card to-fuchsia-500/[0.06] lg:min-h-[420px]"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((meta) => (
          <TemplateCard key={meta.id} meta={meta} className={cn("min-h-[340px]", SPAN[meta.id])} />
        ))}
      </div>
    </div>
  );
}
