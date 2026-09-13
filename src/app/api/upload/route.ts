import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToR2, isR2Configured } from "@/lib/r2";
import { assertOrderAccess } from "@/server/order-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_FOLDERS = new Set(["avatars", "covers", "uploads"]);

function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(extra || {}) }, { status });
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`upload:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return err("Demasiadas subidas. Probá en un minuto.", 429, {
        retryAfterSec: rl.retryAfterSec,
      });
    }

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
    const folderRaw = (form.get("folder") as string) || "uploads";
    const orderId = (form.get("orderId") as string) || "";
    const accessToken = (form.get("accessToken") as string) || "";

    const session = await auth.api.getSession({ headers: await headers() });
    let ownerKey = session?.user?.id || "";

    if (!session?.user) {
      if (!orderId) return err("No autenticado", 401);
      const access = await assertOrderAccess(orderId, accessToken || null);
      if (!access.ok) return err(access.error, access.status);
      if (access.order.paymentStatus !== "APPROVED") {
        return err("Pedido no aprobado", 403);
      }
      ownerKey = access.order.userId || access.order.id;
    }

    if (!(file instanceof File)) return err("No se recibió archivo", 400);
    if (file.size > MAX_BYTES) return err("Archivo demasiado grande (máx 8MB)", 413);
    if (file.type && !ALLOWED.has(file.type)) return err(`Formato no soportado: ${file.type}`, 415);

    const safeFolder = folderRaw.replace(/[^a-z0-9-_]+/gi, "").toLowerCase().slice(0, 40);
    if (!ALLOWED_FOLDERS.has(safeFolder)) return err("Carpeta no permitida", 400);

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extMap[file.type] || "bin";
    const key = `${safeFolder}/${ownerKey}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const buf = Buffer.from(await file.arrayBuffer());

    try {
      const url = await uploadToR2({
        key,
        body: buf,
        contentType: file.type || "application/octet-stream",
      });
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
