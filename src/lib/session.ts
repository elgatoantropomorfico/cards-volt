import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

export type Role = "SUPERADMIN" | "USER";

export const ACTIVE_PROFILE_COOKIE = "volt_active_profile";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profiles: { orderBy: { updatedAt: "desc" } },
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) redirect("/dashboard");
  return user;
}

/** Resolve which profile the tenant is editing (cookie or latest). */
export async function resolveActiveProfileId(
  userId: string,
  profiles: { id: string }[],
  preferredId?: string | null,
) {
  if (preferredId && profiles.some((p) => p.id === preferredId)) {
    return preferredId;
  }
  const jar = await cookies();
  const fromCookie = jar.get(ACTIVE_PROFILE_COOKIE)?.value;
  if (fromCookie && profiles.some((p) => p.id === fromCookie)) {
    return fromCookie;
  }
  return profiles[0]?.id ?? null;
}
