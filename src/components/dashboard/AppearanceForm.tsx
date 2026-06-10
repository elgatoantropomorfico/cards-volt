"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateAppearance } from "@/server/profile-actions";
import { toast } from "@/components/ui/toaster";
import { ImageUpload } from "./ImageUpload";

type Template = "MINIMAL" | "PREMIUM" | "CORPORATE";

type Initial = {
  template: Template;
  primaryColor: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  slug: string;
};

export function AppearanceForm({ initial }: { initial: Initial }) {
  const [template, setTemplate] = React.useState<Template>(initial.template);
  const [color, setColor] = React.useState(initial.primaryColor);
  const [avatar, setAvatar] = React.useState(initial.avatarUrl);
  const [cover, setCover] = React.useState(initial.coverUrl);
  const [pending, setPending] = React.useState(false);

  async function onSave() {
    setPending(true);
    const res = await updateAppearance({
      template,
      primaryColor: color,
      avatarUrl: avatar || "",
      coverUrl: cover || "",
    });
    setPending(false);
    if (res.ok) toast({ title: "Apariencia actualizada", variant: "success" });
    else toast({ title: "Error", description: res.error, variant: "error" });
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Plantilla</Label>
          <Select value={template} onValueChange={(v) => setTemplate(v as Template)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MINIMAL">Minimal — Linktree</SelectItem>
              <SelectItem value="PREMIUM">Premium — HiHello / Popl</SelectItem>
              <SelectItem value="CORPORATE">Corporate — Ejecutivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Color principal</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border" />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="max-w-[140px]" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Foto de perfil</Label>
          <ImageUpload value={avatar} onChange={setAvatar} folder="avatars" shape="circle" />
        </div>

        <div className="space-y-2">
          <Label>Portada</Label>
          <ImageUpload value={cover} onChange={setCover} folder="covers" shape="rect" />
        </div>

        <Button onClick={onSave} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar
        </Button>
      </div>

      <div>
        <Label className="mb-2 block">Vista previa</Label>
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <iframe
            key={`${initial.slug}-${template}-${color}-${avatar}-${cover}`}
            src={`/${initial.slug}`}
            className="h-[640px] w-full"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">Guardá los cambios para refrescar la vista previa.</p>
      </div>
    </div>
  );
}
