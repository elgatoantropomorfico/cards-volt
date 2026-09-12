"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeSlug, isValidSlug } from "@/lib/utils";
import { TEMPLATE_VALUES, type LinkKind } from "@/lib/profile-types";
import { normalizeLinkUrl } from "@/lib/socials";

const KIND_VALUES = [
  "WEBSITE", "INSTAGRAM", "LINKEDIN", "TWITTER", "FACEBOOK", "YOUTUBE", "TIKTOK", "GITHUB", "SPOTIFY", "CALENDAR", "EMAIL", "PHONE", "WHATSAPP", "MAP", "PDF", "OTHER",
] as const;

const OnboardingAutosaveSchema = z.object({
  orderId: z.string(),
  profileId: z.string(),
  currentStep: z.number().int().min(1).max(7),
  // Step 1: Identity
  fullName: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  // Step 2: Slug
  slug: z.string().optional().nullable(),
  // Step 3: Contact
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  // Step 4: Socials
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  // Step 5: Design
  template: z.enum(TEMPLATE_VALUES).optional(),
  primaryColor: z.string().optional(),
  themeMode: z.enum(["LIGHT", "DARK"]).optional(),
  coverUrl: z.string().optional().nullable(),
});

export async function autosaveOnboarding(input: z.infer<typeof OnboardingAutosaveSchema>) {
  const parsed = OnboardingAutosaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const { orderId, profileId, currentStep, ...data } = parsed.data;

  // Verify association between order and profile
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, profileId: true },
  });

  if (!order || order.profileId !== profileId) {
    return { ok: false, error: "No autorizado para este perfil" };
  }

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
      // Check collision
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
  kind: LinkKind;
  label: string;
  url: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { profileId: true },
  });

  if (!order || order.profileId !== input.profileId) {
    return { ok: false, error: "No autorizado" };
  }

  const url = normalizeLinkUrl(input.kind, input.url);
  const count = await prisma.link.count({ where: { profileId: input.profileId } });

  const link = await prisma.link.create({
    data: {
      profileId: input.profileId,
      kind: input.kind,
      label: input.label.trim(),
      url,
      order: count,
    },
  });

  return { ok: true, link };
}

export async function deleteOnboardingLink(input: {
  orderId: string;
  profileId: string;
  linkId: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { profileId: true },
  });

  if (!order || order.profileId !== input.profileId) {
    return { ok: false, error: "No autorizado" };
  }

  await prisma.link.deleteMany({
    where: { id: input.linkId, profileId: input.profileId },
  });

  return { ok: true };
}

/**
 * Paso final de confirmación del onboarding:
 * profileStatus -> READY
 * fulfillmentStatus -> READY_FOR_PRODUCTION
 * Registra evento en timeline
 */
export async function finalizeOnboarding(input: { orderId: string; profileId: string }) {
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
        onboardingStep: 7,
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

  return { ok: true };
}
