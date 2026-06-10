import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function AdminUsersPage() {
  const [users, companies] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: true, profile: true },
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios</CardTitle>
        <CardDescription>Crear/editar usuarios, asignar empresa y rol.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsersManager
          isSuperadmin
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
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
