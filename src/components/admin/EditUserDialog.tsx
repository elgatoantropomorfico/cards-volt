"use client";

import * as React from "react";
import { Loader2, Pencil, Save, User, Palette, Link as LinkIco, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import {
  getUserAdminDetail,
  updateUserAdmin,
  updateUserProfileAdmin,
  replaceUserLinksAdmin,
} from "@/server/admin-actions";
import { cn, normalizeSlug } from "@/lib/utils";
import { SOCIALS, normalizeLinkUrl, detectKind } from "@/lib/socials";
import { TEMPLATE_CATALOG } from "@/lib/templates-meta";
import type { LinkKind, Template, ThemeMode } from "@/lib/profile-types";

type Role = "SUPERADMIN" | "USER";

type LinkRow = { id?: string; kind: LinkKind; label: string; url: string };

export function EditUserDialog({
  userId,
  open,
  onOpenChange,
  onSaved,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [tab, setTab] = React.useState("account");

  const [account, setAccount] = React.useState({
    name: "",
    email: "",
    role: "USER" as Role,
    newPassword: "",
  });

  const [profile, setProfile] = React.useState({
    slug: "",
    active: true,
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
    template: "MINIMAL" as Template,
    primaryColor: "#7C3AED",
    themeMode: "LIGHT" as ThemeMode,
    avatarUrl: "" as string | null,
    coverUrl: "" as string | null,
    alias: "",
    showSaveContact: true,
  });

  const [links, setLinks] = React.useState<LinkRow[]>([]);
  const [hasProfile, setHasProfile] = React.useState(false);

  React.useEffect(() => {
    if (!open || !userId) return;
    setTab("account");
    setLoading(true);
    void getUserAdminDetail(userId).then((res) => {
      setLoading(false);
      if (!res.ok) {
        toast({ title: "Error", description: res.error, variant: "error" });
        onOpenChange(false);
        return;
      }
      setAccount({
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        newPassword: "",
      });
      if (res.profile) {
        setHasProfile(true);
        setProfile({
          slug: res.profile.slug,
          active: res.profile.active,
          jobTitle: res.profile.jobTitle ?? "",
          companyName: res.profile.companyName ?? "",
          description: res.profile.description ?? "",
          phone: res.profile.phone ?? "",
          whatsapp: res.profile.whatsapp ?? "",
          website: res.profile.website ?? "",
          location: res.profile.location ?? "",
          instagram: res.profile.instagram ?? "",
          linkedin: res.profile.linkedin ?? "",
          twitter: res.profile.twitter ?? "",
          template: res.profile.template,
          primaryColor: res.profile.primaryColor,
          themeMode: res.profile.themeMode,
          avatarUrl: res.profile.avatarUrl,
          coverUrl: res.profile.coverUrl,
          alias: res.profile.alias ?? "",
          showSaveContact: res.profile.showSaveContact !== false,
        });
        setLinks(res.profile.links);
      } else {
        setHasProfile(false);
      }
    });
  }, [open, userId, onOpenChange]);

  async function saveAccount() {
    if (!userId) return;
    setSaving(true);
    const res = await updateUserAdmin({
      userId,
      name: account.name,
      email: account.email,
      role: account.role,
      newPassword: account.newPassword || "",
    });
    setSaving(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    toast({ title: "Cuenta actualizada", variant: "success" });
    setAccount((a) => ({ ...a, newPassword: "" }));
    onSaved?.();
  }

  async function saveProfile() {
    if (!userId || !hasProfile) return;
    setSaving(true);
    const res = await updateUserProfileAdmin({
      userId,
      slug: normalizeSlug(profile.slug),
      jobTitle: profile.jobTitle || null,
      companyName: profile.companyName || null,
      description: profile.description || null,
      phone: profile.phone || null,
      whatsapp: profile.whatsapp || null,
      website: profile.website || null,
      location: profile.location || null,
      instagram: profile.instagram || null,
      linkedin: profile.linkedin || null,
      twitter: profile.twitter || null,
      avatarUrl: profile.avatarUrl || null,
      coverUrl: profile.coverUrl || null,
      alias: profile.alias || null,
      showSaveContact: profile.showSaveContact,
      template: profile.template,
      primaryColor: profile.primaryColor,
      themeMode: profile.themeMode,
      active: profile.active,
    });
    setSaving(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    toast({ title: "Perfil actualizado", variant: "success" });
    onSaved?.();
  }

  async function saveLinks() {
    if (!userId || !hasProfile) return;
    setSaving(true);
    const res = await replaceUserLinksAdmin(
      userId,
      links
        .filter((l) => l.label.trim() && l.url.trim())
        .map((l) => ({ kind: l.kind, label: l.label, url: normalizeLinkUrl(l.kind, l.url) })),
    );
    setSaving(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    toast({ title: "Enlaces actualizados", variant: "success" });
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Editar usuario
          </DialogTitle>
          <DialogDescription>
            Cuenta, perfil público, apariencia y enlaces. Ideal para acompañar el onboarding.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid h-64 place-items-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-6 mt-4 w-auto justify-start">
              <TabsTrigger value="account" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Cuenta</TabsTrigger>
              <TabsTrigger value="profile" disabled={!hasProfile} className="gap-1.5"><User className="h-3.5 w-3.5" /> Perfil</TabsTrigger>
              <TabsTrigger value="appearance" disabled={!hasProfile} className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Apariencia</TabsTrigger>
              <TabsTrigger value="links" disabled={!hasProfile} className="gap-1.5"><LinkIco className="h-3.5 w-3.5" /> Enlaces</TabsTrigger>
            </TabsList>

            <div className="max-h-[52vh] overflow-y-auto px-6 py-4">
              <TabsContent value="account" className="mt-0 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre">
                    <Input value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
                  </Field>
                  <Field label="Email (login)">
                    <Input type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
                  </Field>
                  <Field label="Rol">
                    <Select value={account.role} onValueChange={(v) => setAccount({ ...account, role: v as Role })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Usuario</SelectItem>
                        <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Nueva contraseña" hint="Dejá vacío para no cambiar. Mínimo 8 caracteres.">
                    <Input
                      type="text"
                      value={account.newPassword}
                      onChange={(e) => setAccount({ ...account, newPassword: e.target.value })}
                      placeholder="Opcional"
                    />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveAccount} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar cuenta
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="profile" className="mt-0 space-y-4">
                <div className="flex items-center justify-between rounded-xl border bg-secondary/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Perfil público activo</p>
                    <p className="text-xs text-muted-foreground">Si está off, la URL /slug muestra inactivo.</p>
                  </div>
                  <Switch checked={profile.active} onCheckedChange={(v) => setProfile({ ...profile, active: v })} />
                </div>
                <Field label="Slug público">
                  <Input value={profile.slug} onChange={(e) => setProfile({ ...profile, slug: normalizeSlug(e.target.value) })} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cargo"><Input value={profile.jobTitle} onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })} /></Field>
                  <Field label="Empresa (texto público)"><Input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} /></Field>
                  <Field label="Teléfono"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
                  <Field label="WhatsApp"><Input value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} /></Field>
                  <Field label="Sitio web"><Input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} /></Field>
                  <Field label="Ubicación"><Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></Field>
                </div>
                <Field label="Bio"><Textarea rows={3} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Alias"><Input value={profile.alias} onChange={(e) => setProfile({ ...profile, alias: e.target.value })} placeholder="@mi.alias" /></Field>
                  <div className="flex items-center justify-between rounded-xl border bg-secondary/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Botón guardar contacto</p>
                      <p className="text-xs text-muted-foreground">Off = ícono en pills</p>
                    </div>
                    <Switch checked={profile.showSaveContact} onCheckedChange={(v) => setProfile({ ...profile, showSaveContact: v })} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Instagram"><Input value={profile.instagram} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} /></Field>
                  <Field label="LinkedIn"><Input value={profile.linkedin} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} /></Field>
                  <Field label="X / Twitter"><Input value={profile.twitter} onChange={(e) => setProfile({ ...profile, twitter: e.target.value })} /></Field>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar perfil
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="mt-0 space-y-4">
                <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
                  {TEMPLATE_CATALOG.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setProfile({ ...profile, template: t.id, primaryColor: t.defaultColor })}
                      className={cn(
                        "rounded-xl border bg-card p-2.5 text-left text-sm transition",
                        profile.template === t.id ? "border-foreground shadow-pop" : "hover:border-foreground/30",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-secondary text-foreground">{t.icon}</span>
                        <span className="truncate text-xs font-medium">{t.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <Field label="Color principal">
                  <div className="flex items-center gap-2">
                    <input type="color" value={profile.primaryColor} onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })} className="h-9 w-12 rounded border" />
                    <Input value={profile.primaryColor} onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })} className="w-28 font-mono text-xs" />
                  </div>
                </Field>
                <Field label="Modo">
                  <div className="inline-flex rounded-xl border bg-card p-1">
                    {(["LIGHT", "DARK"] as ThemeMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setProfile({ ...profile, themeMode: m })}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm",
                          profile.themeMode === m ? "bg-foreground text-background" : "text-muted-foreground",
                        )}
                      >
                        {m === "LIGHT" ? "Claro" : "Oscuro"}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Avatar"><ImageUpload value={profile.avatarUrl} onChange={(v) => setProfile({ ...profile, avatarUrl: v })} folder="avatars" shape="circle" /></Field>
                  <Field label="Portada"><ImageUpload value={profile.coverUrl} onChange={(v) => setProfile({ ...profile, coverUrl: v })} folder="covers" shape="cover" /></Field>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar apariencia
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="links" className="mt-0 space-y-3">
                {links.map((l, i) => (
                  <div key={i} className="grid items-center gap-2 sm:grid-cols-[140px_1fr_2fr_auto]">
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
                        updateLink(i, { url: v, kind: l.kind === "WEBSITE" && v ? detectKind(v) : l.kind });
                      }}
                      placeholder={SOCIALS[l.kind].placeholder}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setLinks(links.filter((_, idx) => idx !== i))}>×</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setLinks([...links, { kind: "WEBSITE", label: "", url: "" }])}>
                  Agregar enlace
                </Button>
                <div className="flex justify-end pt-2">
                  <Button onClick={saveLinks} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar enlaces
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );

  function updateLink(i: number, patch: Partial<LinkRow>) {
    setLinks((rows) => rows.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
