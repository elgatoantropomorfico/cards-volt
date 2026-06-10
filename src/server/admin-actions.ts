"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { isValidSlug, normalizeSlug } from "@/lib/utils";

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
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
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
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl || null;
  if (input.primaryColor !== undefined) data.primaryColor = input.primaryColor;
  if (input.seatsContracted !== undefined) data.seatsContracted = Number(input.seatsContracted);
  if (input.active !== undefined) data.active = input.active;
  if (input.type !== undefined) data.type = input.type;
  await prisma.company.update({ where: { id }, data });
  revalidatePath("/admin");
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
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

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

// ---------- NFC Cards ----------
const CardSchema = z.object({
  code: z.string().min(3).max(64),
  companyId: z.string().optional().nullable(),
});

export async function createCard(input: z.infer<typeof CardSchema>): Promise<ActionResult> {
  const me = await requireRole("SUPERADMIN", "COMPANY_ADMIN");
  const parsed = CardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
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
