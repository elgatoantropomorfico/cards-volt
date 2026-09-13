import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { ensureStoreCatalog } from "@/server/store-catalog";
import { getStoreDashboardMetrics } from "@/server/admin-store-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireRole("SUPERADMIN");
  await ensureStoreCatalog();

  const [users, cards, profiles, metrics, orders, products, stockMovements, storeSettings, mailboxes] =
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
      prisma.storeMailbox.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  const settingsMap: Record<string, string> = {
    MERCADOPAGO_ACCESS_TOKEN: storeSettings?.mpAccessToken ? "••••••••" : "",
    MERCADOPAGO_PUBLIC_KEY: storeSettings?.mpPublicKey || "",
    MERCADOPAGO_WEBHOOK_SECRET: storeSettings?.mpWebhookSecret ? "••••••••" : "",
    MERCADOPAGO_ACCESS_TOKEN_SET: storeSettings?.mpAccessToken ? "true" : "false",
    MERCADOPAGO_WEBHOOK_SECRET_SET: storeSettings?.mpWebhookSecret ? "true" : "false",
    MERCADOPAGO_SANDBOX: storeSettings?.mpSandbox ? "true" : "false",
    SHIPPING_ORIGIN_ADDRESS: storeSettings?.shippingOriginAddress || "",
    SHIPPING_ORIGIN_POSTAL_CODE: storeSettings?.shippingOriginPostalCode || "",
    RESEND_API_KEY: storeSettings?.resendApiKey ? "••••••••" : "",
    RESEND_API_KEY_SET: storeSettings?.resendApiKey ? "true" : "false",
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
        orders: orders.map((o) => ({
          ...o,
          total: Number(o.total),
          subtotal: Number(o.subtotal),
          shippingTotal: Number(o.shippingTotal),
          discountTotal: Number(o.discountTotal),
          items: o.items.map((it) => ({
            ...it,
            unitPrice: Number(it.unitPrice),
            subtotal: Number(it.subtotal),
          })),
        })),
        products: products.map((p) => ({
          ...p,
          price: Number(p.price),
          monthlyPrice: p.monthlyPrice != null ? Number(p.monthlyPrice) : Math.round(Number(p.price) / 12),
          compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
        })),
        stockMovements,
        settings: settingsMap,
        mailboxes: mailboxes.map((m) => ({
          id: m.id,
          email: m.email,
          label: m.label,
          role: m.role,
          active: m.active,
          notes: m.notes,
        })),
        appHost,
      }}
    />
  );
}
