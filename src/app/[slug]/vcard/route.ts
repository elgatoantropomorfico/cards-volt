import { prisma } from "@/lib/prisma";
import { buildVCard } from "@/lib/vcard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const profile = await prisma.profile.findUnique({ where: { slug } });
  if (!profile || !profile.active) {
    return new Response("Not Found", { status: 404 });
  }
  const vcf = buildVCard(profile);
  const filename = `${profile.slug || "contact"}.vcf`;
  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
