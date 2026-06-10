import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CardsManager } from "@/components/admin/CardsManager";

export default async function AdminCardsPage() {
  const [cards, companies, profiles] = await Promise.all([
    prisma.nfcCard.findMany({
      orderBy: { createdAt: "desc" },
      include: { profile: true, company: true },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.profile.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarjetas NFC</CardTitle>
        <CardDescription>Crear códigos internos, asignar a perfiles y cambiar estados.</CardDescription>
      </CardHeader>
      <CardContent>
        <CardsManager
          isSuperadmin
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
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
