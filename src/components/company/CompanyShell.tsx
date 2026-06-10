"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, CreditCard, LogOut, ArrowLeft, UserCheck, UserX, Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { UsersManager } from "@/components/admin/UsersManager";
import { CardsManager } from "@/components/admin/CardsManager";
import { cn } from "@/lib/utils";

type Section = "overview" | "employees" | "cards";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Resumen", icon: <Building2 className="h-4 w-4" /> },
  { id: "employees", label: "Empleados", icon: <Users className="h-4 w-4" /> },
  { id: "cards", label: "Tarjetas NFC", icon: <CreditCard className="h-4 w-4" /> },
];

export function CompanyShell({
  userEmail,
  companyId,
  companyName,
  seatsContracted,
  stats,
  users,
  cards,
  profiles,
}: {
  userEmail: string;
  companyId: string;
  companyName: string;
  seatsContracted: number;
  stats: {
    employees: number;
    profilesActive: number;
    profilesInactive: number;
    cards: number;
  };
  users: Parameters<typeof UsersManager>[0]["users"];
  cards: Parameters<typeof CardsManager>[0]["cards"];
  profiles: Parameters<typeof CardsManager>[0]["profiles"];
}) {
  const router = useRouter();
  const [section, setSection] = React.useState<Section>(() => {
    if (typeof window === "undefined") return "overview";
    const h = window.location.hash.replace("#", "") as Section;
    return (["overview", "employees", "cards"] as Section[]).includes(h) ? h : "overview";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = section === "overview" ? "" : section;
    window.history.replaceState(null, "", url.toString());
  }, [section]);

  const refresh = () => router.refresh();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/company" className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background shadow-soft">
                <span className="font-display text-sm font-bold">V</span>
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight">{companyName}</span>
            </Link>
            <Badge variant="secondary">Empresa</Badge>
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
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Empleados" value={stats.employees} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Perfiles activos" value={stats.profilesActive} icon={<UserCheck className="h-4 w-4" />} />
          <StatCard label="Perfiles inactivos" value={stats.profilesInactive} icon={<UserX className="h-4 w-4" />} />
          <StatCard label="Tarjetas NFC" value={stats.cards} icon={<CreditCard className="h-4 w-4" />} />
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
                    layoutId="company-nav-pill"
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
            {section === "overview" && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tu empresa</CardTitle>
                    <CardDescription>Resumen del plan y uso actual.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border bg-secondary/40 px-4 py-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Asientos contratados</p>
                        <p className="font-display mt-1 text-2xl font-semibold">{seatsContracted}</p>
                      </div>
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
                        <Armchair className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Empleados" value={stats.employees} />
                      <MiniStat label="Tarjetas" value={stats.cards} />
                      <MiniStat label="Activos" value={stats.profilesActive} />
                      <MiniStat label="Inactivos" value={stats.profilesInactive} />
                    </div>
                    {seatsContracted > 0 && stats.employees >= seatsContracted ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Alcanzaste el límite de asientos contratados. Contactá a soporte para ampliar el plan.
                      </p>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accesos rápidos</CardTitle>
                    <CardDescription>Gestioná tu equipo y tarjetas desde un solo lugar.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => setSection("employees")}>
                      <Users className="h-4 w-4" /> Ver empleados ({stats.employees})
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setSection("cards")}>
                      <CreditCard className="h-4 w-4" /> Gestionar tarjetas ({stats.cards})
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {section === "employees" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Empleados</CardTitle>
                      <CardDescription>Crear, activar y administrar empleados de tu empresa.</CardDescription>
                    </div>
                    <Badge variant="outline">{users.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <UsersManager
                    isSuperadmin={false}
                    lockedCompanyId={companyId}
                    companies={[]}
                    users={users}
                    onChanged={refresh}
                  />
                </CardContent>
              </Card>
            )}

            {section === "cards" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tarjetas NFC</CardTitle>
                      <CardDescription>Gestioná las tarjetas NFC de tu empresa.</CardDescription>
                    </div>
                    <Badge variant="outline">{cards.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardsManager
                    isSuperadmin={false}
                    lockedCompanyId={companyId}
                    companies={[]}
                    profiles={profiles}
                    cards={cards}
                    onChanged={refresh}
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}
