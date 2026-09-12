import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { ensureStoreCatalog } from "@/server/store-catalog";
import { getStoreDashboardMetrics } from "@/server/admin-store-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireRole("SUPERADMIN");
  await ensureStoreCatalog();

  const [users, cards, profiles, metrics, orders, products, stockMovements, storeSettings] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: { profile: true },
      }),
      prisma.nfcCard.findMany({
        orderBy: { createdAt: "desc" },
        include: { profile: true },
      }),
      prisma.profile.findMany({ orderBy: { fullName: "asc" } }),
      getStoreDashboardMetrics(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: {
              id: true,
              slug: true,
              fullName: true,
              publicId: true,
              profileStatus: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          events: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryMovement.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: {
          product: true,
        },
      }),
      prisma.storeSetting.findUnique({ where: { id: "default" } }),
    ]);

  const settingsMap: Record<string, string> = {
    MERCADOPAGO_ACCESS_TOKEN: storeSettings?.mpAccessToken || "",
    MERCADOPAGO_PUBLIC_KEY: storeSettings?.mpPublicKey || "",
    MERCADOPAGO_WEBHOOK_SECRET: storeSettings?.mpWebhookSecret || "",
    MERCADOPAGO_SANDBOX: storeSettings?.mpSandbox ? "true" : "false",
    SHIPPING_ORIGIN_ADDRESS: storeSettings?.shippingOriginAddress || "",
    SHIPPING_ORIGIN_POSTAL_CODE: storeSettings?.shippingOriginPostalCode || "",
  };

  const appHost =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "cards.voltaiagents.com";

  return (
    <AdminShell
      userEmail={user.email}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        profile: u.profile
          ? {
              id: u.profile.id,
              slug: u.profile.slug,
              active: u.profile.active,
              source: u.profile.source,
              sourceOrderId: u.profile.sourceOrderId,
              sourceOrderNumber: u.profile.sourceOrderNumber,
            }
          : null,
      }))}
      cards={cards.map((c) => ({
        id: c.id,
        code: c.code,
        status: c.status,
        profileId: c.profileId,
        profileLabel: c.profile ? `${c.profile.fullName} (/${c.profile.slug})` : null,
        createdAt: c.createdAt.toISOString(),
        assignedAt: c.assignedAt?.toISOString() ?? null,
      }))}
      profiles={profiles.map((p) => ({
        id: p.id,
        label: `${p.fullName} (/${p.slug})`,
      }))}
      storeData={{
        metrics,
        orders,
        products,
        stockMovements,
        settings: settingsMap,
        appHost,
      }}
    />
  );
}
