import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidSlug, normalizeSlug } from "@/lib/utils";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`slug-check:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("slug") || "";
  const excludeId = url.searchParams.get("excludeId") || undefined;
  const slug = normalizeSlug(raw);

  if (!slug) {
    return NextResponse.json({ slug, valid: false, available: false, reason: "empty" });
  }
  if (!isValidSlug(slug)) {
    return NextResponse.json({ slug, valid: false, available: false, reason: "invalid" });
  }

  const existing = await prisma.profile.findUnique({ where: { slug }, select: { id: true } });
  const taken = !!existing && existing.id !== excludeId;
  return NextResponse.json({ slug, valid: true, available: !taken });
}
