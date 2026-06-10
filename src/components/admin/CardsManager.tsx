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

function applyAssign(cards: CardRow[], cardId: string, profileId: string | null, profiles: ProfileOpt[]): CardRow[] {
  const now = new Date().toISOString();
  return cards.map((c) => {
    if (profileId && c.profileId === profileId && c.id !== cardId) {
      return { ...c, profileId: null, profileLabel: null, status: "UNASSIGNED" as const, assignedAt: null };
    }
    if (c.id !== cardId) return c;
    if (profileId) {
      const p = profiles.find((x) => x.id === profileId);
      return { ...c, profileId, profileLabel: p?.label ?? null, status: "ACTIVE" as const, assignedAt: now };
    }
    return { ...c, profileId: null, profileLabel: null, status: "UNASSIGNED" as const, assignedAt: null };
  });
}

export function CardsManager({
  cards: serverCards,
  profiles,
  onChanged,
}: {
  cards: CardRow[];
  profiles: ProfileOpt[];
  onChanged?: () => void;
}) {
  const [cards, setCards] = React.useState(serverCards);
  React.useEffect(() => setCards(serverCards), [serverCards]);

  function refresh() {
    onChanged?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewCardDialog
          onCreated={(row) => {
            setCards((prev) => [row, ...prev]);
            refresh();
          }}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="min-w-[720px] w-full text-sm">
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
            {cards.map((c) => (
              <Row
                key={c.id}
                c={c}
                profiles={profiles}
                onAssign={(profileId) => setCards((prev) => applyAssign(prev, c.id, profileId, profiles))}
                onStatus={(status) => setCards((prev) => prev.map((x) => (x.id === c.id ? { ...x, status } : x)))}
                onChanged={refresh}
              />
            ))}
            {!cards.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No hay tarjetas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  c,
  profiles,
  onAssign,
  onStatus,
  onChanged,
}: {
  c: CardRow;
  profiles: ProfileOpt[];
  onAssign: (profileId: string | null) => void;
  onStatus: (status: CardRow["status"]) => void;
  onChanged?: () => void;
}) {
  async function handleAssign(v: string) {
    const pid = v === "none" ? null : v;
    onAssign(pid);
    const res = await assignCard(c.id, pid);
    if (!res.ok) {
      onChanged?.();
      toast({ title: "Error", description: res.error, variant: "error" });
    } else {
      toast({ title: "Tarjeta actualizada", variant: "success" });
      onChanged?.();
    }
  }

  async function handleStatus(v: string) {
    const next = v as CardRow["status"];
    const prev = c.status;
    onStatus(next);
    const res = await setCardStatus(c.id, next);
    if (!res.ok) {
      onStatus(prev);
      onChanged?.();
      toast({ title: "Error", description: res.error, variant: "error" });
    } else {
      toast({ title: "Estado actualizado", variant: "success" });
      onChanged?.();
    }
  }

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

  return (
    <tr className="border-t border-border/60 align-middle">
      <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
      <td className="px-4 py-3">
        <Select key={`${c.id}-status-${c.status}`} value={c.status} onValueChange={handleStatus}>
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
        <Select key={`${c.id}-profile-${c.profileId ?? "none"}`} value={c.profileId || "none"} onValueChange={handleAssign}>
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

function NewCardDialog({ onCreated }: { onCreated?: (row: CardRow) => void }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [code, setCode] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createCard({ code });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    const now = new Date().toISOString();
    onCreated?.({
      id: `temp-${code}`,
      code,
      status: "UNASSIGNED",
      profileId: null,
      profileLabel: null,
      createdAt: now,
      assignedAt: null,
    });
    setOpen(false);
    setCode("");
    toast({ title: "Tarjeta creada", variant: "success" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient"><Plus className="h-4 w-4" /> Nueva tarjeta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarjeta NFC</DialogTitle>
          <DialogDescription>Generá un código interno único. Luego asignala a un usuario desde la tabla.</DialogDescription>
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
