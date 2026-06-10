"use client";

import * as React from "react";
import { Loader2, Plus, Trash2, GripVertical, Save } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { SOCIALS, detectKind, normalizeLinkUrl } from "@/lib/socials";
import type { LinkKind, ProfileLink } from "@/lib/profile-types";
import { createLink, deleteLink, reorderLinks, updateLink } from "@/server/profile-actions";

const KIND_ORDER: LinkKind[] = [
  "WEBSITE","INSTAGRAM","LINKEDIN","TWITTER","FACEBOOK","YOUTUBE","TIKTOK","GITHUB","SPOTIFY","CALENDAR","EMAIL","PHONE","WHATSAPP","MAP","PDF","OTHER",
];

export function LinksSection({
  links,
  setLinks,
}: {
  links: ProfileLink[];
  setLinks: (next: ProfileLink[]) => void;
}) {
  const [adding, setAdding] = React.useState<{ kind: LinkKind; label: string; url: string }>({
    kind: "WEBSITE",
    label: "",
    url: "",
  });
  const [pending, setPending] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onAdd() {
    if (!adding.label.trim() || !adding.url.trim()) {
      return toast({ title: "Completá etiqueta y URL", variant: "error" });
    }
    setPending(true);
    const url = normalizeLinkUrl(adding.kind, adding.url);
    const res = await createLink({ kind: adding.kind, label: adding.label.trim(), url });
    setPending(false);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setLinks([
      ...links,
      { id: res.id, kind: adding.kind, label: adding.label.trim(), url, order: links.length },
    ]);
    setAdding({ kind: "WEBSITE", label: "", url: "" });
    toast({ title: "Link agregado", variant: "success" });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = links.findIndex((l) => l.id === active.id);
    const newIdx = links.findIndex((l) => l.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = arrayMove(links, oldIdx, newIdx).map((l, i) => ({ ...l, order: i }));
    setLinks(next);
    void reorderLinks(next.map((l) => l.id));
  }

  function patch(id: string, patchData: Partial<ProfileLink>) {
    setLinks(links.map((l) => (l.id === id ? { ...l, ...patchData } : l)));
  }

  async function onSaveRow(row: ProfileLink) {
    const url = normalizeLinkUrl(row.kind, row.url);
    const res = await updateLink(row.id, { kind: row.kind, label: row.label.trim(), url });
    if (!res.ok) toast({ title: "Error", description: res.error, variant: "error" });
    else {
      patch(row.id, { url, label: row.label.trim() });
      toast({ title: "Link guardado", variant: "success" });
    }
  }

  async function onDelete(id: string) {
    const res = await deleteLink(id);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setLinks(links.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo bloque</CardTitle>
          <CardDescription>Elegí el tipo, agregá una etiqueta y la URL/handle. Detectamos automáticamente el tipo según la URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[170px_1fr_2fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <KindSelect value={adding.kind} onChange={(v) => setAdding({ ...adding, kind: v })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Etiqueta</Label>
              <Input
                value={adding.label}
                onChange={(e) => setAdding({ ...adding, label: e.target.value })}
                placeholder={SOCIALS[adding.kind].label}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL / Handle</Label>
              <Input
                value={adding.url}
                onChange={(e) => {
                  const v = e.target.value;
                  const detected = v ? detectKind(v) : adding.kind;
                  setAdding((s) => ({
                    ...s,
                    url: v,
                    kind: s.kind === "WEBSITE" && detected !== "WEBSITE" ? detected : s.kind,
                  }));
                }}
                placeholder={SOCIALS[adding.kind].placeholder}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={onAdd} disabled={pending} variant="gradient">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis bloques ({links.length})</CardTitle>
          <CardDescription>Arrastrá para reordenar. El orden se refleja en tu perfil público.</CardDescription>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              Todavía no agregaste bloques.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {links.map((l) => (
                    <SortableRow
                      key={l.id}
                      row={l}
                      onPatch={(p) => patch(l.id, p)}
                      onSave={() => onSaveRow(l)}
                      onDelete={() => onDelete(l.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SortableRow({
  row,
  onPatch,
  onSave,
  onDelete,
}: {
  row: ProfileLink;
  onPatch: (p: Partial<ProfileLink>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };
  const Meta = SOCIALS[row.kind];
  const Icon = Meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-soft"
    >
      <button
        {...attributes}
        {...listeners}
        className="grid h-9 w-9 shrink-0 cursor-grab place-items-center rounded-lg text-muted-foreground hover:bg-secondary active:cursor-grabbing"
        aria-label="Reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
        style={{ background: `${Meta.color}14`, color: Meta.color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-[160px_1fr_2fr]">
        <KindSelect value={row.kind} onChange={(v) => onPatch({ kind: v })} compact />
        <Input value={row.label} onChange={(e) => onPatch({ label: e.target.value })} placeholder="Etiqueta" />
        <Input value={row.url} onChange={(e) => onPatch({ url: e.target.value })} placeholder={Meta.placeholder} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Eliminar">
          <Trash2 className="h-4 w-4 text-rose-500" />
        </Button>
      </div>
    </div>
  );
}

function KindSelect({
  value,
  onChange,
  compact,
}: {
  value: LinkKind;
  onChange: (v: LinkKind) => void;
  compact?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LinkKind)}>
      <SelectTrigger className={compact ? "h-9" : ""}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {KIND_ORDER.map((k) => {
          const M = SOCIALS[k];
          const Icon = M.icon;
          return (
            <SelectItem key={k} value={k}>
              <span className="inline-flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" style={{ color: M.color }} />
                {M.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
