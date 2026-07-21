"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight, Check, Plus, Trash2, Sparkles, User, Palette, Link as LinkIco, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { createUserFull } from "@/server/admin-actions";
import { cn, normalizeSlug } from "@/lib/utils";
import { SOCIALS, normalizeLinkUrl, detectKind } from "@/lib/socials";
import { TEMPLATE_CATALOG } from "@/lib/templates-meta";
import type { LinkKind, Template, ThemeMode } from "@/lib/profile-types";

type Role = "SUPERADMIN" | "USER";

const STEPS = [
  { id: "account", label: "Cuenta", icon: <Shield className="h-3.5 w-3.5" /> },
  { id: "profile", label: "Perfil", icon: <User className="h-3.5 w-3.5" /> },
  { id: "appearance", label: "Apariencia", icon: <Palette className="h-3.5 w-3.5" /> },
  { id: "links", label: "Enlaces", icon: <LinkIco className="h-3.5 w-3.5" /> },
  { id: "review", label: "Revisión", icon: <Check className="h-3.5 w-3.5" /> },
] as const;

type Step = typeof STEPS[number]["id"];

const PRESETS = ["#0F172A", "#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#E11D48"];

export function CreateUserWizard({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("account");
  const [pending, setPending] = React.useState(false);
  const stepIdx = STEPS.findIndex((s) => s.id === step);

  const [data, setData] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as Role,
    slug: "",
    jobTitle: "",
    companyName: "",
    description: "",
    phone: "",
    whatsapp: "",
    website: "",
    location: "",
    instagram: "",
    linkedin: "",
    twitter: "",
    avatarUrl: "" as string | null,
    coverUrl: "" as string | null,
    alias: "",
    showSaveContact: true,
    template: "MINIMAL" as Template,
    primaryColor: "#7C3AED",
    themeMode: "LIGHT" as ThemeMode,
    links: [] as { kind: LinkKind; label: string; url: string }[],
  });

  function reset() {
    setData({
      name: "",
      email: "",
      password: "",
      role: "USER",
      slug: "",
      jobTitle: "",
      companyName: "",
      description: "",
      phone: "",
      whatsapp: "",
      website: "",
      location: "",
      instagram: "",
      linkedin: "",
      twitter: "",
      avatarUrl: "",
      coverUrl: "",
      alias: "",
      showSaveContact: true,
      template: "MINIMAL",
      primaryColor: "#7C3AED",
      themeMode: "LIGHT",
      links: [],
    });
    setStep("account");
  }

  React.useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (!data.slug && data.name) {
      setData((d) => ({ ...d, slug: normalizeSlug(d.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.name]);

  function go(dir: 1 | -1) {
    const next = STEPS[stepIdx + dir];
    if (next) setStep(next.id);
  }

  function canNext(): true | string {
    if (step === "account") {
      if (!data.name.trim()) return "Falta el nombre";
      if (!/^\S+@\S+\.\S+$/.test(data.email)) return "Email inválido";
      if (data.password.length < 8) return "Contraseña mínima 8 caracteres";
    }
    if (step === "profile") {
      if (!data.slug.trim()) return "Slug requerido";
    }
    return true;
  }

  function tryNext() {
    const ok = canNext();
    if (ok !== true) return toast({ title: ok, variant: "error" });
    go(1);
  }

  async function onFinish() {
    setPending(true);
    const res = await createUserFull({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      profile: {
        slug: normalizeSlug(data.slug || data.name),
        jobTitle: data.jobTitle || null,
        companyName: data.companyName || null,
        description: data.description || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        location: data.location || null,
        instagram: data.instagram || null,
        linkedin: data.linkedin || null,
        twitter: data.twitter || null,
        avatarUrl: data.avatarUrl || null,
        coverUrl: data.coverUrl || null,
        alias: data.alias || null,
        showSaveContact: data.showSaveContact,
        template: data.template,
        primaryColor: data.primaryColor,
        themeMode: data.themeMode,
      },
      links: data.links.map((l) => ({ kind: l.kind, label: l.label, url: normalizeLinkUrl(l.kind, l.url) })),
    });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    toast({ title: "Usuario creado", description: `Perfil /${res.slug}`, variant: "success" });
    setOpen(false);
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="gradient">
            <Sparkles className="h-4 w-4" /> Nuevo usuario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg" className="p-0 sm:max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
          {/* Sidebar steps */}
          <aside className="hidden border-r bg-gradient-to-b from-secondary/80 to-secondary/30 p-5 sm:block">
            <div className="mb-6 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background"><Sparkles className="h-3.5 w-3.5" /></span>
              <div>
                <div className="font-display text-sm font-semibold leading-tight">Asistente</div>
                <div className="text-[11px] text-muted-foreground">Alta completa en un flujo</div>
              </div>
            </div>
            <ol className="space-y-1.5">
              {STEPS.map((s, i) => {
                const active = step === s.id;
                const done = i < stepIdx;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => i <= stepIdx && setStep(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition",
                        active && "bg-background shadow-soft font-medium",
                        done && !active && "text-muted-foreground hover:bg-background/60",
                        !done && !active && "text-muted-foreground/70",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-md border text-[11px] font-medium",
                          active ? "bg-foreground text-background border-foreground" : done ? "bg-emerald-500 text-white border-emerald-500" : "bg-background",
                        )}
                      >
                        {done ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="flex min-h-[520px] flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary">{STEPS[stepIdx].icon}</span>
                <div>
                  <div className="font-display text-base font-semibold leading-tight">{STEPS[stepIdx].label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Paso {stepIdx + 1} de {STEPS.length}
                  </div>
                </div>
              </div>
              <div className="hidden text-[11px] text-muted-foreground sm:block">
                Todo es opcional excepto Cuenta y Slug
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === "account" && (
                    <div className="grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nombre completo *">
                          <Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} required />
                        </Field>
                        <Field label="Email *">
                          <Input type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} required />
                        </Field>
                        <Field label="Contraseña inicial *">
                          <Input type="text" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} placeholder="mín. 8 caracteres" />
                        </Field>
                        <Field label="Rol">
                          <Select value={data.role} onValueChange={(v) => setData({ ...data, role: v as Role })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">Usuario</SelectItem>
                              <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    </div>
                  )}

                  {step === "profile" && (
                    <div className="grid gap-4">
                      <Field label="Slug público *" hint="La URL será cards.voltaiagents.com/{slug}">
                        <Input value={data.slug} onChange={(e) => setData({ ...data, slug: normalizeSlug(e.target.value) })} />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Cargo"><Input value={data.jobTitle} onChange={(e) => setData({ ...data, jobTitle: e.target.value })} /></Field>
                        <Field label="Empresa (texto público)"><Input value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} /></Field>
                        <Field label="Teléfono"><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} /></Field>
                        <Field label="WhatsApp"><Input value={data.whatsapp} onChange={(e) => setData({ ...data, whatsapp: e.target.value })} /></Field>
                        <Field label="Sitio web"><Input value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} /></Field>
                        <Field label="Ubicación"><Input value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} /></Field>
                      </div>
                      <Field label="Bio">
                        <Textarea rows={3} value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Alias"><Input value={data.alias} onChange={(e) => setData({ ...data, alias: e.target.value })} placeholder="@mi.alias" /></Field>
                        <div className="flex items-center justify-between rounded-xl border bg-secondary/30 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">Botón guardar contacto</p>
                            <p className="text-xs text-muted-foreground">Off = ícono en pills</p>
                          </div>
                          <Switch checked={data.showSaveContact} onCheckedChange={(v) => setData({ ...data, showSaveContact: v })} />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Instagram"><Input value={data.instagram} onChange={(e) => setData({ ...data, instagram: e.target.value })} placeholder="@user" /></Field>
                        <Field label="LinkedIn"><Input value={data.linkedin} onChange={(e) => setData({ ...data, linkedin: e.target.value })} placeholder="linkedin.com/in/user" /></Field>
                        <Field label="X / Twitter"><Input value={data.twitter} onChange={(e) => setData({ ...data, twitter: e.target.value })} placeholder="@user" /></Field>
                      </div>
                    </div>
                  )}

                  {step === "appearance" && (
                    <div className="grid gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Plantilla</Label>
                        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
                          {TEMPLATE_CATALOG.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setData({ ...data, template: t.id, primaryColor: t.defaultColor })}
                              className={cn(
                                "rounded-xl border bg-card p-2.5 text-left transition",
                                data.template === t.id ? "border-foreground shadow-pop" : "hover:border-foreground/30",
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="grid h-6 w-6 place-items-center rounded-md bg-secondary">{t.icon}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-medium">{t.name}</div>
                                  <div className="truncate text-[10px] text-muted-foreground">{t.niche}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Color principal</Label>
                        <div className="flex flex-wrap items-center gap-2">
                          {PRESETS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setData({ ...data, primaryColor: p })}
                              className={cn("h-8 w-8 rounded-full transition", data.primaryColor === p && "ring-2 ring-foreground ring-offset-2")}
                              style={{ background: p }}
                            />
                          ))}
                          <input type="color" value={data.primaryColor} onChange={(e) => setData({ ...data, primaryColor: e.target.value })} className="h-8 w-12 rounded border" />
                        </div>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Avatar"><ImageUpload value={data.avatarUrl} onChange={(v) => setData({ ...data, avatarUrl: v })} folder="avatars" /></Field>
                        <Field label="Portada / Logo"><ImageUpload value={data.coverUrl} onChange={(v) => setData({ ...data, coverUrl: v })} folder="covers" shape="cover" /></Field>
                      </div>
                    </div>
                  )}

                  {step === "links" && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Podés agregar enlaces opcionales ahora o más tarde desde el dashboard.</p>
                      {data.links.map((l, i) => (
                        <div key={i} className="grid items-center gap-2 sm:grid-cols-[160px_1fr_2fr_auto]">
                          <Select value={l.kind} onValueChange={(v) => updateLink(i, { kind: v as LinkKind })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(SOCIALS).map(([k, m]) => (
                                <SelectItem key={k} value={k}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} placeholder="Etiqueta" />
                          <Input
                            value={l.url}
                            onChange={(e) => {
                              const v = e.target.value;
                              const k = v ? detectKind(v) : l.kind;
                              updateLink(i, { url: v, kind: l.kind === "WEBSITE" ? k : l.kind });
                            }}
                            placeholder={SOCIALS[l.kind].placeholder}
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeLink(i)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setData({ ...data, links: [...data.links, { kind: "WEBSITE", label: "", url: "" }] })}>
                        <Plus className="h-3.5 w-3.5" /> Agregar enlace
                      </Button>
                    </div>
                  )}

                  {step === "review" && (
                    <div className="space-y-4 text-sm">
                      <ReviewRow label="Nombre" value={data.name} />
                      <ReviewRow label="Email" value={data.email} />
                      <ReviewRow label="Rol" value={data.role} />
                      <ReviewRow label="Slug" value={`/${normalizeSlug(data.slug || data.name)}`} />
                      <ReviewRow label="Plantilla" value={`${data.template} · ${data.primaryColor}`} />
                      <ReviewRow label="Enlaces" value={`${data.links.length}`} />
                      <p className="text-[12.5px] text-muted-foreground">
                        Vas a crear la cuenta y su perfil público completo. El usuario podrá ingresar inmediatamente con esta contraseña.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t bg-card/50 px-6 py-4">
              <Button variant="ghost" disabled={stepIdx === 0 || pending} onClick={() => go(-1)}>
                <ChevronLeft className="h-4 w-4" /> Atrás
              </Button>
              {step === "review" ? (
                <Button variant="gradient" onClick={onFinish} disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Crear usuario
                </Button>
              ) : (
                <Button onClick={tryNext} disabled={pending}>
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  function updateLink(i: number, patch: Partial<{ kind: LinkKind; label: string; url: string }>) {
    setData((d) => ({ ...d, links: d.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  }
  function removeLink(i: number) {
    setData((d) => ({ ...d, links: d.links.filter((_, idx) => idx !== i) }));
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border bg-card px-3 py-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
