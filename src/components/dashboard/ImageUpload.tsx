"use client";

import * as React from "react";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Shape = "circle" | "rect" | "square";

export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Subir imagen",
  shape = "circle",
  hint,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  shape?: Shape;
  hint?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [drag, setDrag] = React.useState(false);

  async function onFile(file: File) {
    setLoading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const text = await r.text();
      let data: { ok?: boolean; url?: string; error?: string } | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`Respuesta no válida del servidor (${r.status})`);
      }
      if (!r.ok || !data?.ok || !data.url) {
        throw new Error(data?.error || `Error ${r.status} al subir`);
      }
      onChange(data.url);
      toast({ title: "Imagen subida", variant: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast({ title: "No se pudo subir la imagen", description: msg, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  const dim = shape === "circle" ? "h-24 w-24 rounded-full" : shape === "square" ? "h-24 w-24 rounded-2xl" : "h-24 w-40 rounded-2xl";

  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "group relative grid place-items-center overflow-hidden border-2 border-dashed border-border/70 bg-secondary/60 transition",
          dim,
          drag && "border-ring bg-accent",
        )}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void onFile(f);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] uppercase tracking-wider">vacío</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
          <Upload className="h-3.5 w-3.5" />
          {label}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} disabled={loading}>
            <X className="h-3.5 w-3.5" />
            Quitar
          </Button>
        ) : null}
        {hint ? <p className="max-w-[200px] text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
