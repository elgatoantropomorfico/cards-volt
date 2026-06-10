import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function CompanyEmployeesPage() {
  const me = await requireRole("COMPANY_ADMIN", "SUPERADMIN");
  const companyId = me.companyId!;
  const users = await prisma.user.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { company: true, profile: true },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empleados</CardTitle>
        <CardDescription>Crear, activar y administrar empleados de tu empresa.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsersManager
          isSuperadmin={false}
          lockedCompanyId={companyId}
          companies={[]}
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            companyId: u.companyId,
            companyName: u.company?.name ?? null,
            profile: u.profile ? { id: u.profile.id, slug: u.profile.slug, active: u.profile.active } : null,
          }))}
        />
      </CardContent>
    </Card>
  );
}
