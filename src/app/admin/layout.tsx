import Link from "next/link";
import { requireRole } from "@/lib/session";
import { Building2, Users, CreditCard, ArrowLeft } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("SUPERADMIN");
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-slate-900 text-white">
        <div className="container mx-auto flex h-14 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-sm text-slate-900">V</span>
            Volt · Admin
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-slate-200 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Mi dashboard
            </Link>
            <span className="hidden text-slate-300 md:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="container mx-auto flex flex-col gap-6 py-8 md:flex-row">
        <aside className="md:w-56">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            <NavLink href="/admin" icon={<Building2 className="h-4 w-4" />}>Empresas</NavLink>
            <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />}>Usuarios</NavLink>
            <NavLink href="/admin/cards" icon={<CreditCard className="h-4 w-4" />}>Tarjetas NFC</NavLink>
          </nav>
        </aside>
        <section className="flex-1">{children}</section>
      </div>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
      {icon} {children}
    </Link>
  );
}
