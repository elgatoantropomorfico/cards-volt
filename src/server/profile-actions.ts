"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isValidSlug, normalizeSlug } from "@/lib/utils";
import type { LinkKind } from "@/lib/profile-types";
import { TEMPLATE_VALUES } from "@/lib/profile-types";
import { normalizeLinkUrl } from "@/lib/socials";
import { formatZodError, optionalEmail, optionalHttpUrl, optionalWebsite } from "@/lib/validation";

import { generatePublicId } from "@/lib/id";

const KIND_VALUES = [
  "WEBSITE","INSTAGRAM","LINKEDIN","TWITTER","FACEBOOK","YOUTUBE","TIKTOK","GITHUB","SPOTIFY","CALENDAR","EMAIL","PHONE","WHATSAPP","MAP","PDF","OTHER",
] as const;

const ProfileSchema = z.object({
  slug: z.string(),
  fullName: z.string().min(1).max(120),
  jobTitle: z.string().max(120).optional().nullable(),
  companyName: z.string().max(120).optional().nullable(),
  description: z.string().max(600).optional().nullable(),
  email: optionalEmail,
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  website: optionalWebsite,
  location: z.string().max(160).optional().nullable(),
  instagram: z.string().max(80).optional().nullable(),
  linkedin: z.string().max(200).optional().nullable(),
  twitter: z.string().max(80).optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  tiktok: z.string().max(80).optional().nullable(),
  github: z.string().max(200).optional().nullable(),
  alias: z.string().max(80).optional().nullable(),
  showSaveContact: z.boolean().optional(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

async function loadOwnedProfile(preferredId?: string | null) {
  const user = await requireUser();
  const profiles = user.profiles || [];

  if (profiles.length === 0) {
    const slug = await generateUniqueSlug(user.name || user.email.split("@")[0]);
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        slug,
        publicId: generatePublicId(),
        fullName: user.name || user.email,
        email: user.email,
      },
    });
    return { user, profile, profiles: [profile] };
  }

  const { resolveActiveProfileId } = await import("@/lib/session");
  const activeId = await resolveActiveProfileId(user.id, profiles, preferredId);
  let profile = profiles.find((p) => p.id === activeId) || profiles[0];

  if (!profile.publicId) {
    const publicId = generatePublicId();
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: { publicId },
    });
  }

  return { user, profile, profiles };
}

async function generateUniqueSlug(seed: string): Promise<string> {
  let base = normalizeSlug(seed) || "user";
  if (base.length < 3) base = base + "-card";
  let candidate = base;
  let i = 1;
  while (await prisma.profile.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
}

export async function ensureProfile(preferredId?: string | null) {
  return loadOwnedProfile(preferredId);
}

export async function switchActiveProfile(profileId: string): Promise<ActionResult> {
  const user = await requireUser();
  const owned = user.profiles.some((p) => p.id === profileId);
  if (!owned) return { ok: false, error: "Perfil no encontrado" };

  const { cookies } = await import("next/headers");
  const { ACTIVE_PROFILE_COOKIE } = await import("@/lib/session");
  const jar = await cookies();
  jar.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

function nv(v: string | null | undefined) {
  return v && v.length ? v : null;
}

function emptyToNull(v: string | null | undefined) {
  const t = v?.trim();
  return t ? t : null;
}

export async function updateProfile(input: z.infer<typeof ProfileSchema>): Promise<ActionResult> {
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const { profile } = await loadOwnedProfile();
  const newSlug = normalizeSlug(parsed.data.slug);
  if (!isValidSlug(newSlug)) return { ok: false, error: "Slug inválido" };

  if (newSlug !== profile.slug) {
    const exists = await prisma.profile.findUnique({ where: { slug: newSlug }, select: { id: true } });
    if (exists && exists.id !== profile.id) return { ok: false, error: "Slug no disponible" };
  }

  const d = parsed.data;
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      slug: newSlug,
      fullName: d.fullName,
      jobTitle: nv(d.jobTitle),
      companyName: nv(d.companyName),
      description: nv(d.description),
      email: nv(d.email),
      phone: nv(d.phone),
      whatsapp: nv(d.whatsapp),
      website: nv(d.website),
      location: nv(d.location),
      instagram: emptyToNull(d.instagram),
      linkedin: emptyToNull(d.linkedin),
      twitter: emptyToNull(d.twitter),
      facebook: emptyToNull(d.facebook),
      youtube: emptyToNull(d.youtube),
      tiktok: emptyToNull(d.tiktok),
      github: emptyToNull(d.github),
      alias: emptyToNull(d.alias),
      showSaveContact: d.showSaveContact ?? true,
    },
  });

  revalidatePath(`/${newSlug}`);
  if (newSlug !== profile.slug) revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

const AppearanceSchema = z.object({
  template: z.enum(TEMPLATE_VALUES),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  themeMode: z.enum(["LIGHT", "DARK"]).default("LIGHT"),
  avatarUrl: optionalHttpUrl,
  coverUrl: optionalHttpUrl,
});

export async function updateAppearance(input: z.infer<typeof AppearanceSchema>): Promise<ActionResult> {
  const parsed = AppearanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const { profile } = await loadOwnedProfile();

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      template: parsed.data.template,
      primaryColor: parsed.data.primaryColor,
      themeMode: parsed.data.themeMode,
      avatarUrl: nv(parsed.data.avatarUrl),
      coverUrl: nv(parsed.data.coverUrl),
    },
  });
  revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

const LinkSchema = z.object({
  kind: z.enum(KIND_VALUES).default("WEBSITE"),
  label: z.string().min(1).max(60),
  url: z.string().min(1).max(2000),
});

export async function createLink(input: z.infer<typeof LinkSchema>): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = LinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const { profile } = await loadOwnedProfile();
  const url = normalizeLinkUrl(parsed.data.kind as LinkKind, parsed.data.url);
  const last = await prisma.link.findFirst({ where: { profileId: profile.id }, orderBy: { order: "desc" } });
  const created = await prisma.link.create({
    data: {
      profileId: profile.id,
      kind: parsed.data.kind as LinkKind,
      label: parsed.data.label.trim(),
      url,
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true, id: created.id };
}

export async function updateLink(id: string, input: z.infer<typeof LinkSchema>): Promise<ActionResult> {
  const parsed = LinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const { profile } = await loadOwnedProfile();
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link || link.profileId !== profile.id) return { ok: false, error: "No encontrado" };
  const url = normalizeLinkUrl(parsed.data.kind as LinkKind, parsed.data.url);
  await prisma.link.update({
    where: { id },
    data: { kind: parsed.data.kind as LinkKind, label: parsed.data.label.trim(), url },
  });
  revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const { profile } = await loadOwnedProfile();
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link || link.profileId !== profile.id) return { ok: false, error: "No encontrado" };
  await prisma.link.delete({ where: { id } });
  revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function reorderLinks(orderedIds: string[]): Promise<ActionResult> {
  const { profile } = await loadOwnedProfile();
  const links = await prisma.link.findMany({ where: { profileId: profile.id }, select: { id: true } });
  const valid = new Set(links.map((l) => l.id));
  await prisma.$transaction(
    orderedIds
      .filter((id) => valid.has(id))
      .map((id, i) => prisma.link.update({ where: { id }, data: { order: i } })),
  );
  revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

function cardToView(card: {
  id: string;
  code: string;
  status: "UNASSIGNED" | "ACTIVE" | "INACTIVE" | "LOST";
  assignedAt: Date | null;
}) {
  return {
    id: card.id,
    code: card.code,
    status: card.status,
    assignedAt: card.assignedAt?.toISOString() ?? null,
  };
}

export async function getMyNfcCards() {
  const { profile } = await loadOwnedProfile();
  const cards = await prisma.nfcCard.findMany({
    where: { profileId: profile.id },
    orderBy: { assignedAt: "desc" },
  });
  return { ok: true as const, cards: cards.map(cardToView) };
}

/** @deprecated use getMyNfcCards — kept for compatibility */
export async function getMyNfcCard() {
  const res = await getMyNfcCards();
  return { ok: true as const, card: res.cards[0] ?? null };
}

export async function markMyCardLost(cardId?: string): Promise<ActionResult> {
  const { profile } = await loadOwnedProfile();
  const card = cardId
    ? await prisma.nfcCard.findFirst({ where: { id: cardId, profileId: profile.id } })
    : await prisma.nfcCard.findFirst({ where: { profileId: profile.id }, orderBy: { assignedAt: "desc" } });
  if (!card) return { ok: false, error: "No tenés una tarjeta NFC vinculada" };
  if (card.status === "LOST") return { ok: true };
  await prisma.nfcCard.update({ where: { id: card.id }, data: { status: "LOST" } });
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { ok: true };
}

export async function unlinkMyCard(cardId?: string): Promise<ActionResult> {
  const { profile } = await loadOwnedProfile();
  const card = cardId
    ? await prisma.nfcCard.findFirst({ where: { id: cardId, profileId: profile.id } })
    : await prisma.nfcCard.findFirst({ where: { profileId: profile.id }, orderBy: { assignedAt: "desc" } });
  if (!card) return { ok: false, error: "No tenés una tarjeta NFC vinculada" };
  await prisma.nfcCard.update({
    where: { id: card.id },
    data: { profileId: null, status: "UNASSIGNED", assignedAt: null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { ok: true };
}
