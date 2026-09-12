import { prisma } from "@/lib/prisma";
import { STORE_PRODUCTS, annualUnitPrice } from "@/lib/store-products";

/**
 * Ensures initial store catalog and default store settings exist in the database.
 * Completely idempotent.
 */
export async function ensureStoreCatalog() {
  for (const p of STORE_PRODUCTS) {
    const annualPrice = annualUnitPrice(p.monthlyPrice);
    const existing = await prisma.product.findUnique({ where: { slug: p.id } });
    if (!existing) {
      await prisma.product.create({
        data: {
          slug: p.id,
          name: p.name,
          shortName: p.shortName,
          tagline: p.tagline,
          description: `${p.name} con chip NFC integrado y código QR. Incluye acceso a Volt Cards Social Media con plan anual.`,
          price: annualPrice,
          monthlyPrice: p.monthlyPrice,
          badge: p.badge ?? null,
          features: p.features,
          sku: `VOLT-${p.id.toUpperCase()}-01`,
          active: true,
          stockManaged: true,
          stockQuantity: 100,
          lowStockThreshold: 10,
          variants: {
            create: [
              {
                name: p.variant === "white" ? "Blanco Mate" : "Negro Satinado",
                sku: `VOLT-${p.id.toUpperCase()}-STD`,
                color: p.variant,
                material: "PVC Premium NFC",
                stockQuantity: 100,
                active: true,
              },
            ],
          },
        },
      });
    }
  }

  // Ensure default store settings
  const settings = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  if (!settings) {
    await prisma.storeSetting.create({
      data: {
        id: "default",
        storeName: "Volt Cards Store",
        storeEmail: "hola@voltaiagents.com",
        storePhone: "+54 9 379 478-9169",
        currency: "ARS",
        active: true,
        shippingEnabled: true,
        flatShippingRate: 0,
      },
    });
  }
}
