import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const profile = await prisma.profile.findUnique({ where: { slug }, select: { slug: true } });
  if (!profile) return new NextResponse("Not Found", { status: 404 });

  const fmt = (new URL(req.url).searchParams.get("format") || "png").toLowerCase();
  const target = `${appUrl()}/${profile.slug}`;
  const opts = { margin: 1, errorCorrectionLevel: "M" as const, width: 720 };

  if (fmt === "svg") {
    const svg = await QRCode.toString(target, { ...opts, type: "svg" });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${slug}.svg"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const buf = await QRCode.toBuffer(target, { ...opts, type: "png" });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${slug}.png"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
