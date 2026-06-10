import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CompanyShell } from "@/components/company/CompanyShell";

export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const me = await requireRole("COMPANY_ADMIN", "SUPERADMIN");
  const companyId = me.companyId!;

  const [company, users, cards, profiles, employees, profilesActive, profilesInactive, cardCount] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { company: true, profile: true },
    }),
    prisma.nfcCard.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { profile: true, company: true },
    }),
    prisma.profile.findMany({ where: { companyId }, orderBy: { fullName: "asc" } }),
    prisma.user.count({ where: { companyId } }),
    prisma.profile.count({ where: { companyId, active: true } }),
    prisma.profile.count({ where: { companyId, active: false } }),
    prisma.nfcCard.count({ where: { companyId } }),
  ]);

  return (
    <CompanyShell
      userEmail={me.email}
      companyId={companyId}
      companyName={company?.name ?? "Empresa"}
      seatsContracted={company?.seatsContracted ?? 0}
      stats={{
        employees,
        profilesActive,
        profilesInactive,
        cards: cardCount,
      }}
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
