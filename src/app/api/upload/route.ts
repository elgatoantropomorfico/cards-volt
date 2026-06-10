import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToR2, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(extra || {}) }, { status });
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return err("No autenticado", 401);

    if (!isR2Configured()) {
      return err(
        "El almacenamiento de imágenes no está configurado en el servidor (faltan credenciales R2 o el bucket).",
        503,
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return err("Payload inválido", 400);
    }

    const file = form.get("file");
    const folder = (form.get("folder") as string) || "uploads";
    if (!(file instanceof File)) return err("No se recibió archivo", 400);
    if (file.size > MAX_BYTES) return err("Archivo demasiado grande (máx 8MB)", 413);
    if (file.type && !ALLOWED.has(file.type)) return err(`Formato no soportado: ${file.type}`, 415);

    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeFolder = folder.replace(/[^a-z0-9-_/]+/gi, "-").slice(0, 40);
    const key = `${safeFolder}/${session.user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext || "bin"}`;

    const buf = Buffer.from(await file.arrayBuffer());

    try {
      const url = await uploadToR2({ key, body: buf, contentType: file.type || "application/octet-stream" });
      return NextResponse.json({ ok: true, url, key });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      console.error("[upload] R2 error:", e);
      return err(
        msg.includes("Access Denied")
          ? "El bucket de R2 no permite escritura con estas credenciales. Revisá el token y el nombre de bucket en Cloudflare."
          : `No se pudo subir la imagen: ${msg}`,
        502,
      );
    }
  } catch (e) {
    console.error("[upload] unexpected:", e);
    return err("Error inesperado en el servidor", 500);
  }
}
