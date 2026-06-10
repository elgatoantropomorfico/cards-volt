import Link from "next/link";
import { requireRole } from "@/lib/session";
import { Building2, Users, CreditCard, ArrowLeft } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("SUPERADMIN");
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background"><span className="font-display text-sm font-bold">V</span></span>
            <span className="font-display text-[15px] font-semibold tracking-tight">Volt</span>
            <Badge variant="secondary" className="ml-1">Admin</Badge>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Mi dashboard
            </Link>
            <span className="hidden text-muted-foreground md:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="container flex flex-col gap-6 py-8 md:flex-row">
        <aside className="md:w-56">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            <NavLink href="/admin" icon={<Building2 className="h-4 w-4" />}>Empresas</NavLink>
            <NavLink href="/admin/users" icon={<Users className="h-4 w-4" />}>Usuarios</NavLink>
            <NavLink href="/admin/cards" icon={<CreditCard className="h-4 w-4" />}>Tarjetas NFC</NavLink>
          </nav>
        </aside>
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">
      {icon} {children}
    </Link>
  );
}
