import Link from "next/link";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { LogOut, User, Palette, LinkIcon, QrCode, Building2, Shield } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const nav = [
    { href: "/dashboard", label: "Perfil", icon: <User className="h-4 w-4" /> },
    { href: "/dashboard/appearance", label: "Apariencia", icon: <Palette className="h-4 w-4" /> },
    { href: "/dashboard/links", label: "Links", icon: <LinkIcon className="h-4 w-4" /> },
    { href: "/dashboard/card", label: "Mi tarjeta", icon: <QrCode className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-14 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-sm text-white">V</span>
            Volt Cards
          </Link>
          <div className="flex items-center gap-2 text-sm">
            {user.role === "SUPERADMIN" && (
              <Link href="/admin"><Button variant="ghost" size="sm"><Shield className="h-4 w-4" /> Admin</Button></Link>
            )}
            {user.role === "COMPANY_ADMIN" && (
              <Link href="/company"><Button variant="ghost" size="sm"><Building2 className="h-4 w-4" /> Empresa</Button></Link>
            )}
            <span className="hidden text-slate-500 md:inline">{user.email}</span>
            <LogoutButton><LogOut className="h-4 w-4" /></LogoutButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-col gap-6 py-8 md:flex-row">
        <aside className="md:w-56">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {n.icon}
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="flex-1">{children}</section>
      </div>
    </div>
  );
}
