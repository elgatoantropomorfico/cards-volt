import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureStoreCatalog } from "@/server/store-catalog";

export const dynamic = "force-dynamic";

/**
 * Live catalog prices for the public storefront.
 * Source of truth = database (editable from Superadmin).
 */
export async function GET() {
  await ensureStoreCatalog();

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      tagline: true,
      price: true,
      monthlyPrice: true,
      compareAtPrice: true,
      badge: true,
      features: true,
      stockQuantity: true,
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortName: p.shortName,
      tagline: p.tagline,
      price: Number(p.price),
      monthlyPrice: p.monthlyPrice != null ? Number(p.monthlyPrice) : Math.round(Number(p.price) / 12),
      compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
      badge: p.badge,
      features: p.features,
      stockQuantity: p.stockQuantity,
    })),
  });
}
