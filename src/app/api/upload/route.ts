import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToR2, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 not configured on the server" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const folder = (form.get("folder") as string) || "uploads";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safeFolder = folder.replace(/[^a-z0-9-_/]+/gi, "-").slice(0, 40);
  const key = `${safeFolder}/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const url = await uploadToR2({ key, body: buf, contentType: file.type });

  return NextResponse.json({ url, key });
}
