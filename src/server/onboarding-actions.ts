"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeSlug, isValidSlug } from "@/lib/utils";
import { TEMPLATE_VALUES, type LinkKind } from "@/lib/profile-types";
import { normalizeLinkUrl } from "@/lib/socials";
import { optionalHttpUrl } from "@/lib/validation";
import { assertOrderAccess } from "@/server/order-access";
import { auth } from "@/lib/auth";

const KIND_VALUES = [
  "WEBSITE", "INSTAGRAM", "LINKEDIN", "TWITTER", "FACEBOOK", "YOUTUBE", "TIKTOK", "GITHUB", "SPOTIFY", "CALENDAR", "EMAIL", "PHONE", "WHATSAPP", "MAP", "PDF", "OTHER",
] as const;

const OnboardingAutosaveSchema = z.object({
  orderId: z.string(),
  profileId: z.string(),
  accessToken: z.string().optional().nullable(),
  currentStep: z.number().int().min(1).max(8),
  fullName: z.string().max(120).optional().nullable(),
  jobTitle: z.string().max(120).optional().nullable(),
  companyName: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  avatarUrl: optionalHttpUrl,
  slug: z.string().max(40).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  website: z.string().max(300).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  instagram: z.string().max(120).optional().nullable(),
  linkedin: z.string().max(200).optional().nullable(),
  twitter: z.string().max(120).optional().nullable(),
  tiktok: z.string().max(120).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  github: z.string().max(120).optional().nullable(),
  template: z.enum(TEMPLATE_VALUES).optional(),
  primaryColor: z.string().max(20).optional(),
  themeMode: z.enum(["LIGHT", "DARK"]).optional(),
  coverUrl: optionalHttpUrl,
});

async function guardOrderProfile(
  orderId: string,
  profileId: string,
  accessToken?: string | null,
) {
  const access = await assertOrderAccess(orderId, accessToken);
  if (!access.ok) return { ok: false as const, error: access.error };
  if (access.order.paymentStatus !== "APPROVED") {
    return { ok: false as const, error: "Pedido no aprobado" };
  }
  if (access.order.profileId !== profileId) {
    return { ok: false as const, error: "No autorizado para este perfil" };
  }
  return { ok: true as const, access };
}

export async function autosaveOnboarding(input: z.infer<typeof OnboardingAutosaveSchema>) {
  const parsed = OnboardingAutosaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const { orderId, profileId, accessToken, currentStep, ...data } = parsed.data;
  const gate = await guardOrderProfile(orderId, profileId, accessToken);
  if (!gate.ok) return gate;

  const updateData: any = {
    onboardingStatus: "IN_PROGRESS",
    onboardingStep: currentStep,
    profileStatus: "CONFIGURING",
  };

  if (data.fullName !== undefined) updateData.fullName = data.fullName?.trim() || "";
  if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle?.trim() || null;
  if (data.companyName !== undefined) updateData.companyName = data.companyName?.trim() || null;
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;

  if (data.slug !== undefined && data.slug) {
    const s = normalizeSlug(data.slug);
    if (isValidSlug(s)) {
      const exists = await prisma.profile.findUnique({
        where: { slug: s },
        select: { id: true },
      });
      if (!exists || exists.id === profileId) {
        updateData.slug = s;
      }
    }
  }

  if (data.email !== undefined) updateData.email = data.email?.trim() || null;
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp?.trim() || null;
  if (data.website !== undefined) updateData.website = data.website?.trim() || null;
  if (data.location !== undefined) updateData.location = data.location?.trim() || null;

  if (data.instagram !== undefined) updateData.instagram = data.instagram?.trim() || null;
  if (data.linkedin !== undefined) updateData.linkedin = data.linkedin?.trim() || null;
  if (data.twitter !== undefined) updateData.twitter = data.twitter?.trim() || null;
  if (data.tiktok !== undefined) updateData.tiktok = data.tiktok?.trim() || null;
  if (data.youtube !== undefined) updateData.youtube = data.youtube?.trim() || null;
  if (data.github !== undefined) updateData.github = data.github?.trim() || null;

  if (data.template !== undefined) updateData.template = data.template;
  if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
  if (data.themeMode !== undefined) updateData.themeMode = data.themeMode;
  if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl || null;

  await prisma.profile.update({
    where: { id: profileId },
    data: updateData,
  });

  return { ok: true };
}

/**
 * Agrega o actualiza links del onboarding
 */
export async function addOnboardingLink(input: {
  orderId: string;
  profileId: string;
  accessToken?: string | null;
  kind: LinkKind;
  label: string;
  url: string;
}) {
  const gate = await guardOrderProfile(input.orderId, input.profileId, input.accessToken);
  if (!gate.ok) return gate;

  const url = normalizeLinkUrl(input.kind, input.url);
  const count = await prisma.link.count({ where: { profileId: input.profileId } });

  const link = await prisma.link.create({
    data: {
      profileId: input.profileId,
      kind: input.kind,
      label: input.label.trim().slice(0, 80),
      url: url.slice(0, 500),
      order: count,
    },
  });

  return { ok: true, link };
}

export async function deleteOnboardingLink(input: {
  orderId: string;
  profileId: string;
  accessToken?: string | null;
  linkId: string;
}) {
  const gate = await guardOrderProfile(input.orderId, input.profileId, input.accessToken);
  if (!gate.ok) return gate;

  await prisma.link.deleteMany({
    where: { id: input.linkId, profileId: input.profileId },
  });

  return { ok: true };
}

/**
 * Paso final de confirmación del onboarding
 */
export async function finalizeOnboarding(input: {
  orderId: string;
  profileId: string;
  accessToken?: string | null;
}) {
  const gate = await guardOrderProfile(input.orderId, input.profileId, input.accessToken);
  if (!gate.ok) return gate;

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { profile: true },
  });

  if (!order || order.profileId !== input.profileId) {
    return { ok: false, error: "Orden o perfil no encontrados" };
  }

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: input.profileId },
      data: {
        profileStatus: "READY",
        onboardingStatus: "COMPLETED",
        onboardingDoneAt: new Date(),
        onboardingStep: 8,
      },
    }),
    prisma.order.update({
      where: { id: input.orderId },
      data: {
        fulfillmentStatus: "READY_FOR_PRODUCTION",
        events: {
          create: [
            {
              type: "profile.ready",
              title: "Perfil configurado y listo",
              detail: `El cliente finalizó el wizard de configuración. Perfil: /${order.profile?.slug || ""}`,
            },
            {
              type: "production.ready",
              title: "Listo para producción",
              detail: `QR y NFC vinculados a URL permanente: /c/${order.profile?.publicId || ""}`,
            },
          ],
        },
      },
    }),
  ]);

  if (order.profile?.slug) {
    revalidatePath(`/${order.profile.slug}`);
  }
  revalidatePath(`/c/${order.profile?.publicId}`);
  revalidatePath(`/admin`);

  const pendingSeats = await prisma.orderSeat.count({
    where: { orderId: input.orderId, status: "PENDING_ASSIGNMENT" },
  });

  return { ok: true, pendingSeats };
}

/**
 * Primer paso del wizard: crea la contraseña de login del comprador.
 */
export async function setOnboardingPassword(input: {
  orderId: string;
  profileId: string;
  accessToken?: string | null;
  password: string;
}) {
  const password = input.password.trim();
  if (password.length < 8) {
    return { ok: false as const, error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (password.length > 128) {
    return { ok: false as const, error: "Contraseña demasiado larga" };
  }

  const gate = await guardOrderProfile(input.orderId, input.profileId, input.accessToken);
  if (!gate.ok) return gate;

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, profileId: true, userId: true, email: true },
  });

  if (!order || order.profileId !== input.profileId || !order.userId) {
    return { ok: false as const, error: "No autorizado" };
  }

  const { hashPassword } = await import("better-auth/crypto");
  const { generatePublicId } = await import("@/lib/id");
  const hashed = await hashPassword(password);

  const existing = await prisma.account.findFirst({
    where: { userId: order.userId, providerId: "credential" },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        id: generatePublicId() + generatePublicId(),
        accountId: order.userId,
        providerId: "credential",
        userId: order.userId,
        password: hashed,
      },
    });
  }

  await prisma.profile.update({
    where: { id: input.profileId },
    data: {
      onboardingStatus: "IN_PROGRESS",
      onboardingStep: 2,
      profileStatus: "CONFIGURING",
    },
  });

  // Sign the buyer in so subsequent uploads/dashboard work with session auth
  try {
    await auth.api.signInEmail({
      body: { email: order.email, password },
      headers: await headers(),
    });
  } catch (err) {
    console.warn("[onboarding] auto sign-in after password failed", err);
  }

  return { ok: true as const };
}
