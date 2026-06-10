"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { assignCard, createCard, setCardStatus } from "@/server/admin-actions";

type CardRow = {
  id: string;
  code: string;
  status: "UNASSIGNED" | "ACTIVE" | "INACTIVE" | "LOST";
  profileId: string | null;
  profileLabel: string | null;
  createdAt: string;
  assignedAt: string | null;
};

type ProfileOpt = { id: string; label: string };

export function CardsManager({
  cards,
  profiles,
  onChanged,
}: {
  cards: CardRow[];
  profiles: ProfileOpt[];
  onChanged?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewCardDialog onCreated={onChanged} />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Perfil asignado</th>
              <th className="px-4 py-2">Creada</th>
              <th className="px-4 py-2">Asignada</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => <Row key={c.id} c={c} profiles={profiles} onChanged={onChanged} />)}
            {!cards.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No hay tarjetas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ c, profiles, onChanged }: { c: CardRow; profiles: ProfileOpt[]; onChanged?: () => void }) {
  async function onAssign(v: string) {
    const pid = v === "none" ? null : v;
    const res = await assignCard(c.id, pid);
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else { toast({ title: "Tarjeta actualizada", variant: "success" }); onChanged?.(); }
  }
  async function onStatus(v: string) {
    const res = await setCardStatus(c.id, v as CardRow["status"]);
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else { toast({ title: "Estado actualizado", variant: "success" }); onChanged?.(); }
  }
  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
  return (
    <tr className="border-t border-border/60 align-middle">
      <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
      <td className="px-4 py-3">
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
      <td className="px-4 py-3">
        <Select value={c.profileId || "none"} onValueChange={onAssign}>
          <SelectTrigger className="h-8 w-[260px]"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Sin asignar —</SelectItem>
            {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{fmt(c.createdAt)}</td>
      <td className="px-4 py-3 text-muted-foreground">{fmt(c.assignedAt)}</td>
      <td className="px-4 py-3"></td>
    </tr>
  );
}

function NewCardDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [code, setCode] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createCard({ code });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setOpen(false);
    setCode("");
    toast({ title: "Tarjeta creada", variant: "success" });
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient"><Plus className="h-4 w-4" /> Nueva tarjeta</Button>
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
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Crear
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
