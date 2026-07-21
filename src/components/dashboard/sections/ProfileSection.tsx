"use client";

import * as React from "react";
import { Loader2, Check, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { normalizeSlug } from "@/lib/utils";
import { updateProfile } from "@/server/profile-actions";
import type { ProfileView } from "@/lib/profile-types";

type SlugState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; slug: string }
  | { state: "unavailable"; slug: string }
  | { state: "invalid"; slug: string };

export function ProfileSection({
  profile,
  onChange,
  appHost,
}: {
  profile: ProfileView;
  onChange: (patch: Partial<ProfileView>) => void;
  appHost: string;
}) {
  const [slugState, setSlugState] = React.useState<SlugState>({ state: "idle" });
  const [pending, setPending] = React.useState(false);
  const initialSlugRef = React.useRef(profile.slug);

  React.useEffect(() => {
    const candidate = normalizeSlug(profile.slug);
    if (!candidate) return setSlugState({ state: "invalid", slug: candidate });
    if (candidate === initialSlugRef.current) return setSlugState({ state: "available", slug: candidate });

    setSlugState({ state: "checking" });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/slug-check?slug=${encodeURIComponent(candidate)}&excludeId=${profile.id}`, { signal: ctrl.signal });
        const data = await r.json();
        if (!data.valid) setSlugState({ state: "invalid", slug: candidate });
        else if (data.available) setSlugState({ state: "available", slug: candidate });
        else setSlugState({ state: "unavailable", slug: candidate });
      } catch {}
    }, 280);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [profile.slug, profile.id]);

  async function onSave() {
    if (slugState.state === "unavailable" || slugState.state === "invalid") {
      return toast({ title: "Slug no disponible", variant: "error" });
    }
    setPending(true);
    const res = await updateProfile({
      slug: normalizeSlug(profile.slug),
      fullName: profile.fullName,
      jobTitle: profile.jobTitle ?? "",
      companyName: profile.companyName ?? "",
      description: profile.description ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      website: profile.website ?? "",
      location: profile.location ?? "",
      instagram: profile.instagram ?? "",
      linkedin: profile.linkedin ?? "",
      twitter: profile.twitter ?? "",
      facebook: profile.facebook ?? "",
      youtube: profile.youtube ?? "",
      tiktok: profile.tiktok ?? "",
      github: profile.github ?? "",
      alias: profile.alias ?? "",
      showSaveContact: profile.showSaveContact !== false,
    });
    setPending(false);
    if (res.ok) {
      initialSlugRef.current = normalizeSlug(profile.slug);
      toast({ title: "Perfil guardado", variant: "success" });
    } else toast({ title: "Error", description: res.error, variant: "error" });
  }

  const slugIndicator =
    slugState.state === "checking" ? (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> verificando…</span>
    ) : slugState.state === "available" ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3 w-3" /> Disponible</span>
    ) : slugState.state === "unavailable" ? (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><X className="h-3 w-3" /> No disponible</span>
    ) : slugState.state === "invalid" ? (
      <span className="text-xs text-rose-600">3-40 caracteres, a-z 0-9 -</span>
    ) : null;

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidad pública</CardTitle>
          <CardDescription>Información que verán quienes escaneen tu tarjeta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="slug">URL pública</Label>
            <div className="flex overflow-hidden rounded-xl border bg-background shadow-soft">
              <span className="grid place-items-center border-r bg-secondary px-3 text-[12.5px] text-muted-foreground">
                {appHost}/
              </span>
              <input
                id="slug"
                value={profile.slug}
                onChange={(e) => onChange({ slug: e.target.value })}
                className="h-10 flex-1 bg-transparent px-3 text-sm outline-none"
                required
              />
            </div>
            <div className="h-4">{slugIndicator}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre completo" required>
              <Input value={profile.fullName} onChange={(e) => onChange({ fullName: e.target.value })} required />
            </Field>
            <Field label="Cargo">
              <Input value={profile.jobTitle ?? ""} onChange={(e) => onChange({ jobTitle: e.target.value })} />
            </Field>
            <Field label="Empresa">
              <Input value={profile.companyName ?? ""} onChange={(e) => onChange({ companyName: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={profile.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <Input value={profile.phone ?? ""} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+54 9 11 ..." />
            </Field>
            <Field label="WhatsApp">
              <Input value={profile.whatsapp ?? ""} onChange={(e) => onChange({ whatsapp: e.target.value })} placeholder="+54 9 11 ..." />
            </Field>
            <Field label="Sitio web">
              <Input value={profile.website ?? ""} onChange={(e) => onChange({ website: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Ubicación (dirección, ciudad)">
              <Input value={profile.location ?? ""} onChange={(e) => onChange({ location: e.target.value })} placeholder="Av. Corrientes 1234, CABA" />
            </Field>
          </div>

          <div className="space-y-2">
            <Label>Bio / Descripción</Label>
            <Textarea
              rows={3}
              value={profile.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Una frase corta sobre vos o tu rol."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Alias (opcional)">
              <Input
                value={profile.alias ?? ""}
                onChange={(e) => onChange({ alias: e.target.value })}
                placeholder="@mi.alias"
              />
              <p className="text-[11px] text-muted-foreground">
                Se muestra debajo de “Guardar contacto” y se copia al tocarlo.
              </p>
            </Field>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Botón guardar contacto</Label>
              <div className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-3 shadow-soft">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Mostrar botón grande</p>
                  <p className="text-[11px] text-muted-foreground">
                    Si lo apagás, queda como ícono junto a WhatsApp / teléfono / email.
                  </p>
                </div>
                <Switch
                  checked={profile.showSaveContact !== false}
                  onCheckedChange={(v) => onChange({ showSaveContact: v })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes sociales</CardTitle>
          <CardDescription>Aparecen como pills bajo el avatar. Podés usar el handle o la URL completa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Instagram"><Input value={profile.instagram ?? ""} onChange={(e) => onChange({ instagram: e.target.value })} placeholder="@usuario" /></Field>
            <Field label="LinkedIn"><Input value={profile.linkedin ?? ""} onChange={(e) => onChange({ linkedin: e.target.value })} placeholder="linkedin.com/in/usuario" /></Field>
            <Field label="X / Twitter"><Input value={profile.twitter ?? ""} onChange={(e) => onChange({ twitter: e.target.value })} placeholder="@usuario" /></Field>
            <Field label="Facebook"><Input value={profile.facebook ?? ""} onChange={(e) => onChange({ facebook: e.target.value })} placeholder="facebook.com/usuario" /></Field>
            <Field label="YouTube"><Input value={profile.youtube ?? ""} onChange={(e) => onChange({ youtube: e.target.value })} placeholder="youtube.com/@canal" /></Field>
            <Field label="TikTok"><Input value={profile.tiktok ?? ""} onChange={(e) => onChange({ tiktok: e.target.value })} placeholder="@usuario" /></Field>
            <Field label="GitHub"><Input value={profile.github ?? ""} onChange={(e) => onChange({ github: e.target.value })} placeholder="github.com/usuario" /></Field>
          </div>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur sm:static sm:inset-auto sm:border-0 sm:bg-transparent sm:p-0">
        <Button onClick={onSave} disabled={pending} variant="gradient" size="lg" className="w-full shadow-pop sm:w-auto">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
    </div>
  );
}
