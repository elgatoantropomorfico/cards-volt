"use client";

import * as React from "react";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { ContactActions, LinkList, MapEmbed, SocialPills, rgba } from "./shared";

export function MinimalTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#0F172A";
  const isDark = profile.themeMode === "DARK";

  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main
      className={`relative ${fluid ? "h-full" : "min-h-screen"} ${isDark ? "bg-[#0a0a0f] text-white" : "bg-[#fafafa] text-slate-900"} overflow-y-auto`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          background: `radial-gradient(60% 60% at 50% 0%, ${rgba(accent, 0.18)} 0%, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-5 px-5 pb-12 pt-12 text-center">
        <div
          className="relative rounded-full p-[2px]"
          style={{ background: `conic-gradient(from 180deg, ${accent}, ${rgba(accent, 0.2)}, ${accent})` }}
        >
          <div className={`rounded-full p-[2px] ${isDark ? "bg-[#0a0a0f]" : "bg-[#fafafa]"}`}>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div
                className="grid h-24 w-24 place-items-center rounded-full text-2xl font-semibold text-white"
                style={{ background: accent }}
              >
                {initials || "·"}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{profile.fullName || "Tu nombre"}</h1>
          {profile.jobTitle ? (
            <p className={`text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>{profile.jobTitle}</p>
          ) : null}
          {profile.companyName ? (
            <p className="text-sm font-medium" style={{ color: accent }}>
              {profile.companyName}
            </p>
          ) : null}
        </div>

        {profile.description ? (
          <p className={`text-pretty text-[13px] leading-relaxed ${isDark ? "text-white/70" : "text-slate-600"}`}>
            {profile.description}
          </p>
        ) : null}

        <SocialPills profile={profile} accent={accent} dark={isDark} />

        <div className="w-full">
          <ContactActions profile={profile} accent={accent} variant="minimal" />
        </div>

        <div className="w-full">
          <LinkList links={links} accent={accent} variant="minimal" />
        </div>

        <div className="w-full">
          <MapEmbed profile={profile} accent={accent} dark={isDark} />
        </div>

        <footer className={`mt-4 text-[11px] ${isDark ? "text-white/40" : "text-slate-400"}`}>
          Powered by <span className="font-medium">Volt Cards</span>
        </footer>
      </div>
    </main>
  );
}
