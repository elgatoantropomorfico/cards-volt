"use client";

import * as React from "react";
import { Loader2, Plus, Trash2, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { createCompany, deleteCompany, updateCompany } from "@/server/admin-actions";
import { normalizeSlug } from "@/lib/utils";
import { CreateUserWizard } from "./CreateUserWizard";

type Company = {
  id: string;
  name: string;
  slug: string;
  type: "INDIVIDUAL" | "COMPANY";
  primaryColor: string;
  seatsContracted: number;
  active: boolean;
  profiles: number;
  cards: number;
  users: number;
};

export function CompaniesManager({
  companies,
  onChanged,
}: {
  companies: Company[];
  onChanged?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
        <p>
          Una <strong className="text-foreground">empresa</strong> es el contenedor (tenant). Después de crearla, agregá usuarios con rol{" "}
          <Badge variant="outline" className="mx-0.5 align-middle">COMPANY_ADMIN</Badge> o{" "}
          <Badge variant="outline" className="mx-0.5 align-middle">USER</Badge> y asignales la empresa.
        </p>
        <NewCompanyDialog onCreated={onChanged} />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Usuarios</th>
              <th className="px-4 py-2">Perfiles</th>
              <th className="px-4 py-2">Tarjetas</th>
              <th className="px-4 py-2">Asientos</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <Row key={c.id} c={c} onChanged={onChanged} />
            ))}
            {!companies.length && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No hay empresas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ c, onChanged }: { c: Company; onChanged?: () => void }) {
  const [active, setActive] = React.useState(c.active);
  const [editOpen, setEditOpen] = React.useState(false);
  async function onToggle(v: boolean) {
    setActive(v);
    const res = await updateCompany(c.id, { active: v });
    if (!res.ok) {
      setActive(!v);
      toast({ title: "Error", description: res.error, variant: "error" });
    }
  }
  async function onDelete() {
    if (!confirm(`Eliminar "${c.name}"? Esto desvincula sus usuarios y tarjetas.`)) return;
    const res = await deleteCompany(c.id);
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else { toast({ title: "Empresa eliminada", variant: "success" }); onChanged?.(); }
  }
  return (
    <tr className="border-t border-border/60">
      <td className="px-4 py-3 font-medium">{c.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
      <td className="px-4 py-3"><Badge variant="outline">{c.type}</Badge></td>
      <td className="px-4 py-3">{c.users}</td>
      <td className="px-4 py-3">{c.profiles} / {c.seatsContracted}</td>
      <td className="px-4 py-3">{c.cards}</td>
      <td className="px-4 py-3">{c.seatsContracted}</td>
      <td className="px-4 py-3"><Switch checked={active} onCheckedChange={onToggle} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <CreateUserWizard
            isSuperadmin
            companies={[{ id: c.id, name: c.name }]}
            defaultCompanyId={c.id}
            defaultRole="COMPANY_ADMIN"
            onCreated={onChanged}
            trigger={
              <Button variant="ghost" size="icon" title="Agregar usuario a esta empresa">
                <UserPlus className="h-4 w-4" />
              </Button>
            }
          />
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Editar empresa">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Eliminar">
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
        <EditCompanyDialog company={c} open={editOpen} onOpenChange={setEditOpen} onSaved={onChanged} />
      </td>
    </tr>
  );
}

function NewCompanyDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    type: "COMPANY" as "INDIVIDUAL" | "COMPANY",
    primaryColor: "#0F172A",
    seatsContracted: 1,
  });

  React.useEffect(() => {
    if (open && form.name && !form.slug) {
      setForm((f) => ({ ...f, slug: normalizeSlug(f.name) }));
    }
  }, [form.name, form.slug, open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createCompany({ ...form, slug: normalizeSlug(form.slug || form.name) });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setOpen(false);
    toast({ title: "Empresa creada", variant: "success" });
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient"><Plus className="h-4 w-4" /> Nueva empresa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>Creá una empresa (multiusuario) o individual (un perfil).</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || normalizeSlug(e.target.value) })} required /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: normalizeSlug(e.target.value) })} required /></div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "INDIVIDUAL" | "COMPANY" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="COMPANY">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Color principal</Label><Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
            <div className="space-y-2"><Label>Asientos contratados</Label><Input type="number" min={1} value={form.seatsContracted} onChange={(e) => setForm({ ...form, seatsContracted: Number(e.target.value) })} /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Crear empresa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCompanyDialog({
  company,
  open,
  onOpenChange,
  onSaved,
}: {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    name: company.name,
    slug: company.slug,
    type: company.type,
    primaryColor: company.primaryColor,
    seatsContracted: company.seatsContracted,
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        name: company.name,
        slug: company.slug,
        type: company.type,
        primaryColor: company.primaryColor,
        seatsContracted: company.seatsContracted,
      });
    }
  }, [open, company]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await updateCompany(company.id, {
      ...form,
      slug: normalizeSlug(form.slug),
    });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    toast({ title: "Empresa actualizada", variant: "success" });
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar empresa</DialogTitle>
          <DialogDescription>Actualizá nombre, slug, asientos y tipo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: normalizeSlug(e.target.value) })} required /></div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "INDIVIDUAL" | "COMPANY" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="COMPANY">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Color principal</Label><Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
            <div className="space-y-2"><Label>Asientos contratados</Label><Input type="number" min={1} value={form.seatsContracted} onChange={(e) => setForm({ ...form, seatsContracted: Number(e.target.value) })} /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
