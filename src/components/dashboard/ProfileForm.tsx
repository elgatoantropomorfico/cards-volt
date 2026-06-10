"use client";

import * as React from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/server/profile-actions";
import { toast } from "@/components/ui/toaster";
import { normalizeSlug } from "@/lib/utils";

type Initial = {
  id: string;
  slug: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
};

type SlugState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; slug: string }
  | { state: "unavailable"; slug: string }
  | { state: "invalid"; slug: string };

export function ProfileForm({ initial }: { initial: Initial }) {
  const [form, setForm] = React.useState(initial);
  const [slugState, setSlugState] = React.useState<SlugState>({ state: "idle" });
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const candidate = normalizeSlug(form.slug);
    if (!candidate) return setSlugState({ state: "invalid", slug: candidate });
    if (candidate === initial.slug) return setSlugState({ state: "available", slug: candidate });

    setSlugState({ state: "checking" });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/slug-check?slug=${encodeURIComponent(candidate)}&excludeId=${initial.id}`, { signal: ctrl.signal });
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
  }, [form.slug, initial.slug, initial.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugState.state === "unavailable" || slugState.state === "invalid") {
      toast({ title: "Slug no disponible", variant: "error" });
      return;
    }
    setPending(true);
    const res = await updateProfile({
      ...form,
      slug: normalizeSlug(form.slug),
    });
    setPending(false);
    if (res.ok) toast({ title: "Perfil guardado", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  const slugIndicator = (() => {
    if (slugState.state === "checking") return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> verificando…</span>;
    if (slugState.state === "available") return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3 w-3" /> Usuario disponible</span>;
    if (slugState.state === "unavailable") return <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><X className="h-3 w-3" /> Usuario no disponible</span>;
    if (slugState.state === "invalid") return <span className="text-xs text-rose-600">Slug inválido (3-40 caracteres, a-z 0-9 -)</span>;
    return null;
  })();

  return (
    <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="slug">URL pública</Label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-md border border-r-0 bg-slate-50 px-3 text-sm text-slate-500">
            cards.voltaiagents.com/
          </span>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="rounded-l-none"
            required
          />
        </div>
        <div className="h-4">{slugIndicator}</div>
      </div>

      <Field label="Nombre completo" required>
        <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
      </Field>
      <Field label="Cargo">
        <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
      </Field>
      <Field label="Empresa">
        <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
      </Field>
      <Field label="Email">
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label="Teléfono">
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+54 9 11 ..." />
      </Field>
      <Field label="WhatsApp">
        <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+54 9 11 ..." />
      </Field>
      <Field label="Sitio web">
        <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
      </Field>
      <div className="space-y-2 md:col-span-2">
        <Label>Descripción</Label>
        <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar cambios
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? " *" : ""}</Label>
      {children}
    </div>
  );
}
