"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertOrderAccess } from "@/server/order-access";
import { createEcommerceProfile } from "@/server/create-ecommerce-profile";

export async function associateOrderToExistingProfile(input: {
  orderId: string;
  profileId: string;
  accessToken?: string | null;
}) {
  const access = await assertOrderAccess(input.orderId, input.accessToken);
  if (!access.ok || access.order.paymentStatus !== "APPROVED") {
    return { ok: false as const, error: "No autorizado" };
  }
  if (!access.order.userId) {
    return { ok: false as const, error: "Pedido sin usuario" };
  }

  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, userId: access.order.userId },
  });
  if (!profile) {
    return { ok: false as const, error: "Perfil no encontrado en esta cuenta" };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: input.orderId },
      data: {
        profileId: profile.id,
        // Associating to an existing ready profile completes THIS purchase's config
        fulfillmentStatus:
          profile.profileStatus === "READY" ? "READY_FOR_PRODUCTION" : "AWAITING_PROFILE",
        events: {
          create: {
            type: "profile.associated",
            title: "Tarjeta asociada a perfil existente",
            detail: `Pedido vinculado a /${profile.slug}`,
          },
        },
      },
    }),
    prisma.orderSeat.updateMany({
      where: { orderId: input.orderId, status: "PRIMARY" },
      data: { profileId: profile.id },
    }),
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        sourceOrderId: input.orderId,
        sourceOrderNumber: access.order.orderNumber,
      },
    }),
  ]);

  revalidatePath(`/onboarding/${input.orderId}`);
  revalidatePath("/dashboard");
  return { ok: true as const, mode: "associate" as const, slug: profile.slug };
}

export async function createNewProfileForOrder(input: {
  orderId: string;
  accessToken?: string | null;
}) {
  const access = await assertOrderAccess(input.orderId, input.accessToken);
  if (!access.ok || access.order.paymentStatus !== "APPROVED") {
    return { ok: false as const, error: "No autorizado" };
  }
  if (!access.order.userId) {
    return { ok: false as const, error: "Pedido sin usuario" };
  }

  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false as const, error: "Pedido no encontrado" };
  if (order.profileId) {
    return { ok: true as const, mode: "existing" as const, profileId: order.profileId };
  }

  const profile = await createEcommerceProfile({
    userId: access.order.userId,
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
        profileId: profile.id,
        events: {
          create: {
            type: "profile.created",
            title: "Nuevo perfil para esta compra",
            detail: `Perfil /${profile.slug} creado para configurar`,
          },
        },
      },
    }),
    prisma.orderSeat.updateMany({
      where: { orderId: order.id, status: "PRIMARY" },
      data: { profileId: profile.id },
    }),
  ]);

  revalidatePath(`/onboarding/${input.orderId}`);
  return { ok: true as const, mode: "create" as const, profileId: profile.id };
}
