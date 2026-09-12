import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [{ slug }, { publicId: slug }, { id: slug }],
    },
    select: { id: true, slug: true, publicId: true },
  });
  if (!profile) return new NextResponse("Not Found", { status: 404 });

  // Guarantee profile has an immutable publicId for production QR
  let publicId = profile.publicId;
  if (!publicId) {
    const { generatePublicId } = await import("@/lib/id");
    publicId = generatePublicId();
    await prisma.profile.update({
      where: { id: profile.id },
      data: { publicId },
    });
  }

  const fmt = (new URL(req.url).searchParams.get("format") || "png").toLowerCase();
  // Physical QR TARGET: Permanent immutable resolver URL
  const target = `${appUrl()}/c/${publicId}`;
  const opts = { margin: 1, errorCorrectionLevel: "M" as const, width: 720 };

  if (fmt === "svg") {
    const svg = await QRCode.toString(target, { ...opts, type: "svg" });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${profile.slug}-qr.svg"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const buf = await QRCode.toBuffer(target, { ...opts, type: "png" });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${profile.slug}-qr.png"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
