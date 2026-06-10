"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { assignCard, createCard, setCardStatus } from "@/server/admin-actions";

type CardRow = {
  id: string;
  code: string;
  status: "UNASSIGNED" | "ACTIVE" | "INACTIVE" | "LOST";
  companyId: string | null;
  companyName: string | null;
  profileId: string | null;
  profileLabel: string | null;
  createdAt: string;
  assignedAt: string | null;
};

type ProfileOpt = { id: string; label: string; companyId: string | null };

export function CardsManager({
  cards,
  companies,
  profiles,
  isSuperadmin,
  lockedCompanyId,
}: {
  cards: CardRow[];
  companies: { id: string; name: string }[];
  profiles: ProfileOpt[];
  isSuperadmin: boolean;
  lockedCompanyId?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewCardDialog isSuperadmin={isSuperadmin} companies={companies} lockedCompanyId={lockedCompanyId} />
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Perfil asignado</th>
              <th className="px-4 py-2">Creada</th>
              <th className="px-4 py-2">Asignada</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => <Row key={c.id} c={c} profiles={profiles} />)}
            {!cards.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No hay tarjetas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ c, profiles }: { c: CardRow; profiles: ProfileOpt[] }) {
  const eligibleProfiles = profiles.filter((p) => !c.companyId || p.companyId === c.companyId);
  async function onAssign(v: string) {
    const pid = v === "none" ? null : v;
    const res = await assignCard(c.id, pid);
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else location.reload();
  }
  async function onStatus(v: string) {
    const res = await setCardStatus(c.id, v as CardRow["status"]);
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else location.reload();
  }
  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
  return (
    <tr className="border-t align-middle">
      <td className="px-4 py-2 font-mono text-xs">{c.code}</td>
      <td className="px-4 py-2">
        <Select value={c.status} onValueChange={onStatus}>
          <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UNASSIGNED">Sin asignar</SelectItem>
            <SelectItem value="ACTIVE">Activa</SelectItem>
            <SelectItem value="INACTIVE">Inactiva</SelectItem>
            <SelectItem value="LOST">Perdida</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-2">{c.companyName || "—"}</td>
      <td className="px-4 py-2">
        <Select value={c.profileId || "none"} onValueChange={onAssign}>
          <SelectTrigger className="h-8 w-[260px]"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Sin asignar —</SelectItem>
            {eligibleProfiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-2 text-slate-500">{fmt(c.createdAt)}</td>
      <td className="px-4 py-2 text-slate-500">{fmt(c.assignedAt)}</td>
      <td className="px-4 py-2"></td>
    </tr>
  );
}

function NewCardDialog({
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
  const [code, setCode] = React.useState("");
  const [companyId, setCompanyId] = React.useState(lockedCompanyId ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createCard({ code, companyId: companyId || null });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setOpen(false);
    setCode("");
    location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Nueva tarjeta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarjeta NFC</DialogTitle>
          <DialogDescription>Generá un código interno único.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Código interno</Label>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value)} required />
              <Button type="button" variant="outline" onClick={() => setCode("VC-" + Math.random().toString(36).slice(2, 8).toUpperCase())}>
                Auto
              </Button>
            </div>
          </div>
          {isSuperadmin && (
            <div className="space-y-2">
              <Label>Empresa (opcional)</Label>
              <Select value={companyId || "none"} onValueChange={(v) => setCompanyId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sin empresa —</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Crear
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
