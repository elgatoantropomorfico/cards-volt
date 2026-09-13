import { prisma } from "@/lib/prisma";
import { ensureStoreCatalog } from "@/server/store-catalog";
import type { PriceMap, ProductId } from "@/lib/store-products";

export type CatalogProduct = {
  id: string;
  slug: ProductId;
  name: string;
  shortName: string | null;
  tagline: string | null;
  price: number;
  monthlyPrice: number;
  compareAtPrice: number | null;
  badge: string | null;
  features: string[];
  stockQuantity: number;
};

/**
 * Server-side live catalog. Source of truth for storefront prices.
 */
export async function getLiveCatalog(): Promise<{
  products: CatalogProduct[];
  prices: PriceMap;
}> {
  await ensureStoreCatalog();

  const rows = await prisma.product.findMany({
    where: { active: true, slug: { in: ["white", "black"] } },
    orderBy: { createdAt: "asc" },
  });

  const products: CatalogProduct[] = rows.map((p) => {
    const annual = Number(p.price);
    const monthly =
      p.monthlyPrice != null ? Number(p.monthlyPrice) : Math.round(annual / 12);
    return {
      id: p.id,
      slug: p.slug as ProductId,
      name: p.name,
      shortName: p.shortName,
      tagline: p.tagline,
      price: annual,
      monthlyPrice: monthly,
      compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
      badge: p.badge,
      features: p.features,
      stockQuantity: p.stockQuantity,
    };
  });

  const prices: PriceMap = {};
  for (const p of products) {
    prices[p.slug] = {
      monthlyPrice: p.monthlyPrice,
      annualPrice: p.price,
    };
  }

  return { products, prices };
}
