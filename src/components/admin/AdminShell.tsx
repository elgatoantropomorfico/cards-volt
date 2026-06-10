"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, CreditCard, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { CompaniesManager } from "@/components/admin/CompaniesManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { CardsManager } from "@/components/admin/CardsManager";
import { cn } from "@/lib/utils";

type Section = "companies" | "users" | "cards";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "companies", label: "Empresas", icon: <Building2 className="h-4 w-4" /> },
  { id: "users", label: "Usuarios", icon: <Users className="h-4 w-4" /> },
  { id: "cards", label: "Tarjetas NFC", icon: <CreditCard className="h-4 w-4" /> },
];

export function AdminShell({
  userEmail,
  companies,
  users,
  cards,
  profiles,
}: {
  userEmail: string;
  companies: Parameters<typeof CompaniesManager>[0]["companies"];
  users: Parameters<typeof UsersManager>[0]["users"];
  cards: Parameters<typeof CardsManager>[0]["cards"];
  profiles: Parameters<typeof CardsManager>[0]["profiles"];
}) {
  const router = useRouter();
  const [section, setSection] = React.useState<Section>(() => {
    if (typeof window === "undefined") return "companies";
    const h = window.location.hash.replace("#", "") as Section;
    return (["companies", "users", "cards"] as Section[]).includes(h) ? h : "companies";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = section;
    window.history.replaceState(null, "", url.toString());
  }, [section]);

  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background shadow-soft">
                <span className="font-display text-sm font-bold">V</span>
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight">Volt Cards</span>
            </Link>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Mi perfil
              </Button>
            </Link>
            <span className="hidden text-xs text-muted-foreground md:inline">{userEmail}</span>
            <LogoutButton>
              <LogOut className="h-4 w-4" />
            </LogoutButton>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Empresas" value={companies.length} icon={<Building2 className="h-4 w-4" />} />
          <StatCard label="Usuarios" value={users.length} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Tarjetas NFC" value={cards.length} icon={<CreditCard className="h-4 w-4" />} />
        </div>

        <nav className="mb-6 inline-flex rounded-2xl border bg-card/80 p-1 shadow-soft backdrop-blur">
          {NAV.map((n) => {
            const active = section === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setSection(n.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav-pill"
                    className="absolute inset-0 rounded-xl bg-foreground shadow-soft"
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2">
                  {n.icon}
                  {n.label}
                </span>
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {section === "companies" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Empresas</CardTitle>
                      <CardDescription>Crear, editar y administrar empresas e individuales.</CardDescription>
                    </div>
                    <Badge variant="outline">{companies.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CompaniesManager companies={companies} onChanged={() => router.refresh()} />
                </CardContent>
              </Card>
            )}

            {section === "users" && (
              <Card>
                <CardHeader>
                  <CardTitle>Usuarios</CardTitle>
                  <CardDescription>Crear usuarios con el asistente completo, asignar empresa y rol.</CardDescription>
                </CardHeader>
                <CardContent>
                  <UsersManager
                    isSuperadmin
                    companies={companyOptions}
                    users={users}
                    onChanged={() => router.refresh()}
                  />
                </CardContent>
              </Card>
            )}

            {section === "cards" && (
              <Card>
                <CardHeader>
                  <CardTitle>Tarjetas NFC</CardTitle>
                  <CardDescription>Códigos internos, asignación a perfiles y estados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CardsManager
                    isSuperadmin
                    companies={companyOptions}
                    profiles={profiles}
                    cards={cards}
                    onChanged={() => router.refresh()}
                  />
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">{icon}</span>
      </div>
    </div>
  );
}
