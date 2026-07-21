"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { isValidSlug, normalizeSlug } from "@/lib/utils";
import { normalizeLinkUrl } from "@/lib/socials";
import { formatZodError, optionalHttpUrl, optionalWebsite } from "@/lib/validation";
import type { LinkKind } from "@/lib/profile-types";
import { TEMPLATE_VALUES } from "@/lib/profile-types";

export type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string };

const KIND_VALUES = [
  "WEBSITE","INSTAGRAM","LINKEDIN","TWITTER","FACEBOOK","YOUTUBE","TIKTOK","GITHUB","SPOTIFY","CALENDAR","EMAIL","PHONE","WHATSAPP","MAP","PDF","OTHER",
] as const;

const FullProfileSchema = z.object({
  slug: z.string().min(3).max(40),
  jobTitle: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  website: optionalWebsite,
  location: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  avatarUrl: optionalHttpUrl,
  coverUrl: optionalHttpUrl,
  alias: z.string().max(80).optional().nullable(),
  showSaveContact: z.boolean().optional().default(true),
  template: z.enum(TEMPLATE_VALUES).default("MINIMAL"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7C3AED"),
  themeMode: z.enum(["LIGHT", "DARK"]).default("LIGHT"),
});

const FullUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  role: z.enum(["SUPERADMIN", "USER"]).default("USER"),
  profile: FullProfileSchema,
  links: z.array(z.object({
    kind: z.enum(KIND_VALUES),
    label: z.string().min(1).max(60),
    url: z.string().min(1).max(2000),
  })).default([]),
});

export async function createUserFull(input: z.infer<typeof FullUserSchema>): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  await requireRole("SUPERADMIN");
  const parsed = FullUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;

  const slugBase = normalizeSlug(d.profile.slug || d.name);
  if (!isValidSlug(slugBase)) return { ok: false, error: "Slug inválido" };
  let slug = slugBase;
  let i = 1;
  while (await prisma.profile.findUnique({ where: { slug }, select: { id: true } })) {
    i += 1;
    slug = `${slugBase}-${i}`;
  }

  const signup = await auth.api.signUpEmail({
    body: { name: d.name, email: d.email, password: d.password },
  });
  const userId = signup?.user?.id;
  if (!userId) return { ok: false, error: "No se pudo crear el usuario" };

  await prisma.user.update({
    where: { id: userId },
    data: { role: d.role, emailVerified: true },
  });

  const created = await prisma.profile.create({
    data: {
      userId,
      slug,
      fullName: d.name,
      email: d.email,
      jobTitle: d.profile.jobTitle || null,
      companyName: d.profile.companyName || null,
      description: d.profile.description || null,
      phone: d.profile.phone || null,
      whatsapp: d.profile.whatsapp || null,
      website: d.profile.website || null,
      location: d.profile.location || null,
      instagram: d.profile.instagram || null,
      linkedin: d.profile.linkedin || null,
      twitter: d.profile.twitter || null,
      avatarUrl: d.profile.avatarUrl || null,
      coverUrl: d.profile.coverUrl || null,
      alias: d.profile.alias || null,
      showSaveContact: d.profile.showSaveContact ?? true,
      template: d.profile.template,
      primaryColor: d.profile.primaryColor,
      themeMode: d.profile.themeMode,
    },
  });

  if (d.links.length) {
    await prisma.link.createMany({
      data: d.links.map((l, idx) => ({
        profileId: created.id,
        kind: l.kind as LinkKind,
        label: l.label,
        url: normalizeLinkUrl(l.kind as LinkKind, l.url),
        order: idx,
      })),
    });
  }

  revalidatePath("/admin");
  return { ok: true, slug };
}

export async function setProfileActive(profileId: string, active: boolean): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) return { ok: false, error: "No existe" };
  await prisma.profile.update({ where: { id: profileId }, data: { active } });
  revalidatePath("/admin");
  revalidatePath(`/${profile.slug}`);
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "No existe" };
  if (target.role === "SUPERADMIN") return { ok: false, error: "No podés eliminar un superadmin" };
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  return { ok: true };
}

async function loadUserForAdmin(userId: string) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!target) return { ok: false as const, error: "Usuario no encontrado" };
  return { ok: true as const, target };
}

export async function getUserAdminDetail(userId: string) {
  await requireRole("SUPERADMIN");
  const check = await loadUserForAdmin(userId);
  if (!check.ok) return check;

  const { target } = check;
  const profile = target.profile
    ? await prisma.profile.findUnique({
        where: { id: target.profile.id },
        include: { links: { orderBy: { order: "asc" } } },
      })
    : null;

  return {
    ok: true as const,
    user: {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
    },
    profile: profile
      ? {
          id: profile.id,
          slug: profile.slug,
          active: profile.active,
          fullName: profile.fullName,
          jobTitle: profile.jobTitle,
          companyName: profile.companyName,
          description: profile.description,
          email: profile.email,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          website: profile.website,
          location: profile.location,
          instagram: profile.instagram,
          linkedin: profile.linkedin,
          twitter: profile.twitter,
          facebook: profile.facebook,
          youtube: profile.youtube,
          tiktok: profile.tiktok,
          github: profile.github,
          avatarUrl: profile.avatarUrl,
          coverUrl: profile.coverUrl,
          alias: profile.alias,
          showSaveContact: profile.showSaveContact,
          template: profile.template,
          primaryColor: profile.primaryColor,
          themeMode: profile.themeMode,
          links: profile.links.map((l) => ({
            id: l.id,
            kind: l.kind,
            label: l.label,
            url: l.url,
          })),
        }
      : null,
  };
}

const AdminUserUpdateSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(["SUPERADMIN", "USER"]),
  newPassword: z.string().min(8).max(120).optional().or(z.literal("")),
});

export async function updateUserAdmin(input: z.infer<typeof AdminUserUpdateSchema>): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const parsed = AdminUserUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const check = await loadUserForAdmin(parsed.data.userId);
  if (!check.ok) return check;

  const emailTaken = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: parsed.data.userId } },
    select: { id: true },
  });
  if (emailTaken) return { ok: false, error: "Email ya en uso" };

  const oldSlug = check.target.profile?.slug;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
      },
    });

    await tx.account.updateMany({
      where: { userId: parsed.data.userId, providerId: "credential" },
      data: { accountId: parsed.data.email },
    });

    if (check.target.profile) {
      await tx.profile.update({
        where: { id: check.target.profile.id },
        data: {
          fullName: parsed.data.name,
          email: parsed.data.email,
        },
      });
    }

    if (parsed.data.newPassword) {
      const hashed = await hashPassword(parsed.data.newPassword);
      await tx.account.updateMany({
        where: { userId: parsed.data.userId, providerId: "credential" },
        data: { password: hashed },
      });
    }
  });

  revalidatePath("/admin");
  if (oldSlug) revalidatePath(`/${oldSlug}`);
  return { ok: true };
}

const AdminProfileUpdateSchema = FullProfileSchema.extend({
  userId: z.string(),
  active: z.boolean().optional(),
});

export async function updateUserProfileAdmin(input: z.infer<typeof AdminProfileUpdateSchema>): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const parsed = AdminProfileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const check = await loadUserForAdmin(parsed.data.userId);
  if (!check.ok) return check;
  if (!check.target.profile) return { ok: false, error: "El usuario no tiene perfil" };

  const slugBase = normalizeSlug(parsed.data.slug);
  if (!isValidSlug(slugBase)) return { ok: false, error: "Slug inválido" };
  const profileId = check.target.profile.id;
  const current = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!current) return { ok: false, error: "Perfil no encontrado" };

  if (slugBase !== current.slug) {
    const exists = await prisma.profile.findUnique({ where: { slug: slugBase }, select: { id: true } });
    if (exists && exists.id !== profileId) return { ok: false, error: "Slug no disponible" };
  }

  const d = parsed.data;
  const nv = (v: string | null | undefined) => (v && v.length ? v : null);

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      slug: slugBase,
      active: d.active ?? current.active,
      fullName: check.target.name,
      jobTitle: nv(d.jobTitle),
      companyName: nv(d.companyName),
      description: nv(d.description),
      phone: nv(d.phone),
      whatsapp: nv(d.whatsapp),
      website: nv(d.website),
      location: nv(d.location),
      instagram: nv(d.instagram),
      linkedin: nv(d.linkedin),
      twitter: nv(d.twitter),
      avatarUrl: nv(d.avatarUrl),
      coverUrl: nv(d.coverUrl),
      alias: nv(d.alias),
      showSaveContact: d.showSaveContact ?? true,
      template: d.template,
      primaryColor: d.primaryColor,
      themeMode: d.themeMode,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/${slugBase}`);
  if (slugBase !== current.slug) revalidatePath(`/${current.slug}`);
  return { ok: true };
}

export async function replaceUserLinksAdmin(
  userId: string,
  links: { kind: z.infer<typeof FullUserSchema>["links"][number]["kind"]; label: string; url: string }[],
): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const check = await loadUserForAdmin(userId);
  if (!check.ok) return check;
  if (!check.target.profile) return { ok: false, error: "El usuario no tiene perfil" };

  const profileId = check.target.profile.id;
  await prisma.$transaction([
    prisma.link.deleteMany({ where: { profileId } }),
    ...(links.length
      ? [
          prisma.link.createMany({
            data: links.map((l, idx) => ({
              profileId,
              kind: l.kind as LinkKind,
              label: l.label.trim(),
              url: normalizeLinkUrl(l.kind as LinkKind, l.url),
              order: idx,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/admin");
  if (check.target.profile.slug) revalidatePath(`/${check.target.profile.slug}`);
  return { ok: true };
}

// ---------- NFC Cards ----------
const CardSchema = z.object({
  code: z.string().min(3).max(64),
});

export async function createCard(input: z.infer<typeof CardSchema>): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const parsed = CardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const exists = await prisma.nfcCard.findUnique({ where: { code: parsed.data.code } });
  if (exists) return { ok: false, error: "Código ya existe" };
  await prisma.nfcCard.create({
    data: { code: parsed.data.code, status: "UNASSIGNED" },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function assignCard(cardId: string, profileId: string | null): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const card = await prisma.nfcCard.findUnique({ where: { id: cardId } });
  if (!card) return { ok: false, error: "Tarjeta inexistente" };
  if (profileId) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) return { ok: false, error: "Perfil inexistente" };
    await prisma.nfcCard.updateMany({ where: { profileId }, data: { profileId: null, status: "UNASSIGNED", assignedAt: null } });
    await prisma.nfcCard.update({
      where: { id: cardId },
      data: { profileId, status: "ACTIVE", assignedAt: new Date() },
    });
  } else {
    await prisma.nfcCard.update({
      where: { id: cardId },
      data: { profileId: null, status: "UNASSIGNED", assignedAt: null },
    });
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setCardStatus(cardId: string, status: "ACTIVE" | "INACTIVE" | "LOST" | "UNASSIGNED"): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const card = await prisma.nfcCard.findUnique({ where: { id: cardId } });
  if (!card) return { ok: false, error: "Tarjeta inexistente" };
  await prisma.nfcCard.update({ where: { id: cardId }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}
