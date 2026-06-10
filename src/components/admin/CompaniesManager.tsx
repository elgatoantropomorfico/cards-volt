"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { createCompany, deleteCompany, updateCompany } from "@/server/admin-actions";

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

export function CompaniesManager({ companies }: { companies: Company[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><NewCompanyDialog /></div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
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
              <Row key={c.id} c={c} />
            ))}
            {!companies.length && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No hay empresas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ c }: { c: Company }) {
  const [active, setActive] = React.useState(c.active);
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
    else location.reload();
  }
  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{c.name}</td>
      <td className="px-4 py-2 text-slate-500">{c.slug}</td>
      <td className="px-4 py-2"><Badge variant="outline">{c.type}</Badge></td>
      <td className="px-4 py-2">{c.users}</td>
      <td className="px-4 py-2">{c.profiles} / {c.seatsContracted}</td>
      <td className="px-4 py-2">{c.cards}</td>
      <td className="px-4 py-2">{c.seatsContracted}</td>
      <td className="px-4 py-2"><Switch checked={active} onCheckedChange={onToggle} /></td>
      <td className="px-4 py-2 text-right">
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
      </td>
    </tr>
  );
}

function NewCompanyDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    type: "COMPANY" as "INDIVIDUAL" | "COMPANY",
    primaryColor: "#0F172A",
    seatsContracted: 1,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createCompany(form);
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setOpen(false);
    location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Nueva empresa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>Creá una empresa (multiusuario) o individual (un perfil).</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required /></div>
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
