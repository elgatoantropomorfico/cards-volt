"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { createUser, deleteUser, setProfileActive } from "@/server/admin-actions";

type Row = {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "COMPANY_ADMIN" | "USER";
  companyId: string | null;
  companyName: string | null;
  profile: { id: string; slug: string; active: boolean } | null;
};

export function UsersManager({
  users,
  companies,
  isSuperadmin,
  lockedCompanyId,
}: {
  users: Row[];
  companies: { id: string; name: string }[];
  isSuperadmin: boolean;
  lockedCompanyId?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewUserDialog isSuperadmin={isSuperadmin} companies={companies} lockedCompanyId={lockedCompanyId} />
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Perfil</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => <UserRow key={u.id} u={u} />)}
            {!users.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No hay usuarios</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ u }: { u: Row }) {
  const [active, setActive] = React.useState(u.profile?.active ?? false);
  async function onToggle(v: boolean) {
    if (!u.profile) return;
    setActive(v);
    const res = await setProfileActive(u.profile.id, v);
    if (!res.ok) { setActive(!v); toast({ title: "Error", description: res.error, variant: "error" }); }
  }
  async function onDelete() {
    if (!confirm(`Eliminar a ${u.email}?`)) return;
    const res = await deleteUser(u.id);
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else location.reload();
  }
  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{u.name}</td>
      <td className="px-4 py-2 text-slate-500">{u.email}</td>
      <td className="px-4 py-2"><Badge variant="outline">{u.role}</Badge></td>
      <td className="px-4 py-2">{u.companyName || "—"}</td>
      <td className="px-4 py-2">
        {u.profile ? (
          <Link href={`/${u.profile.slug}`} target="_blank" className="inline-flex items-center gap-1 text-slate-700 hover:underline">
            /{u.profile.slug} <ExternalLink className="h-3 w-3" />
          </Link>
        ) : "—"}
      </td>
      <td className="px-4 py-2">
        {u.profile ? <Switch checked={active} onCheckedChange={onToggle} /> : "—"}
      </td>
      <td className="px-4 py-2 text-right">
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
      </td>
    </tr>
  );
}

function NewUserDialog({
  isSuperadmin,
  companies,
  lockedCompanyId,
}: {
  isSuperadmin: boolean;
  companies: { id: string; name: string }[];
  lockedCompanyId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "SUPERADMIN" | "COMPANY_ADMIN" | "USER",
    companyId: lockedCompanyId ?? "",
    jobTitle: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      companyId: form.companyId || null,
      jobTitle: form.jobTitle || null,
    });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setOpen(false);
    location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Nuevo usuario</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>Se creará también su perfil público.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Contraseña</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required /></div>
            <div className="space-y-2"><Label>Cargo (opcional)</Label><Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
          </div>
          {isSuperadmin && (
            <>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Row["role"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Usuario</SelectItem>
                    <SelectItem value="COMPANY_ADMIN">Admin de empresa</SelectItem>
                    <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select value={form.companyId || "none"} onValueChange={(v) => setForm({ ...form, companyId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin empresa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin empresa —</SelectItem>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Crear usuario
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
