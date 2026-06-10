import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireRole("SUPERADMIN");

  const [companies, users, cards, profiles] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { profiles: true, cards: true, users: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: true, profile: true },
    }),
    prisma.nfcCard.findMany({
      orderBy: { createdAt: "desc" },
      include: { profile: true, company: true },
    }),
    prisma.profile.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <AdminShell
      userEmail={user.email}
      companies={companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: c.type,
        primaryColor: c.primaryColor,
        seatsContracted: c.seatsContracted,
        active: c.active,
        profiles: c._count.profiles,
        cards: c._count.cards,
        users: c._count.users,
      }))}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        companyId: u.companyId,
        companyName: u.company?.name ?? null,
        profile: u.profile ? { id: u.profile.id, slug: u.profile.slug, active: u.profile.active } : null,
      }))}
      cards={cards.map((c) => ({
        id: c.id,
        code: c.code,
        status: c.status,
        companyId: c.companyId,
        companyName: c.company?.name ?? null,
        profileId: c.profileId,
        profileLabel: c.profile ? `${c.profile.fullName} (/${c.profile.slug})` : null,
        createdAt: c.createdAt.toISOString(),
        assignedAt: c.assignedAt?.toISOString() ?? null,
      }))}
      profiles={profiles.map((p) => ({
        id: p.id,
        label: `${p.fullName} (/${p.slug})`,
        companyId: p.companyId,
      }))}
    />
  );
}
