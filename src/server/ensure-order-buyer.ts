import { generatePublicId } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { createEcommerceProfile } from "@/server/create-ecommerce-profile";

/**
 * When the customer opens the email onboarding link and the order has no
 * usable buyer/profile (e.g. admin deleted the account), provision the same
 * day-1 state as post-payment fulfillment: User + pending Profile.
 *
 * Does not invent accounts from admin tools — only when the tokenized link is used.
 */
export async function ensureBuyerForOnboardingLink(orderId: string): Promise<{
  provisioned: boolean;
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
    return { provisioned: false, needsProfileChoice: false };
  }

  if (order.profileId) {
    const linked = await prisma.profile.findUnique({
      where: { id: order.profileId },
      select: { id: true },
    });
    if (linked) {
      return { provisioned: false, needsProfileChoice: false };
    }
  }

  // Live user with other profiles and no link → choice UI (no auto-create)
  if (order.userId) {
    const liveUser = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { id: true },
    });
    if (liveUser) {
      const count = await prisma.profile.count({ where: { userId: liveUser.id } });
      if (count > 0) {
        return { provisioned: false, needsProfileChoice: true };
      }
    } else {
      // Orphan userId from a delete that didn't clear — wipe before day-1 provision
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: null, profileId: null },
      });
    }
  }

  // Prefer existing account by purchase email (re-buy / soft recovery)
  let user = await prisma.user.findUnique({
    where: { email: order.email },
    select: { id: true },
  });

  if (user) {
    const count = await prisma.profile.count({ where: { userId: user.id } });
    if (count > 0) {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            userId: user.id,
            profileId: null,
            fulfillmentStatus: "AWAITING_PROFILE",
          },
        }),
        prisma.orderSeat.updateMany({
          where: { orderId: order.id, status: "PRIMARY" },
          data: { profileId: null },
        }),
      ]);
      return { provisioned: true, needsProfileChoice: true };
    }
  } else {
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

  const profile = await createEcommerceProfile({
    userId: user.id,
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
        userId: user.id,
        profileId: profile.id,
        fulfillmentStatus: "AWAITING_PROFILE",
        events: {
          create: {
            type: "onboarding.day1_from_link",
            title: "Wizard reiniciado desde el link",
            detail: `Cuenta/perfil pendientes recreados al abrir el link del correo (/${profile.slug}).`,
          },
        },
      },
    }),
    prisma.orderSeat.updateMany({
      where: { orderId: order.id, status: "PRIMARY" },
      data: { profileId: profile.id },
    }),
  ]);

  return { provisioned: true, needsProfileChoice: false };
}
