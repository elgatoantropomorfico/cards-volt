import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CompanyHome() {
  const me = await requireRole("COMPANY_ADMIN", "SUPERADMIN");
  const companyId = me.companyId!;
  const [company, employees, profilesActive, profilesInactive, cards] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.user.count({ where: { companyId } }),
    prisma.profile.count({ where: { companyId, active: true } }),
    prisma.profile.count({ where: { companyId, active: false } }),
    prisma.nfcCard.count({ where: { companyId } }),
  ]);
  const stats = [
    { label: "Empleados", value: employees },
    { label: "Perfiles activos", value: profilesActive },
    { label: "Perfiles inactivos", value: profilesInactive },
    { label: "Tarjetas", value: cards },
    { label: "Asientos contratados", value: company?.seatsContracted ?? 0 },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader><CardDescription>{s.label}</CardDescription><CardTitle className="text-3xl">{s.value}</CardTitle></CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
