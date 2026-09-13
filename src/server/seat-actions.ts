"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generatePublicId } from "@/lib/id";
import { normalizeSlug } from "@/lib/utils";

const AssignSeatSchema = z.object({
  orderId: z.string(),
  seatId: z.string(),
  accessToken: z.string().optional().nullable(),
  email: z.string().email(),
  name: z.string().min(2).max(120),
});

function randomPassword() {
  // Readable enough for buyer to copy once; user should change later.
  const chunk = () => Math.random().toString(36).slice(2, 8);
  return `Volt-${chunk()}${chunk()}!`;
}

/**
 * Quick allotment for extra cards in a multi-unit order:
 * creates User + Profile (pending) with a temporary password.
 * Does NOT run the full onboarding wizard.
 */
export async function assignOrderSeat(input: z.infer<typeof AssignSeatSchema>) {
  const parsed = AssignSeatSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Datos inválidos" };

  const { orderId, seatId, email, name, accessToken } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const { assertOrderAccess } = await import("@/server/order-access");
  const access = await assertOrderAccess(orderId, accessToken);
  if (!access.ok || access.order.paymentStatus !== "APPROVED") {
    return { ok: false as const, error: "No autorizado o pedido no pagado" };
  }

  const seat = await prisma.orderSeat.findUnique({ where: { id: seatId } });
  if (!seat || seat.orderId !== orderId) {
    return { ok: false as const, error: "Asiento no encontrado" };
  }
  if (seat.status === "PRIMARY") {
    return { ok: false as const, error: "El asiento principal se configura en el wizard" };
  }
  if (seat.status === "ASSIGNED" || seat.status === "CONFIGURED") {
    return { ok: false as const, error: "Este asiento ya fue asignado" };
  }

  // Reuse existing user by email if present
  let user = await prisma.user.findUnique({
    where: { email: emailNorm },
    include: { profile: true },
  });

  let tempPassword: string | null = null;

  if (!user) {
    tempPassword = randomPassword();
    try {
      const signup = await auth.api.signUpEmail({
        body: { name: name.trim(), email: emailNorm, password: tempPassword },
      });
      const userId = signup?.user?.id;
      if (!userId) throw new Error("No se pudo crear el usuario");
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
    } catch (err: any) {
      return { ok: false as const, error: err?.message || "Error creando usuario" };
    }
  }

  if (!user) return { ok: false as const, error: "No se pudo resolver el usuario" };

  let profile = user.profile;
  if (!profile) {
    let baseSlug = normalizeSlug(name) || normalizeSlug(emailNorm.split("@")[0]) || "card";
    if (baseSlug.length < 3) baseSlug = `${baseSlug}-card`;
    let candidate = baseSlug;
    let i = 1;
    while (await prisma.profile.findUnique({ where: { slug: candidate }, select: { id: true } })) {
      i += 1;
      candidate = `${baseSlug}-${i}`;
    }

    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        publicId: generatePublicId(),
        slug: candidate,
        fullName: name.trim(),
        email: emailNorm,
        source: "ECOMMERCE",
        sourceOrderId: orderId,
        sourceOrderNumber: access.order.orderNumber,
        profileStatus: "PENDING_CONFIGURATION",
        onboardingStatus: "NOT_STARTED",
        onboardingStep: 1,
      },
    });
  }

  await prisma.orderSeat.update({
    where: { id: seatId },
    data: {
      status: "ASSIGNED",
      profileId: profile.id,
      assigneeEmail: emailNorm,
      assigneeName: name.trim(),
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId,
      type: "seat.assigned",
      title: `Tarjeta #${seat.seatIndex + 1} asignada`,
      detail: `Alta rápida para ${name.trim()} <${emailNorm}> — perfil /${profile.slug} pendiente de configuración.`,
    },
  });

  revalidatePath(`/onboarding/${orderId}`);
  revalidatePath(`/onboarding/${orderId}/seats`);
  revalidatePath("/admin");

  return {
    ok: true as const,
    profileId: profile.id,
    slug: profile.slug,
    email: emailNorm,
    tempPassword, // only returned when we just created the account
  };
}

export async function getOrderSeats(orderId: string) {
  return prisma.orderSeat.findMany({
    where: { orderId },
    orderBy: { seatIndex: "asc" },
    include: {
      profile: { select: { id: true, slug: true, fullName: true, profileStatus: true } },
    },
  });
}
