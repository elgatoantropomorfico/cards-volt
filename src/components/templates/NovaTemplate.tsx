"use client";

import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import {
  SaveContactButton,
  ContactAndSocialPills,
  LinkList,
  MapEmbed,
  rgba,
} from "./shared";
import { TemplateRoot } from "./TemplateRoot";

export function NovaTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#06B6D4";
  const isDark = profile.themeMode === "DARK";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TemplateRoot fluid={fluid} className={isDark ? "relative bg-[#0B1020] text-white" : "relative bg-[#F0F4F8] text-slate-900"}>
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(6,182,212,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.07) 1px, transparent 1px)"
            : "linear-gradient(rgba(6,182,212,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at 50% 0%, ${rgba(accent, 0.35)} 0%, transparent 65%)`
            : `radial-gradient(ellipse at 50% 0%, ${rgba(accent, 0.2)} 0%, transparent 65%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-md px-5 pb-14 pt-12">
        <div className={`rounded-3xl border p-5 backdrop-blur-xl ${isDark ? "border-white/10 bg-white/5" : "border-slate-200/80 bg-white/80 shadow-soft"}`}>
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/20"
              />
            ) : (
              <div
                className="grid h-16 w-16 place-items-center rounded-2xl text-lg font-bold ring-1 ring-white/20"
                style={{ background: rgba(accent, 0.25), color: accent }}
              >
                {initials || "·"}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display truncate text-xl font-semibold tracking-tight">{profile.fullName}</h1>
              {profile.jobTitle ? <p className={`truncate text-sm ${isDark ? "text-cyan-100/60" : "text-slate-600"}`}>{profile.jobTitle}</p> : null}
              {profile.companyName ? (
                <p className="truncate text-xs font-medium" style={{ color: accent }}>
                  {profile.companyName}
                </p>
              ) : null}
            </div>
          </div>

          {profile.description ? (
            <p className={`mt-4 text-[13px] leading-relaxed ${isDark ? "text-white/65" : "text-slate-600"}`}>{profile.description}</p>
          ) : null}

          <div className="mt-5">
            <SaveContactButton profile={profile} accent={accent} dark={isDark} />
          </div>

          <div className="mt-4">
            <ContactAndSocialPills profile={profile} accent={accent} dark={isDark} />
          </div>
        </div>

        <div className="mt-5">
          <LinkList links={links} accent={accent} variant="nova" dark={isDark} />
        </div>

        <div className="mt-5">
          <MapEmbed profile={profile} accent={accent} dark={isDark} />
        </div>

        <footer className={`mt-10 text-center text-[11px] ${isDark ? "text-white/35" : "text-slate-400"}`}>
          <span style={{ color: accent }}>●</span> Volt Cards
        </footer>
      </div>
    </TemplateRoot>
  );
}
