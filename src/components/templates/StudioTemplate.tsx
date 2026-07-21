"use client";

import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import {
  ContactCtaBlock,
  ContactAndSocialPills,
  LinkList,
  MapEmbed,
  customLinksOnly,
} from "./shared";
import { TemplateRoot } from "./TemplateRoot";

export function StudioTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#DC2626";
  const isDark = profile.themeMode === "DARK";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TemplateRoot fluid={fluid} className={isDark ? "relative bg-neutral-950 text-neutral-100" : "relative bg-white text-neutral-950"}>
      <div className="h-2 w-full" style={{ background: accent }} />

      <div className="mx-auto max-w-md px-5 pb-14 pt-8">
        <div className={`flex items-end justify-between gap-4 border-b pb-6 ${isDark ? "border-white/10" : "border-neutral-200"}`}>
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
              {profile.companyName || "Portfolio"}
            </p>
            <h1 className="font-display mt-2 text-[2rem] font-bold leading-[0.95] tracking-tight">
              {profile.fullName}
            </h1>
            {profile.jobTitle ? (
              <p className={`mt-3 text-sm font-medium ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>{profile.jobTitle}</p>
            ) : null}
          </div>

          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-24 w-20 shrink-0 object-cover"
              style={{ boxShadow: `8px 8px 0 ${accent}` }}
            />
          ) : (
            <div
              className="grid h-24 w-20 shrink-0 place-items-center text-xl font-bold text-white"
              style={{ background: accent, boxShadow: `8px 8px 0 ${accent}55` }}
            >
              {initials || "·"}
            </div>
          )}
        </div>

        {profile.description ? (
          <p className={`mt-6 text-[15px] leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>{profile.description}</p>
        ) : null}

        <section className="mt-8 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Contacto</h2>
          <ContactCtaBlock profile={profile} accent={accent} dark={isDark} saveClassName="!rounded-lg" />
          <ContactAndSocialPills profile={profile} accent={accent} dark={isDark} align="start" />
        </section>

        {customLinksOnly(links).length ? (
          <section className="mt-8">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Enlaces</h2>
            <LinkList links={links} accent={accent} variant="studio" dark={isDark} />
          </section>
        ) : null}

        {profile.location ? (
          <section className="mt-8">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Ubicación</h2>
            <MapEmbed profile={profile} accent={accent} dark={isDark} />
          </section>
        ) : null}

        <footer className={`mt-12 border-t pt-4 text-[11px] ${isDark ? "border-white/10 text-neutral-500" : "border-neutral-200 text-neutral-400"}`}>
          Volt Cards
        </footer>
      </div>
    </TemplateRoot>
  );
}
