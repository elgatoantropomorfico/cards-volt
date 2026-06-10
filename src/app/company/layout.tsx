import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { Users, CreditCard, ArrowLeft, Building2 } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { prisma } from "@/lib/prisma";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("COMPANY_ADMIN", "SUPERADMIN");
  if (!user.companyId) {
    // SUPERADMIN without company association — redirect to admin
    if (user.role === "SUPERADMIN") redirect("/admin");
    redirect("/dashboard");
  }
  const company = await prisma.company.findUnique({ where: { id: user.companyId } });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-14 items-center justify-between">
          <Link href="/company" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-sm text-white">V</span>
            {company?.name ?? "Empresa"}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Mi perfil
            </Link>
            <span className="hidden text-slate-500 md:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="container mx-auto flex flex-col gap-6 py-8 md:flex-row">
        <aside className="md:w-56">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            <Link href="/company" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Building2 className="h-4 w-4" /> Resumen
            </Link>
            <Link href="/company/employees" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Users className="h-4 w-4" /> Empleados
            </Link>
            <Link href="/company/cards" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <CreditCard className="h-4 w-4" /> Tarjetas
            </Link>
          </nav>
        </aside>
        <section className="flex-1">{children}</section>
      </div>
    </div>
  );
}
