"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { isValidSlug, normalizeSlug } from "@/lib/utils";
import { normalizeLinkUrl, normalizeWebsite } from "@/lib/socials";
import { formatZodError, optionalHttpUrl, optionalWebsite } from "@/lib/validation";
import type { LinkKind } from "@/lib/profile-types";

export type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string };

// ---------- Companies (SUPERADMIN) ----------
const CompanySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60),
  type: z.enum(["INDIVIDUAL", "COMPANY"]).default("COMPANY"),
  logoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0F172A"),
  seatsContracted: z.coerce.number().int().min(1).max(10000).default(1),
});

export async function createCompany(input: z.infer<typeof CompanySchema>): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const parsed = CompanySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const slug = normalizeSlug(parsed.data.slug);
  if (!isValidSlug(slug)) return { ok: false, error: "Slug de empresa inválido" };
  const exists = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (exists) return { ok: false, error: "Slug ya en uso" };
  const company = await prisma.company.create({
    data: {
      name: parsed.data.name,
      slug,
      type: parsed.data.type,
      logoUrl: parsed.data.logoUrl || null,
      primaryColor: parsed.data.primaryColor,
      seatsContracted: parsed.data.seatsContracted,
    },
  });
  revalidatePath("/admin");
  return { ok: true, data: { id: company.id } };
}

export async function updateCompany(id: string, input: Partial<z.infer<typeof CompanySchema>> & { active?: boolean }): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug);
    if (!isValidSlug(slug)) return { ok: false, error: "Slug de empresa inválido" };
    const exists = await prisma.company.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
    if (exists) return { ok: false, error: "Slug ya en uso" };
    data.slug = slug;
  }
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl || null;
  if (input.primaryColor !== undefined) data.primaryColor = input.primaryColor;
  if (input.seatsContracted !== undefined) data.seatsContracted = Number(input.seatsContracted);
  if (input.active !== undefined) data.active = input.active;
  if (input.type !== undefined) data.type = input.type;
  await prisma.company.update({ where: { id }, data });
  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  await requireRole("SUPERADMIN");
  await prisma.company.delete({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}

// ---------- Users / Employees (SUPERADMIN or COMPANY_ADMIN of same company) ----------
const UserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  role: z.enum(["SUPERADMIN", "COMPANY_ADMIN", "USER"]).default("USER"),
  companyId: z.string().optional().nullable(),
  // Auto-create profile fields
  slug: z.string().optional(),
  jobTitle: z.string().optional().nullable(),
});

export async function createUser(input: z.infer<typeof UserSchema>): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const parsed = UserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  // COMPANY_ADMIN can only create USER in their own company
  if (me.role === "COMPANY_ADMIN") {
    if (parsed.data.role !== "USER") return { ok: false, error: "Solo podés crear empleados" };
    if (!me.companyId) return { ok: false, error: "No tenés empresa asignada" };
    parsed.data.companyId = me.companyId;
  }

  // Use Better Auth to create the user (handles password hashing)
  const signup = await auth.api.signUpEmail({
    body: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    },
  });
  const userId = signup?.user?.id;
  if (!userId) return { ok: false, error: "No se pudo crear el usuario" };

  // Patch role and companyId
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: parsed.data.role,
      companyId: parsed.data.companyId || null,
      emailVerified: true,
    },
  });

  // Create a profile
  const seed = parsed.data.slug || parsed.data.name;
  let base = normalizeSlug(seed) || "user";
  if (base.length < 3) base += "-card";
  let slug = base;
  let i = 1;
  while (await prisma.profile.findUnique({ where: { slug }, select: { id: true } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  await prisma.profile.create({
    data: {
      userId,
      companyId: parsed.data.companyId || null,
      slug,
      fullName: parsed.data.name,
      email: parsed.data.email,
      jobTitle: parsed.data.jobTitle || null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true, data: { id: userId, slug } };
}

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
  template: z.enum(["MINIMAL", "PREMIUM", "CORPORATE"]).default("MINIMAL"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7C3AED"),
  themeMode: z.enum(["LIGHT", "DARK"]).default("LIGHT"),
});

const FullUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  role: z.enum(["SUPERADMIN", "COMPANY_ADMIN", "USER"]).default("USER"),
  companyId: z.string().optional().nullable(),
  profile: FullProfileSchema,
  links: z.array(z.object({
    kind: z.enum(KIND_VALUES),
    label: z.string().min(1).max(60),
    url: z.string().min(1).max(2000),
  })).default([]),
});

export async function createUserFull(input: z.infer<typeof FullUserSchema>): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const parsed = FullUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const d = parsed.data;

  if (me.role === "COMPANY_ADMIN") {
    if (d.role !== "USER") return { ok: false, error: "Solo podés crear empleados" };
    if (!me.companyId) return { ok: false, error: "No tenés empresa asignada" };
    d.companyId = me.companyId;
  }

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
    data: { role: d.role, companyId: d.companyId || null, emailVerified: true },
  });

  const created = await prisma.profile.create({
    data: {
      userId,
      companyId: d.companyId || null,
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
        url: l.url,
        order: idx,
      })),
    });
  }

  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true, slug };
}

export async function setProfileActive(profileId: string, active: boolean): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, include: { user: true } });
  if (!profile) return { ok: false, error: "No existe" };
  if (me.role === "COMPANY_ADMIN" && profile.companyId !== me.companyId) {
    return { ok: false, error: "Sin permiso" };
  }
  await prisma.profile.update({ where: { id: profileId }, data: { active } });
  revalidatePath("/admin");
  revalidatePath("/company");
  revalidatePath(`/${profile.slug}`);
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, error: "No existe" };
  if (me.role === "COMPANY_ADMIN") {
    if (target.companyId !== me.companyId || target.role !== "USER") {
      return { ok: false, error: "Sin permiso" };
    }
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true };
}

async function assertCanManageUser(me: Awaited<ReturnType<typeof requireRole>>, targetUserId: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  });
  if (!target) return { ok: false as const, error: "Usuario no encontrado" };
  if (me.role === "COMPANY_ADMIN") {
    if (target.companyId !== me.companyId) return { ok: false as const, error: "Sin permiso" };
    if (target.role !== "USER" && target.id !== me.id) return { ok: false as const, error: "Solo podés editar empleados" };
  }
  return { ok: true as const, target };
}

export async function getUserAdminDetail(userId: string) {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const check = await assertCanManageUser(me, userId);
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
      companyId: target.companyId,
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
  role: z.enum(["SUPERADMIN", "COMPANY_ADMIN", "USER"]),
  companyId: z.string().nullable().optional(),
  newPassword: z.string().min(8).max(120).optional().or(z.literal("")),
});

export async function updateUserAdmin(input: z.infer<typeof AdminUserUpdateSchema>): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const parsed = AdminUserUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const check = await assertCanManageUser(me, parsed.data.userId);
  if (!check.ok) return check;

  let { role, companyId } = parsed.data;
  if (me.role === "COMPANY_ADMIN") {
    role = "USER";
    companyId = me.companyId;
  }

  if (role !== "SUPERADMIN" && me.role === "SUPERADMIN" && role === "COMPANY_ADMIN" && !companyId) {
    return { ok: false, error: "Un admin de empresa debe tener empresa asignada" };
  }

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
        role,
        companyId: role === "SUPERADMIN" ? null : companyId || null,
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
          companyId: role === "SUPERADMIN" ? null : companyId || null,
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
  revalidatePath("/company");
  if (oldSlug) revalidatePath(`/${oldSlug}`);
  return { ok: true };
}

const AdminProfileUpdateSchema = FullProfileSchema.extend({
  userId: z.string(),
  active: z.boolean().optional(),
});

export async function updateUserProfileAdmin(input: z.infer<typeof AdminProfileUpdateSchema>): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const parsed = AdminProfileUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const check = await assertCanManageUser(me, parsed.data.userId);
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
      template: d.template,
      primaryColor: d.primaryColor,
      themeMode: d.themeMode,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/company");
  revalidatePath(`/${slugBase}`);
  if (slugBase !== current.slug) revalidatePath(`/${current.slug}`);
  return { ok: true };
}

export async function replaceUserLinksAdmin(
  userId: string,
  links: { kind: z.infer<typeof FullUserSchema>["links"][number]["kind"]; label: string; url: string }[],
): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const check = await assertCanManageUser(me, userId);
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
  revalidatePath("/company");
  if (check.target.profile.slug) revalidatePath(`/${check.target.profile.slug}`);
  return { ok: true };
}

// ---------- NFC Cards ----------
const CardSchema = z.object({
  code: z.string().min(3).max(64),
  companyId: z.string().optional().nullable(),
});

export async function createCard(input: z.infer<typeof CardSchema>): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const parsed = CardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const companyId = me.role === "COMPANY_ADMIN" ? me.companyId : parsed.data.companyId || null;
  const exists = await prisma.nfcCard.findUnique({ where: { code: parsed.data.code } });
  if (exists) return { ok: false, error: "Código ya existe" };
  await prisma.nfcCard.create({
    data: { code: parsed.data.code, companyId, status: "UNASSIGNED" },
  });
  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true };
}

export async function assignCard(cardId: string, profileId: string | null): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const card = await prisma.nfcCard.findUnique({ where: { id: cardId } });
  if (!card) return { ok: false, error: "Tarjeta inexistente" };
  if (me.role === "COMPANY_ADMIN" && card.companyId !== me.companyId) {
    return { ok: false, error: "Sin permiso" };
  }
  if (profileId) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) return { ok: false, error: "Perfil inexistente" };
    if (me.role === "COMPANY_ADMIN" && profile.companyId !== me.companyId) {
      return { ok: false, error: "Sin permiso" };
    }
    // Clear any other card pointing to this profile
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
  revalidatePath("/company");
  return { ok: true };
}

export async function setCardStatus(cardId: string, status: "ACTIVE" | "INACTIVE" | "LOST" | "UNASSIGNED"): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const card = await prisma.nfcCard.findUnique({ where: { id: cardId } });
  if (!card) return { ok: false, error: "Tarjeta inexistente" };
  if (me.role === "COMPANY_ADMIN" && card.companyId !== me.companyId) {
    return { ok: false, error: "Sin permiso" };
  }
  await prisma.nfcCard.update({ where: { id: cardId }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true };
}
