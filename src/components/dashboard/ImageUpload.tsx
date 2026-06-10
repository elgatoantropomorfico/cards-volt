"use client";

import * as React from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Subir imagen",
  shape = "circle",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  shape?: "circle" | "rect";
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);

  async function onFile(file: File) {
    setLoading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      toast({ title: "Imagen subida", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={
          "relative grid place-items-center overflow-hidden border bg-slate-50 " +
          (shape === "circle" ? "h-20 w-20 rounded-full" : "h-20 w-32 rounded-md")
        }
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-400">vacío</span>
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {label}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4" /> Quitar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
