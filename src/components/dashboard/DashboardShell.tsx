"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Palette,
  LinkIcon,
  QrCode,
  LogOut,
  Shield,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "./LogoutButton";
import { PhonePreview } from "./PhonePreview";
import { ProfileSection } from "./sections/ProfileSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { LinksSection } from "./sections/LinksSection";
import { CardSection } from "./sections/CardSection";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { cn } from "@/lib/utils";

type Section = "profile" | "appearance" | "links" | "card";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Perfil", icon: <User className="h-4 w-4" /> },
  { id: "appearance", label: "Apariencia", icon: <Palette className="h-4 w-4" /> },
  { id: "links", label: "Enlaces", icon: <LinkIcon className="h-4 w-4" /> },
  { id: "card", label: "Mi tarjeta", icon: <QrCode className="h-4 w-4" /> },
];

export function DashboardShell({
  user,
  profile: initialProfile,
  links: initialLinks,
  appHost,
  appBaseUrl,
}: {
  user: { email: string; name: string; role: "SUPERADMIN" | "USER" };
  profile: ProfileView;
  links: ProfileLink[];
  appHost: string;
  appBaseUrl: string;
}) {
  const [section, setSection] = React.useState<Section>(() => {
    if (typeof window === "undefined") return "profile";
    const h = window.location.hash.replace("#", "") as Section;
    return (["profile", "appearance", "links", "card"] as Section[]).includes(h) ? h : "profile";
  });
  const [profile, setProfile] = React.useState<ProfileView>(initialProfile);
  const [links, setLinks] = React.useState<ProfileLink[]>(initialLinks);
  const [showPreview, setShowPreview] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = section;
    window.history.replaceState(null, "", url.toString());
  }, [section]);

  function patch(p: Partial<ProfileView>) {
    setProfile((prev) => ({ ...prev, ...p }));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background shadow-soft">
                <span className="font-display text-sm font-bold">V</span>
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight">Volt Cards</span>
            </Link>
            <Badge variant="outline" className="hidden md:inline-flex">/{profile.slug}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href={`/${profile.slug}`} target="_blank">
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <ExternalLink className="h-3.5 w-3.5" /> Ver perfil
              </Button>
            </Link>
            {user.role === "SUPERADMIN" && (
              <Link href="/admin">
                <Button variant="soft" size="sm"><Shield className="h-3.5 w-3.5" /> Admin</Button>
              </Link>
            )}
            <span className="hidden text-xs text-muted-foreground md:inline">{user.email}</span>
            <LogoutButton>
              <LogOut className="h-4 w-4" />
            </LogoutButton>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Tab strip */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <nav className="inline-flex rounded-2xl border bg-card/80 p-1 shadow-soft backdrop-blur">
            {NAV.map((n) => {
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                    active ? "text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="hidden md:inline-flex"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Ocultar preview" : "Mostrar preview"}
          </Button>
        </div>

        <div className={cn("grid gap-6", showPreview ? "lg:grid-cols-[1fr_400px]" : "")}>
          {/* Section content */}
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {section === "profile" && (
                  <ProfileSection profile={profile} onChange={patch} appHost={appHost} />
                )}
                {section === "appearance" && (
                  <AppearanceSection profile={profile} onChange={patch} />
                )}
                {section === "links" && (
                  <LinksSection links={links} setLinks={setLinks} />
                )}
                {section === "card" && (
                  <CardSection profile={profile} appBaseUrl={appBaseUrl} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Live preview */}
          {showPreview && (
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <p className="mb-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Vista previa en vivo
                </p>
                <PhonePreview profile={profile} links={links} />
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Reactivo · no necesitás guardar para ver cambios
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
