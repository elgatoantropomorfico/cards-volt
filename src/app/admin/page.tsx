import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireRole("SUPERADMIN");

  const [users, cards, profiles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { profile: true },
    }),
    prisma.nfcCard.findMany({
      orderBy: { createdAt: "desc" },
      include: { profile: true },
    }),
    prisma.profile.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <AdminShell
      userEmail={user.email}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        profile: u.profile ? { id: u.profile.id, slug: u.profile.slug, active: u.profile.active } : null,
      }))}
      cards={cards.map((c) => ({
        id: c.id,
        code: c.code,
        status: c.status,
        profileId: c.profileId,
        profileLabel: c.profile ? `${c.profile.fullName} (/${c.profile.slug})` : null,
        createdAt: c.createdAt.toISOString(),
        assignedAt: c.assignedAt?.toISOString() ?? null,
      }))}
      profiles={profiles.map((p) => ({
        id: p.id,
        label: `${p.fullName} (/${p.slug})`,
      }))}
    />
  );
}
