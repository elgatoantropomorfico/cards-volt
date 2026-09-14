import { generatePublicId } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { createEcommerceProfile } from "@/server/create-ecommerce-profile";

/**
 * Repairs orders left with a dangling userId (User deleted) or missing profile
 * after support resets fulfillment / deletes the buyer account.
 *
 * - Rebinds buyer by email (create User if needed)
 * - If that user has profiles → leave profileId null (choice UI)
 * - If not → create a fresh PENDING ecommerce profile and link it
 *
 * Does nothing when the order is already in a valid "choose profile" state.
 */
export async function repairOrderBuyerBinding(orderId: string): Promise<{
  repaired: boolean;
  needsProfileChoice: boolean;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      customerName: true,
      phone: true,
      orderNumber: true,
      paymentStatus: true,
      userId: true,
      profileId: true,
    },
  });

  if (!order || order.paymentStatus !== "APPROVED") {
    return { repaired: false, needsProfileChoice: false };
  }

  if (order.profileId) {
    const linked = await prisma.profile.findUnique({
      where: { id: order.profileId },
      select: { id: true },
    });
    if (linked) {
      return { repaired: false, needsProfileChoice: false };
    }
  }

  // Valid multi-profile choice: live user, no profile linked yet
  if (order.userId && !order.profileId) {
    const liveUser = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { id: true },
    });
    if (liveUser) {
      const count = await prisma.profile.count({ where: { userId: liveUser.id } });
      if (count > 0) {
        return { repaired: false, needsProfileChoice: true };
      }
      // Live user with zero profiles → create one below
    }
  }

  let userId = order.userId;
  let user =
    userId != null
      ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      : null;

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: order.email },
      select: { id: true },
    });
  }

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
      select: { id: true },
    });
  }

  userId = user.id;
  const existingCount = await prisma.profile.count({ where: { userId } });

  if (existingCount > 0) {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          userId,
          profileId: null,
          events: {
            create: {
              type: "buyer.rebound",
              title: "Comprador revinculado",
              detail:
                "La cuenta del pedido no existía o quedó huérfana. Se revinculó por email; el cliente debe elegir perfil.",
            },
          },
        },
      }),
      prisma.orderSeat.updateMany({
        where: { orderId: order.id, status: "PRIMARY" },
        data: { profileId: null },
      }),
    ]);
    return { repaired: true, needsProfileChoice: true };
  }

  const profile = await createEcommerceProfile({
    userId,
    fullName: order.customerName,
    email: order.email,
    phone: order.phone,
    orderId: order.id,
    orderNumber: order.orderNumber,
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        userId,
        profileId: profile.id,
        events: {
          create: {
            type: "buyer.reprovisioned",
            title: "Cuenta y perfil recreados",
            detail: `Se recreó la cuenta del comprador y un perfil pendiente /${profile.slug} para continuar el wizard.`,
          },
        },
      },
    }),
    prisma.orderSeat.updateMany({
      where: { orderId: order.id, status: "PRIMARY" },
      data: { profileId: profile.id },
    }),
  ]);

  return { repaired: true, needsProfileChoice: false };
}
