"use client";

import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import {
  SaveContactButton,
  ContactAndSocialPills,
  LinkList,
  MapEmbed,
  rgba,
  readableOn,
} from "./shared";
import { TemplateRoot } from "./TemplateRoot";

export function VividTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#F97316";
  const isDark = profile.themeMode === "DARK";
  const onAccent = readableOn(accent) === "dark" ? "#0F172A" : "#FFFFFF";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const mesh = isDark
    ? `radial-gradient(120% 90% at 10% 0%, ${rgba(accent, 0.95)} 0%, transparent 50%),
    radial-gradient(100% 80% at 90% 10%, #EC4899 0%, transparent 45%),
    radial-gradient(80% 60% at 50% 100%, #7C3AED 0%, #1a0533 70%)`
    : `radial-gradient(120% 90% at 10% 0%, ${rgba(accent, 0.35)} 0%, transparent 55%),
    radial-gradient(100% 80% at 90% 10%, rgba(236,72,153,0.3) 0%, transparent 50%),
    radial-gradient(80% 60% at 50% 100%, rgba(124,58,237,0.25) 0%, #FFF7ED 70%)`;

  return (
    <TemplateRoot fluid={fluid} className={`relative min-h-screen ${isDark ? "text-white" : "text-slate-900"}`}>
      <div className="absolute inset-0" style={{ background: isDark ? mesh : "#FFFBF5" }} />
      {!isDark ? <div className="absolute inset-0" style={{ background: mesh }} /> : null}
      <div className={`absolute inset-0 bg-noise mix-blend-overlay ${isDark ? "opacity-25" : "opacity-15"}`} />

      <div className="relative mx-auto flex max-w-md flex-col items-center px-5 pb-14 pt-14 text-center">
        <div
          className="rounded-full p-[3px] shadow-[0_0_40px_rgba(249,115,22,0.45)]"
          style={{ background: `linear-gradient(135deg, ${accent}, #EC4899, #7C3AED)` }}
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.fullName} className="h-28 w-28 rounded-full object-cover ring-4 ring-black/20" />
          ) : (
            <div
              className="grid h-28 w-28 place-items-center rounded-full text-3xl font-bold ring-4 ring-black/20"
              style={{ background: accent, color: onAccent }}
            >
              {initials || "·"}
            </div>
          )}
        </div>

        <h1 className={`font-display mt-6 text-3xl font-bold tracking-tight ${isDark ? "drop-shadow-sm" : ""}`}>{profile.fullName}</h1>
        {profile.jobTitle ? (
          <p className={`mt-1 text-sm font-medium ${isDark ? "text-white/85" : "text-slate-700"}`}>{profile.jobTitle}</p>
        ) : null}
        {profile.companyName ? (
          <p className={`mt-1 text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/60" : "text-slate-500"}`}>
            {profile.companyName}
          </p>
        ) : null}

        {profile.description ? (
          <p className={`mt-4 max-w-xs text-[13px] leading-relaxed ${isDark ? "text-white/75" : "text-slate-600"}`}>
            {profile.description}
          </p>
        ) : null}

        <div className="mt-7 w-full">
          <SaveContactButton
            profile={profile}
            accent={isDark ? "#ffffff" : accent}
            dark={isDark}
            className={isDark ? "!text-neutral-900 !shadow-lg" : "!shadow-md"}
          />
        </div>

        <div className="mt-4">
          <ContactAndSocialPills profile={profile} accent={isDark ? "#ffffff" : accent} dark={isDark} />
        </div>

        <div className="mt-6 w-full">
          <LinkList links={links} accent={accent} variant="vivid" dark={isDark} />
        </div>

        <div className="mt-5 w-full">
          <MapEmbed profile={profile} accent={accent} dark={isDark} />
        </div>

        <footer className={`mt-10 text-[11px] ${isDark ? "text-white/45" : "text-slate-400"}`}>Powered by Volt Cards</footer>
      </div>
    </TemplateRoot>
  );
}
