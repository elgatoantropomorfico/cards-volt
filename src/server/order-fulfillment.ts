import { prisma } from "@/lib/prisma";
import { generatePublicId } from "@/lib/id";
import { normalizeSlug } from "@/lib/utils";

/**
 * Handles approved order idempotently:
 * 1. Confirms Order (paidAt, paymentStatus = APPROVED)
 * 2. Deducts Stock & logs InventoryMovement
 * 3. Creates or links existing User
 * 4. Automatically creates new Profile with:
 *    - source = ECOMMERCE
 *    - sourceOrderId = order.id
 *    - sourceOrderNumber = order.orderNumber
 *    - profileStatus = PENDING_CONFIGURATION
 *    - onboardingStatus = NOT_STARTED
 *    - publicId = generatePublicId()
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
  if (order.paymentStatus === "APPROVED" && order.profileId) {
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
    include: { profile: true },
  });

  if (!user) {
    // Generate secure internal user ID for Better Auth compatibility
    const newUserId = generatePublicId() + generatePublicId();
    user = await prisma.user.create({
      data: {
        id: newUserId,
        name: order.customerName,
        email: order.email,
        emailVerified: true,
        role: "USER",
      },
      include: { profile: true },
    });
  }

  // 4. Automatic Profile Creation
  // Rule: A purchase automatically creates a Profile linked to the order!
  let profile = order.profile;

  if (!profile) {
    // If the user doesn't have a profile or this is a new purchase:
    let baseSlug = normalizeSlug(order.customerName) || "user";
    if (baseSlug.length < 3) baseSlug = `${baseSlug}-card`;
    let candidateSlug = baseSlug;
    let i = 1;

    while (await prisma.profile.findUnique({ where: { slug: candidateSlug }, select: { id: true } })) {
      i += 1;
      candidateSlug = `${baseSlug}-${i}`;
    }

    // Check if user already has a profile (since 1 user currently has 1 profile relation in schema)
    const existingUserProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (existingUserProfile) {
      // User exists and already has a profile: Link order to this profile and mark it
      profile = await prisma.profile.update({
        where: { id: existingUserProfile.id },
        data: {
          sourceOrderId: order.id,
          sourceOrderNumber: order.orderNumber,
        },
      });
    } else {
      // Create new profile for this user
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          publicId: generatePublicId(),
          slug: candidateSlug,
          fullName: order.customerName,
          email: order.email,
          phone: order.phone,
          source: "ECOMMERCE",
          sourceOrderId: order.id,
          sourceOrderNumber: order.orderNumber,
          profileStatus: "PENDING_CONFIGURATION",
          onboardingStatus: "NOT_STARTED",
          onboardingStep: 1,
        },
      });
    }
  }

  // 5. Update Order to APPROVED and link User & Profile
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      userId: user.id,
      profileId: profile.id,
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
          {
            type: "profile.created",
            title: "Perfil digital creado",
            detail: `Perfil creado con slug provisional /${profile.slug} esperando configuración del cliente`,
          },
        ],
      },
    },
    include: { profile: true, items: true, events: true },
  });

  return { ok: true, order: updatedOrder, alreadyProcessed: false };
}
