"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "./LogoutButton";
import { PhonePreview } from "./PhonePreview";
import { ProfileSection } from "./sections/ProfileSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { LinksSection } from "./sections/LinksSection";
import { CardSection } from "./sections/CardSection";
import type { NfcCardView, ProfileLink, ProfileView } from "@/lib/profile-types";
import { cn } from "@/lib/utils";
import { switchActiveProfile } from "@/server/profile-actions";

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
  profiles,
  links: initialLinks,
  nfcCard: initialNfcCard,
  nfcCards: initialNfcCards,
  appHost,
  appBaseUrl,
}: {
  user: { email: string; name: string; role: "SUPERADMIN" | "USER" };
  profile: ProfileView;
  profiles: { id: string; slug: string; fullName: string }[];
  links: ProfileLink[];
  nfcCard: NfcCardView | null;
  nfcCards?: NfcCardView[];
  appHost: string;
  appBaseUrl: string;
}) {
  const router = useRouter();
  const [section, setSection] = React.useState<Section>(() => {
    if (typeof window === "undefined") return "profile";
    const h = window.location.hash.replace("#", "") as Section;
    return (["profile", "appearance", "links", "card"] as Section[]).includes(h) ? h : "profile";
  });
  const [profile, setProfile] = React.useState<ProfileView>(initialProfile);
  const [links, setLinks] = React.useState<ProfileLink[]>(initialLinks);
  const [nfcCard, setNfcCard] = React.useState<NfcCardView | null>(initialNfcCard);
  const [nfcCards, setNfcCards] = React.useState<NfcCardView[]>(
    initialNfcCards?.length ? initialNfcCards : initialNfcCard ? [initialNfcCard] : [],
  );
  const [showPreview, setShowPreview] = React.useState(true);
  const [switching, setSwitching] = React.useState(false);

  React.useEffect(() => setProfile(initialProfile), [initialProfile]);
  React.useEffect(() => setLinks(initialLinks), [initialLinks]);
  React.useEffect(() => setNfcCard(initialNfcCard), [initialNfcCard]);
  React.useEffect(() => {
    setNfcCards(initialNfcCards?.length ? initialNfcCards : initialNfcCard ? [initialNfcCard] : []);
  }, [initialNfcCards, initialNfcCard]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = section;
    window.history.replaceState(null, "", url.toString());
  }, [section]);

  React.useEffect(() => {
    if (section === "card") router.refresh();
  }, [section, router]);

  function patch(p: Partial<ProfileView>) {
    setProfile((prev) => ({ ...prev, ...p }));
  }

  async function onSwitchProfile(id: string) {
    if (id === profile.id || switching) return;
    setSwitching(true);
    const res = await switchActiveProfile(id);
    setSwitching(false);
    if (res.ok) {
      router.push(`/dashboard?profileId=${id}`);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-2 px-4 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background shadow-soft">
                <span className="font-display text-sm font-bold">V</span>
              </span>
              <span className="font-display truncate text-[15px] font-semibold tracking-tight">Volt Cards</span>
            </Link>
            {profiles.length > 1 ? (
              <div className="relative hidden md:block">
                <select
                  value={profile.id}
                  disabled={switching}
                  onChange={(e) => void onSwitchProfile(e.target.value)}
                  className="appearance-none rounded-full border bg-background pl-3 pr-7 py-1 text-xs font-mono text-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  aria-label="Cambiar perfil"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      /{p.slug}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              </div>
            ) : (
              <Badge variant="outline" className="hidden shrink-0 md:inline-flex">
                /{profile.slug}
              </Badge>
            )}
            {profiles.length > 1 && (
              <select
                value={profile.id}
                disabled={switching}
                onChange={(e) => void onSwitchProfile(e.target.value)}
                className="md:hidden max-w-[40vw] appearance-none rounded-full border bg-background px-2 py-1 text-[11px] font-mono"
                aria-label="Cambiar perfil"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    /{p.slug}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link href={`/${profile.slug}`} target="_blank">
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ver perfil">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <ExternalLink className="h-3.5 w-3.5" /> Ver perfil
              </Button>
            </Link>
            {user.role === "SUPERADMIN" && (
              <Link href="/admin">
                <Button variant="soft" size="sm" className="hidden sm:inline-flex"><Shield className="h-3.5 w-3.5" /> Admin</Button>
                <Button variant="soft" size="icon" className="sm:hidden" aria-label="Admin"><Shield className="h-4 w-4" /></Button>
              </Link>
            )}
            <LogoutButton>
              <LogOut className="h-4 w-4" />
            </LogoutButton>
          </div>
        </div>
      </header>

      <div className="container px-4 py-4 sm:py-6">
        {profile.profileStatus === "PENDING_CONFIGURATION" && profile.sourceOrderId && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#7000FF]/20 to-[#A855F7]/10 border border-[#7000FF]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h4 className="font-semibold text-sm">Tu Volt Card ({profile.sourceOrderNumber || "Tienda"}) está pendiente de configuración</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completá el asistente guiado para que podamos enviar tu tarjeta física a producción.
              </p>
            </div>
            <Link
              href={`/onboarding/${profile.sourceOrderId}`}
              className="px-4 py-2 rounded-xl bg-[#7000FF] hover:bg-[#8A2BE2] text-white text-xs font-semibold shrink-0 shadow-md transition-colors"
            >
              Continuar configurando mi Volt Card →
            </Link>
          </div>
        )}

        <div className="mb-4 flex min-w-0 items-center justify-between gap-2 sm:mb-6 sm:gap-3">
          <nav className="flex max-w-full overflow-x-auto rounded-2xl border bg-card/80 p-1 shadow-soft backdrop-blur [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((n) => {
              const active = section === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSection(n.id)}
                  className={cn(
                    "relative inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition sm:gap-2 sm:px-3",
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
                  <span className="relative z-10 inline-flex items-center gap-1.5 sm:gap-2">
                    {n.icon}
                    <span className="hidden sm:inline">{n.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="hidden shrink-0 md:inline-flex"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Ocultar preview" : "Mostrar preview"}
          </Button>
        </div>

        <div className={cn("grid min-w-0 gap-6", showPreview ? "lg:grid-cols-[1fr_400px]" : "")}>
          <div className="min-w-0 overflow-x-hidden">
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
                  <CardSection
                    profile={profile}
                    appBaseUrl={appBaseUrl}
                    nfcCard={nfcCard}
                    nfcCards={nfcCards}
                    onCardChange={(c) => {
                      setNfcCard(c);
                      if (c) {
                        setNfcCards((prev) => {
                          const rest = prev.filter((x) => x.id !== c.id);
                          return [c, ...rest];
                        });
                      }
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

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
