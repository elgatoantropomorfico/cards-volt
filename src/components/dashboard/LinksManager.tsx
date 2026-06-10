"use client";

import * as React from "react";
import { Loader2, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLink, deleteLink, reorderLinks, updateLink } from "@/server/profile-actions";
import { toast } from "@/components/ui/toaster";

type Row = { id: string; label: string; url: string };

export function LinksManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = React.useState<Row[]>(initial);
  const [adding, setAdding] = React.useState({ label: "", url: "" });
  const [pending, setPending] = React.useState(false);

  async function onAdd() {
    if (!adding.label || !adding.url) return;
    setPending(true);
    const res = await createLink(adding);
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setAdding({ label: "", url: "" });
    location.reload();
  }

  async function onSaveRow(r: Row) {
    const res = await updateLink(r.id, { label: r.label, url: r.url });
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else toast({ title: "Link actualizado", variant: "success" });
  }

  async function onDelete(id: string) {
    const res = await deleteLink(id);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function move(idx: number, delta: number) {
    const next = [...rows];
    const tgt = idx + delta;
    if (tgt < 0 || tgt >= next.length) return;
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    setRows(next);
    void reorderLinks(next.map((r) => r.id));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-slate-50 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
          <Input placeholder="Etiqueta" value={adding.label} onChange={(e) => setAdding({ ...adding, label: e.target.value })} />
          <Input placeholder="https://..." value={adding.url} onChange={(e) => setAdding({ ...adding, url: e.target.value })} />
          <Button onClick={onAdd} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No tenés links todavía.</p>
        ) : null}
        {rows.map((r, idx) => (
          <div key={r.id} className="flex items-center gap-2 rounded-lg border bg-white p-3">
            <GripVertical className="h-4 w-4 text-slate-400" />
            <div className="flex flex-1 flex-col gap-2 md:flex-row">
              <Input value={r.label} onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))} className="md:w-48" />
              <Input value={r.url} onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, url: e.target.value } : x)))} />
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} title="Subir"><ChevronUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} title="Bajar"><ChevronDown className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => onSaveRow(r)}>Guardar</Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(r.id)} title="Eliminar"><Trash2 className="h-4 w-4 text-rose-500" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
