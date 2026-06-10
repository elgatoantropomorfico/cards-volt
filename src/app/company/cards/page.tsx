import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CardsManager } from "@/components/admin/CardsManager";

export default async function CompanyCardsPage() {
  const me = await requireRole("COMPANY_ADMIN", "SUPERADMIN");
  const companyId = me.companyId!;
  const [cards, profiles] = await Promise.all([
    prisma.nfcCard.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: { profile: true, company: true },
    }),
    prisma.profile.findMany({ where: { companyId }, orderBy: { fullName: "asc" } }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarjetas</CardTitle>
        <CardDescription>Gestioná las tarjetas NFC de tu empresa.</CardDescription>
      </CardHeader>
      <CardContent>
        <CardsManager
          isSuperadmin={false}
          lockedCompanyId={companyId}
          companies={[]}
          profiles={profiles.map((p) => ({ id: p.id, label: `${p.fullName} (/${p.slug})`, companyId: p.companyId }))}
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
        />
      </CardContent>
    </Card>
  );
}
