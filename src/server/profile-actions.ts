"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isValidSlug, normalizeSlug } from "@/lib/utils";
import type { LinkKind } from "@/lib/profile-types";

const KIND_VALUES = [
  "WEBSITE","INSTAGRAM","LINKEDIN","TWITTER","FACEBOOK","YOUTUBE","TIKTOK","GITHUB","SPOTIFY","CALENDAR","EMAIL","PHONE","WHATSAPP","MAP","PDF","OTHER",
] as const;

const ProfileSchema = z.object({
  slug: z.string(),
  fullName: z.string().min(1).max(120),
  jobTitle: z.string().max(120).optional().nullable(),
  companyName: z.string().max(120).optional().nullable(),
  description: z.string().max(600).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  location: z.string().max(160).optional().nullable(),
  instagram: z.string().max(80).optional().nullable(),
  linkedin: z.string().max(200).optional().nullable(),
  twitter: z.string().max(80).optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),
  tiktok: z.string().max(80).optional().nullable(),
  github: z.string().max(200).optional().nullable(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

async function loadOwnedProfile() {
  const user = await requireUser();
  if (!user.profile) {
    const slug = await generateUniqueSlug(user.name || user.email.split("@")[0]);
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        slug,
        fullName: user.name || user.email,
        email: user.email,
      },
    });
    return { user, profile };
  }
  return { user, profile: user.profile };
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

export async function ensureProfile() {
  return loadOwnedProfile();
}

function nv(v: string | null | undefined) {
  return v && v.length ? v : null;
}

export async function updateProfile(input: z.infer<typeof ProfileSchema>): Promise<ActionResult> {
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

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
      instagram: nv(d.instagram),
      linkedin: nv(d.linkedin),
      twitter: nv(d.twitter),
      facebook: nv(d.facebook),
      youtube: nv(d.youtube),
      tiktok: nv(d.tiktok),
      github: nv(d.github),
    },
  });

  revalidatePath(`/${newSlug}`);
  if (newSlug !== profile.slug) revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

const AppearanceSchema = z.object({
  template: z.enum(["MINIMAL", "PREMIUM", "CORPORATE"]),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  themeMode: z.enum(["LIGHT", "DARK"]).default("LIGHT"),
  avatarUrl: z.string().url().optional().or(z.literal("")).nullable(),
  coverUrl: z.string().url().optional().or(z.literal("")).nullable(),
});

export async function updateAppearance(input: z.infer<typeof AppearanceSchema>): Promise<ActionResult> {
  const parsed = AppearanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
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
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { profile } = await loadOwnedProfile();
  const last = await prisma.link.findFirst({ where: { profileId: profile.id }, orderBy: { order: "desc" } });
  const created = await prisma.link.create({
    data: {
      profileId: profile.id,
      kind: parsed.data.kind as LinkKind,
      label: parsed.data.label,
      url: parsed.data.url,
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
  return { ok: true, id: created.id };
}

export async function updateLink(id: string, input: z.infer<typeof LinkSchema>): Promise<ActionResult> {
  const parsed = LinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { profile } = await loadOwnedProfile();
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link || link.profileId !== profile.id) return { ok: false, error: "No encontrado" };
  await prisma.link.update({
    where: { id },
    data: { kind: parsed.data.kind as LinkKind, label: parsed.data.label, url: parsed.data.url },
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
