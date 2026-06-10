import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompaniesManager } from "@/components/admin/CompaniesManager";

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { profiles: true, cards: true, users: true } } },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>Crear, editar y administrar empresas / individuales.</CardDescription>
            </div>
            <Badge variant="secondary">{companies.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CompaniesManager
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
