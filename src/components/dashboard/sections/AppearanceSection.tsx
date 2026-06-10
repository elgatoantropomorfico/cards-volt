"use client";

import * as React from "react";
import { Loader2, Save, Sun, Moon, Sparkles, LayoutPanelTop, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { ImageUpload } from "../ImageUpload";
import type { ProfileView, Template, ThemeMode } from "@/lib/profile-types";
import { updateAppearance } from "@/server/profile-actions";
import { cn } from "@/lib/utils";

const PRESETS = ["#0F172A", "#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#E11D48"];

const TEMPLATES: { id: Template; name: string; tagline: string; icon: React.ReactNode; preview: React.ReactNode }[] = [
  {
    id: "MINIMAL",
    name: "Minimal",
    tagline: "Outlined · estilo Linktree refinado",
    icon: <Sparkles className="h-4 w-4" />,
    preview: <PreviewSwatch from="#fafafa" to="#fafafa" pill="#0F172A" />,
  },
  {
    id: "PREMIUM",
    name: "Premium",
    tagline: "HiHello / Popl · arco curvo, dramático",
    icon: <LayoutPanelTop className="h-4 w-4" />,
    preview: <PreviewSwatch from="#070710" to="#1a0e3a" pill="#A855F7" dark />,
  },
  {
    id: "CORPORATE",
    name: "Corporate",
    tagline: "Ejecutivo · clásico, sobrio",
    icon: <Building2 className="h-4 w-4" />,
    preview: <PreviewSwatch from="#ffffff" to="#f1f5f9" pill="#1E3A8A" />,
  },
];

export function AppearanceSection({
  profile,
  onChange,
}: {
  profile: ProfileView;
  onChange: (patch: Partial<ProfileView>) => void;
}) {
  const [pending, setPending] = React.useState(false);

  async function onSave() {
    setPending(true);
    const res = await updateAppearance({
      template: profile.template,
      primaryColor: profile.primaryColor,
      themeMode: profile.themeMode,
      avatarUrl: profile.avatarUrl ?? "",
      coverUrl: profile.coverUrl ?? "",
    });
    setPending(false);
    if (res.ok) toast({ title: "Apariencia guardada", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plantilla</CardTitle>
          <CardDescription>El cambio se ve en la vista previa al instante.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPLATES.map((t) => {
              const active = profile.template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange({ template: t.id })}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-card p-4 text-left transition",
                    active ? "border-foreground shadow-pop ring-2 ring-foreground/10" : "hover:border-foreground/30",
                  )}
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-xl">{t.preview}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-md",
                        active ? "bg-foreground text-background" : "bg-secondary text-foreground",
                      )}
                    >
                      {t.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-tight">{t.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{t.tagline}</div>
                    </div>
                  </div>
                  {active && (
                    <motion.div
                      layoutId="tmpl-active-dot"
                      className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-foreground"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color & tema</CardTitle>
          <CardDescription>Acento que define botones, badges y detalles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Acento</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange({ primaryColor: p })}
                  className={cn(
                    "relative h-9 w-9 rounded-full ring-offset-background transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    profile.primaryColor.toLowerCase() === p.toLowerCase() && "ring-2 ring-foreground ring-offset-2",
                  )}
                  style={{ background: p }}
                  aria-label={p}
                />
              ))}
              <label className="ml-2 inline-flex items-center gap-2 rounded-xl border bg-background px-2 py-1.5 shadow-soft">
                <input
                  type="color"
                  value={profile.primaryColor}
                  onChange={(e) => onChange({ primaryColor: e.target.value })}
                  className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <Input
                  value={profile.primaryColor}
                  onChange={(e) => onChange({ primaryColor: e.target.value })}
                  className="h-8 w-[110px] font-mono text-xs"
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Modo</Label>
            <div className="inline-flex rounded-xl border bg-card p-1 shadow-soft">
              {(["LIGHT", "DARK"] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange({ themeMode: m })}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition",
                    profile.themeMode === m ? "bg-foreground text-background shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "LIGHT" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {m === "LIGHT" ? "Claro" : "Oscuro"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Claro u oscuro según plantilla. Premium alterna gradiente acento → fondo; Minimal y Corporate respetan el modo elegido.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
          <CardDescription>El avatar es obligatorio para que tu tarjeta luzca bien.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Foto de perfil</Label>
              <ImageUpload value={profile.avatarUrl} onChange={(v) => onChange({ avatarUrl: v })} folder="avatars" shape="circle" hint="Recomendado 512×512px, formato PNG/JPG." />
            </div>
            <div className="space-y-2">
              <Label>Portada / Logo de empresa</Label>
              <ImageUpload value={profile.coverUrl} onChange={(v) => onChange({ coverUrl: v })} folder="covers" shape="cover" hint="Portada horizontal 2:1 para Premium y Corporate." />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button onClick={onSave} disabled={pending} variant="gradient" size="lg" className="shadow-pop">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar apariencia
        </Button>
      </div>
    </div>
  );
}

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
        <div className={cn("h-2 rounded", dark ? "bg-white/15" : "bg-slate-900/10")} />
      </div>
    </div>
  );
}
