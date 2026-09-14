"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ensureStoreCatalog } from "@/server/store-catalog";

/**
 * Retorna las métricas operativas del Dashboard de Tienda
 */
export async function getStoreDashboardMetrics() {
  await requireRole("SUPERADMIN");
  await ensureStoreCatalog();

  const [
    totalOrders,
    approvedOrders,
    awaitingProfileCount,
    readyForProductionCount,
    inProductionCount,
    readyToShipCount,
    lowStockProductsCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      where: { paymentStatus: "APPROVED" },
      select: { total: true },
    }),
    prisma.order.count({ where: { fulfillmentStatus: "AWAITING_PROFILE" } }),
    prisma.order.count({ where: { fulfillmentStatus: "READY_FOR_PRODUCTION" } }),
    prisma.order.count({ where: { fulfillmentStatus: "IN_PRODUCTION" } }),
    prisma.order.count({ where: { fulfillmentStatus: "READY_TO_SHIP" } }),
    prisma.product.count({
      where: {
        active: true,
        stockManaged: true,
        stockQuantity: { lte: 5 },
      },
    }),
  ]);

  const totalRevenue = approvedOrders.reduce((acc, curr) => acc + Number(curr.total), 0);

  return {
    totalOrders,
    totalRevenue,
    awaitingProfileCount,
    readyForProductionCount,
    inProductionCount,
    readyToShipCount,
    lowStockProductsCount,
  };
}

/**
 * Obtiene lista de órdenes para el Superadmin
 */
export async function getAdminOrders() {
  await requireRole("SUPERADMIN");

  return prisma.order.findMany({
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
  });
}

/**
 * Cambia los estados operativos de una orden desde el Superadmin
 */
export async function updateAdminOrderStatus(input: {
  orderId: string;
  fulfillmentStatus?: "AWAITING_PROFILE" | "READY_FOR_PRODUCTION" | "IN_PRODUCTION" | "READY_TO_SHIP" | "FULFILLED" | "CANCELLED";
  shippingStatus?: "PENDING" | "LABEL_CREATED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  trackingNumber?: string;
  trackingUrl?: string;
  note?: string;
}) {
  const user = await requireRole("SUPERADMIN");

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
  });

  if (!order) {
    return { ok: false, error: "Orden no encontrada" };
  }

  const updateData: any = {};
  const eventsToCreate: any[] = [];

  if (input.fulfillmentStatus && input.fulfillmentStatus !== order.fulfillmentStatus) {
    updateData.fulfillmentStatus = input.fulfillmentStatus;
    if (input.fulfillmentStatus === "FULFILLED") {
      updateData.fulfilledAt = new Date();
    }
    eventsToCreate.push({
      type: `production.${input.fulfillmentStatus.toLowerCase()}`,
      title: `Producción: ${input.fulfillmentStatus}`,
      detail: input.note || `Estado de fulfillment modificado por ${user.email}`,
    });
  }

  if (input.shippingStatus && input.shippingStatus !== order.shippingStatus) {
    updateData.shippingStatus = input.shippingStatus;
    eventsToCreate.push({
      type: `shipment.${input.shippingStatus.toLowerCase()}`,
      title: `Envío: ${input.shippingStatus}`,
      detail: input.note || `Estado de envío modificado por ${user.email}`,
    });
  }

  if (input.trackingNumber !== undefined) updateData.trackingNumber = input.trackingNumber.trim() || null;
  if (input.trackingUrl !== undefined) updateData.trackingUrl = input.trackingUrl.trim() || null;

  if (eventsToCreate.length > 0) {
    updateData.events = {
      create: eventsToCreate,
    };
  }

  await prisma.order.update({
    where: { id: input.orderId },
    data: updateData,
  });

  // Support reset: AWAITING_PROFILE with missing user/profile → recreate buyer binding
  if (input.fulfillmentStatus === "AWAITING_PROFILE") {
    const { repairOrderBuyerBinding } = await import("@/server/ensure-order-buyer");
    await repairOrderBuyerBinding(input.orderId);
  }

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Hard reset of buyer onboarding for support: unlink profile, AWAITING_PROFILE,
 * recreate User+Profile if needed, return shareable wizard URL with access token.
 */
export async function resetOrderOnboarding(orderId: string) {
  await requireRole("SUPERADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false as const, error: "Orden no encontrada" };
  if (order.paymentStatus !== "APPROVED") {
    return { ok: false as const, error: "El pedido no está pagado" };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        profileId: null,
        fulfillmentStatus: "AWAITING_PROFILE",
        events: {
          create: {
            type: "onboarding.reset",
            title: "Onboarding reiniciado",
            detail: "Superadmin reinició el wizard del comprador para esta compra.",
          },
        },
      },
    }),
    prisma.orderSeat.updateMany({
      where: { orderId, status: "PRIMARY" },
      data: { profileId: null },
    }),
  ]);

  const { repairOrderBuyerBinding } = await import("@/server/ensure-order-buyer");
  await repairOrderBuyerBinding(orderId);

  const { ensureOrderAccessToken, onboardingPath } = await import("@/server/order-access");
  const accessToken = await ensureOrderAccessToken(orderId);
  const path = onboardingPath(orderId, accessToken);

  revalidatePath("/admin");
  revalidatePath(`/onboarding/${orderId}`);
  return { ok: true as const, onboardingPath: path, accessToken };
}

/**
 * Ajuste manual de inventario con trazabilidad
 */
export async function recordInventoryAdjustment(input: {
  productId: string;
  quantityChange: number; // positivo para sumar, negativo para restar
  type: "PURCHASE" | "MANUAL_ADJUSTMENT" | "RETURN" | "DAMAGE" | "OTHER";
  note: string;
}) {
  const user = await requireRole("SUPERADMIN");

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    return { ok: false, error: "Producto no encontrado" };
  }

  const newStock = Math.max(0, product.stockQuantity + input.quantityChange);

  await prisma.$transaction([
    prisma.product.update({
      where: { id: input.productId },
      data: {
        stockQuantity: newStock,
      },
    }),
    prisma.inventoryMovement.create({
      data: {
        productId: input.productId,
        quantity: input.quantityChange,
        type: input.type,
        adminId: user.id,
        note: input.note || `Ajuste manual realizado por ${user.email}`,
      },
    }),
  ]);

  revalidatePath("/admin");
  return { ok: true, newStock };
}

/**
 * Guarda credenciales de configuración de la tienda (Mercado Pago, Mercado Envíos)
 */
export async function updateAdminProduct(input: {
  productId: string;
  price?: number;
  monthlyPrice?: number;
  compareAtPrice?: number | null;
  active?: boolean;
  name?: string;
  shortDescription?: string | null;
  stockQuantity?: number;
}) {
  await requireRole("SUPERADMIN");

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) return { ok: false as const, error: "Producto no encontrado" };

  const data: Record<string, unknown> = {};
  if (input.price !== undefined) {
    if (input.price < 0) return { ok: false as const, error: "El precio anual no puede ser negativo" };
    data.price = input.price;
  }
  if (input.monthlyPrice !== undefined) {
    if (input.monthlyPrice < 0) return { ok: false as const, error: "El precio mensual no puede ser negativo" };
    data.monthlyPrice = input.monthlyPrice;
    // Si solo cambian el mensual y no el anual, recalcular anual (×12)
    if (input.price === undefined) {
      data.price = input.monthlyPrice * 12;
    }
  }
  if (input.compareAtPrice !== undefined) data.compareAtPrice = input.compareAtPrice;
  if (input.active !== undefined) data.active = input.active;
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.shortDescription !== undefined) data.shortDescription = input.shortDescription?.trim() || null;
  if (input.stockQuantity !== undefined) {
    if (input.stockQuantity < 0) return { ok: false as const, error: "Stock inválido" };
    data.stockQuantity = input.stockQuantity;
  }

  await prisma.product.update({
    where: { id: input.productId },
    data,
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/api/store/catalog");
  return { ok: true as const };
}

/**
 * Guarda credenciales de configuración de la tienda (Mercado Pago, Mercado Envíos)
 */
export async function updateStoreSettings(input: {
  mpAccessToken?: string;
  mpPublicKey?: string;
  mpWebhookSecret?: string;
  mpSandbox?: boolean;
  shippingOriginAddress?: string;
  shippingOriginPostalCode?: string;
}) {
  await requireRole("SUPERADMIN");

  const promises: any[] = [];

  if (input.mpAccessToken !== undefined) {
    promises.push(
      prisma.storeSetting.upsert({
        where: { id: "default" },
        update: { mpAccessToken: input.mpAccessToken.trim() },
        create: { id: "default", mpAccessToken: input.mpAccessToken.trim() },
      })
    );
  }

  if (input.mpPublicKey !== undefined) {
    promises.push(
      prisma.storeSetting.upsert({
        where: { id: "default" },
        update: { mpPublicKey: input.mpPublicKey.trim() },
        create: { id: "default", mpPublicKey: input.mpPublicKey.trim() },
      })
    );
  }

  if (input.mpWebhookSecret !== undefined) {
    promises.push(
      prisma.storeSetting.upsert({
        where: { id: "default" },
        update: { mpWebhookSecret: input.mpWebhookSecret.trim() },
        create: { id: "default", mpWebhookSecret: input.mpWebhookSecret.trim() },
      })
    );
  }

  if (input.mpSandbox !== undefined) {
    promises.push(
      prisma.storeSetting.upsert({
        where: { id: "default" },
        update: { mpSandbox: input.mpSandbox },
        create: { id: "default", mpSandbox: input.mpSandbox },
      })
    );
  }

  if (input.shippingOriginAddress !== undefined) {
    promises.push(
      prisma.storeSetting.upsert({
        where: { id: "default" },
        update: { shippingOriginAddress: input.shippingOriginAddress.trim() },
        create: { id: "default", shippingOriginAddress: input.shippingOriginAddress.trim() },
      })
    );
  }

  if (input.shippingOriginPostalCode !== undefined) {
    promises.push(
      prisma.storeSetting.upsert({
        where: { id: "default" },
        update: { shippingOriginPostalCode: input.shippingOriginPostalCode.trim() },
        create: { id: "default", shippingOriginPostalCode: input.shippingOriginPostalCode.trim() },
      })
    );
  }

  await Promise.all(promises);

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateResendApiKey(apiKey: string) {
  await requireRole("SUPERADMIN");
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: { resendApiKey: apiKey.trim() },
    create: { id: "default", resendApiKey: apiKey.trim() },
  });
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function upsertStoreMailbox(input: {
  id?: string;
  email: string;
  label: string;
  role?: string;
  active?: boolean;
  notes?: string | null;
}) {
  await requireRole("SUPERADMIN");
  const email = input.email.trim().toLowerCase();
  const label = input.label.trim() || email;
  const role = (input.role || "GENERAL").trim().toUpperCase();
  const active = input.active ?? true;

  if (!email.includes("@")) {
    return { ok: false as const, error: "Email inválido" };
  }

  if (input.id) {
    await prisma.storeMailbox.update({
      where: { id: input.id },
      data: { email, label, role, active, notes: input.notes?.trim() || null },
    });
  } else {
    await prisma.storeMailbox.upsert({
      where: { email },
      update: { label, role, active, notes: input.notes?.trim() || null },
      create: { email, label, role, active, notes: input.notes?.trim() || null },
    });
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function setStoreMailboxActive(input: { id: string; active: boolean }) {
  await requireRole("SUPERADMIN");
  await prisma.storeMailbox.update({
    where: { id: input.id },
    data: { active: input.active },
  });
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function sendAdminTestPurchaseEmail(toEmail: string) {
  await requireRole("SUPERADMIN");
  const email = toEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false as const, error: "Email inválido" };
  }
  const { sendTestPurchaseReceiptEmail } = await import("@/server/email/send-purchase-email");
  return sendTestPurchaseReceiptEmail(email);
}
