"use client";

import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import {
  ContactCtaBlock,
  ContactAndSocialPills,
  LinkList,
  MapEmbed,
  rgba,
} from "./shared";
import { TemplateRoot } from "./TemplateRoot";

export function NoirTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#C9A227";
  const isDark = profile.themeMode === "DARK";
  const bg = isDark ? "#0a0a0a" : "#F5F0E8";
  const textMain = isDark ? "text-white" : "text-neutral-900";
  const textMuted = isDark ? "text-white/55" : "text-neutral-600";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TemplateRoot fluid={fluid} className={`relative ${textMain}`}>
      <div className="absolute inset-0" style={{ background: bg }} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at top,rgba(201,162,39,0.12),transparent 70%)"
            : `radial-gradient(ellipse at top,${rgba(accent, 0.15)},transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-md px-6 pb-14 pt-14">
        <div className="mx-auto h-px w-16" style={{ background: accent }} />
        <p className={`mt-6 text-center text-[10px] uppercase tracking-[0.35em] ${textMuted}`}>
          {profile.companyName || "Volt Cards"}
        </p>

        <div className="mt-8 flex justify-center">
          <div className="relative p-[1px]" style={{ background: `linear-gradient(135deg, ${accent}, ${rgba(accent, 0.2)})` }}>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.fullName} className="h-28 w-28 object-cover" />
            ) : (
              <div
                className="grid h-28 w-28 place-items-center text-2xl font-light tracking-widest"
                style={{ background: isDark ? "#111" : rgba(accent, 0.12), color: accent }}
              >
                {initials || "·"}
              </div>
            )}
          </div>
        </div>

        <h1 className="font-display mt-8 text-center text-3xl font-light tracking-tight">{profile.fullName}</h1>
        {profile.jobTitle ? (
          <p className={`mt-2 text-center text-sm tracking-wide ${textMuted}`}>{profile.jobTitle}</p>
        ) : null}

        {profile.description ? (
          <p className={`mt-6 text-center text-[13px] leading-relaxed ${textMuted}`}>{profile.description}</p>
        ) : null}

        <div className="mx-auto mt-8 h-px w-full max-w-[200px]" style={{ background: rgba(accent, 0.35) }} />

        <div className="mt-8">
          <ContactCtaBlock profile={profile} accent={accent} dark={isDark} saveClassName="!rounded-none tracking-wide" />
        </div>

        <div className="mt-5">
          <ContactAndSocialPills profile={profile} accent={accent} dark={isDark} />
        </div>

        <div className="mt-6">
          <LinkList links={links} accent={accent} variant="noir" dark={isDark} />
        </div>

        <div className="mt-6">
          <MapEmbed profile={profile} accent={accent} dark={isDark} />
        </div>

        <footer className={`mt-12 text-center text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/30" : "text-neutral-400"}`}>
          Volt Cards
        </footer>
      </div>
    </TemplateRoot>
  );
}
