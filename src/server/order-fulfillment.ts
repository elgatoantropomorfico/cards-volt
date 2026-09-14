import { prisma } from "@/lib/prisma";
import { generatePublicId } from "@/lib/id";

/**
 * Handles approved order idempotently:
 * 1. Confirms Order (paidAt, paymentStatus = APPROVED)
 * 2. Deducts Stock & logs InventoryMovement
 * 3. Creates or links existing User
 * 4. Creates Profile for new accounts, or defers choice if account already has profiles
 * 5. Logs timeline events
 */
export async function handleApprovedOrder({
  orderId,
  paymentId,
  paymentMethod,
  rawPayload,
}: {
  orderId: string;
  paymentId?: string;
  paymentMethod?: string;
  rawPayload?: any;
}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      payments: true,
      profile: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Idempotency: If order was already confirmed and approved, skip re-execution
  // but still try to send purchase email if it never went out (e.g. Resend key added later)
  if (order.paymentStatus === "APPROVED" && order.profileId) {
    if (!order.purchaseEmailSentAt) {
      try {
        const { sendPurchaseReceiptEmail } = await import("@/server/email/send-purchase-email");
        await sendPurchaseReceiptEmail(order.id);
      } catch (err) {
        console.error("[fulfillment] purchase email retry failed", err);
      }
    }
    return { ok: true, order, alreadyProcessed: true };
  }

  const now = new Date();

  // 1. Record or update Payment
  if (paymentId) {
    const existingPayment = await prisma.payment.findUnique({
      where: { externalPaymentId: paymentId },
    });
    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "mercadopago",
          externalPaymentId: paymentId,
          externalReference: order.id,
          status: "APPROVED",
          amount: order.total,
          currency: order.currency,
          paymentMethod: paymentMethod || "mercadopago",
          rawPayload: rawPayload ?? undefined,
          paidAt: now,
        },
      });
    }
  }

  // 2. Affect Stock idempotently
  for (const item of order.items) {
    if (item.product.stockManaged) {
      // Check if inventory movement was already registered for this order
      const existingMovement = await prisma.inventoryMovement.findFirst({
        where: { orderId: order.id, productId: item.productId },
      });

      if (!existingMovement) {
        await prisma.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            quantity: -item.quantity,
            type: "SALE",
            orderId: order.id,
            note: `Venta aprobada #${order.orderNumber}`,
          },
        });

        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }
  }

  // 3. User association or creation
  let user = await prisma.user.findUnique({
    where: { email: order.email },
    include: { profiles: { select: { id: true }, take: 5 } },
  });

  if (!user) {
    const newUserId = generatePublicId() + generatePublicId();
    user = await prisma.user.create({
      data: {
        id: newUserId,
        name: order.customerName,
        email: order.email,
        emailVerified: true,
        role: "USER",
      },
      include: { profiles: { select: { id: true }, take: 5 } },
    });
  }

  // 4. Profile strategy:
  // - New account → create profile immediately
  // - Existing account with profiles → leave profileId null so onboarding asks
  //   "asociar a perfil existente" vs "configurar uno nuevo" (avoids crash / overwrite)
  let profile = order.profile;
  let needsProfileChoice = false;

  if (!profile) {
    const existingCount = await prisma.profile.count({ where: { userId: user.id } });
    if (existingCount > 0) {
      needsProfileChoice = true;
    } else {
      const { createEcommerceProfile } = await import("@/server/create-ecommerce-profile");
      profile = await createEcommerceProfile({
        userId: user.id,
        fullName: order.customerName,
        email: order.email,
        phone: order.phone,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }
  }

  // 5. Update Order to APPROVED and link User (& Profile if ready)
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      userId: user.id,
      profileId: profile?.id ?? null,
      paymentStatus: "APPROVED",
      paidAt: now,
      fulfillmentStatus: "AWAITING_PROFILE",
      events: {
        create: [
          {
            type: "payment.approved",
            title: "Pago confirmado",
            detail: `Pago aprobado por Mercado Pago (Referencia: ${paymentId || "Direct"})`,
          },
          profile
            ? {
                type: "profile.created",
                title: "Perfil digital creado",
                detail: `Perfil principal creado con slug provisional /${profile.slug} (wizard del comprador)`,
              }
            : {
                type: "profile.choice_required",
                title: "Elegir perfil para la compra",
                detail:
                  "La cuenta ya tenía perfiles. El comprador debe asociar esta tarjeta a uno existente o crear uno nuevo.",
              },
        ],
      },
    },
    include: { profile: true, items: true, events: true },
  });

  // 6. Create one seat per physical card unit (idempotent)
  const existingSeats = await prisma.orderSeat.count({ where: { orderId: order.id } });
  if (existingSeats === 0) {
    let seatIndex = 0;
    const seatCreates: {
      orderId: string;
      productId: string;
      seatIndex: number;
      status: "PRIMARY" | "PENDING_ASSIGNMENT";
      profileId: string | null;
    }[] = [];

    for (const item of order.items) {
      for (let q = 0; q < item.quantity; q++) {
        const isPrimary = seatIndex === 0;
        seatCreates.push({
          orderId: order.id,
          productId: item.productId,
          seatIndex,
          status: isPrimary ? "PRIMARY" : "PENDING_ASSIGNMENT",
          profileId: isPrimary && profile ? profile.id : null,
        });
        seatIndex += 1;
      }
    }

    if (seatCreates.length) {
      await prisma.orderSeat.createMany({ data: seatCreates });
      const extra = Math.max(0, seatCreates.length - 1);
      if (extra > 0) {
        await prisma.orderEvent.create({
          data: {
            orderId: order.id,
            type: "seats.created",
            title: `${extra} tarjeta(s) extra pendientes de asignación`,
            detail:
              "El comprador configura 1 perfil en el wizard. Las demás se dan de alta con email + contraseña sin completar el onboarding completo.",
          },
        });
      }
    }
  }

  // 7. Ensure buyer access token + purchase receipt email
  try {
    const { ensureOrderAccessToken } = await import("@/server/order-access");
    await ensureOrderAccessToken(order.id);
  } catch (err) {
    console.error("[fulfillment] access token failed", err);
  }

  try {
    const { sendPurchaseReceiptEmail } = await import("@/server/email/send-purchase-email");
    await sendPurchaseReceiptEmail(order.id);
  } catch (err) {
    console.error("[fulfillment] purchase email failed", err);
  }

  return {
    ok: true,
    order: updatedOrder,
    alreadyProcessed: false,
    needsProfileChoice,
  };
}
