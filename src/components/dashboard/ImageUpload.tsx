"use client";

import * as React from "react";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type Shape = "circle" | "square" | "cover";

const COVER_W = 1200;
const COVER_H = 600;

async function cropCoverTo2x1(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const targetRatio = 2 / 1;
  const srcRatio = bitmap.width / bitmap.height;
  let sx: number;
  let sy: number;
  let sw: number;
  let sh: number;

  if (srcRatio > targetRatio) {
    sh = bitmap.height;
    sw = sh * targetRatio;
    sx = (bitmap.width - sw) / 2;
    sy = 0;
  } else {
    sw = bitmap.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (bitmap.height - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = COVER_W;
  canvas.height = COVER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, COVER_W, COVER_H);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo exportar la imagen"))), "image/jpeg", 0.9);
  });

  const base = file.name.replace(/\.[^.]+$/, "") || "cover";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

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
    try {
      const uploadFile = shape === "cover" ? await cropCoverTo2x1(file) : file;
      const fd = new FormData();
      fd.set("file", uploadFile);
      fd.set("folder", folder);
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

  const dim =
    shape === "circle"
      ? "h-24 w-24 rounded-full"
      : shape === "cover"
        ? "aspect-[2/1] w-full max-w-[240px] rounded-2xl"
        : "h-24 w-24 rounded-2xl";

  const defaultHint =
    shape === "cover"
      ? "Formato horizontal 2:1 (ej. 1200×600). Se recorta automáticamente al centro."
      : undefined;

  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "group relative grid place-items-center overflow-hidden border-2 border-dashed border-border/70 bg-secondary/60 transition",
          dim,
          drag && "border-ring bg-accent",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
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
            if (f) void onFile(f);
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
        {(hint || defaultHint) ? (
          <p className="max-w-[220px] text-[11px] leading-snug text-muted-foreground">{hint || defaultHint}</p>
        ) : null}
      </div>
    </div>
  );
}
