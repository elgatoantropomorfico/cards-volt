"use client";

import * as React from "react";
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

export function PremiumTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#7C3AED";
  const isDark = profile.themeMode === "DARK";
  const bgBase = isDark ? "#070710" : "#fafafa";
  const onAccent = readableOn(accent) === "dark" ? "#0F172A" : "#FFFFFF";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const heroGradient = isDark
    ? `radial-gradient(120% 80% at 50% -10%, ${rgba(accent, 0.95)} 0%, ${rgba(accent, 0.55)} 35%, ${bgBase} 90%)`
    : `radial-gradient(120% 80% at 50% -10%, ${rgba(accent, 0.75)} 0%, ${rgba(accent, 0.28)} 42%, ${bgBase} 92%)`;

  const heroBackground = profile.coverUrl
    ? isDark
      ? `linear-gradient(180deg, rgba(7,7,16,0) 30%, rgba(7,7,16,0.85) 100%), url(${profile.coverUrl}) center/cover`
      : `linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(250,250,250,0.88) 100%), url(${profile.coverUrl}) center/cover`
    : heroGradient;

  const heroTextClass = isDark ? "text-white" : "text-slate-900";
  const heroMutedClass = isDark ? "text-white/70" : "text-slate-600";
  const bodyMutedClass = isDark ? "text-white/75" : "text-slate-600";
  const footerClass = isDark ? "text-white/40" : "text-slate-400";

  return (
    <TemplateRoot
      fluid={fluid}
      className={`relative ${isDark ? "bg-[#070710] text-white" : "bg-[#fafafa] text-slate-900"}`}
    >
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: heroBackground }} />
        <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />

        <div className="relative px-6 pb-20 pt-10 text-center">
          <p className={`text-[11px] uppercase tracking-[0.2em] ${heroMutedClass}`}>
            {profile.companyName || "Volt Cards"}
          </p>
          <h1 className={`font-display mt-1 text-3xl font-semibold leading-tight tracking-tight ${heroTextClass}`}>
            {profile.fullName || "Tu nombre"}
          </h1>
          {profile.jobTitle ? <p className={`mt-1 text-sm ${heroMutedClass}`}>{profile.jobTitle}</p> : null}
        </div>

        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -bottom-px h-16 w-full"
          style={{ color: bgBase }}
          aria-hidden
        >
          <path d="M0,200 C320,80 1120,80 1440,200 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Avatar */}
      <div className="relative -mt-14 flex justify-center">
        <div
          className="relative rounded-3xl p-[2px] shadow-pop"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, ${rgba(accent, 0.5)} 100%)` }}
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-28 w-28 rounded-[22px] object-cover"
              style={{ boxShadow: `0 0 0 4px ${bgBase}` }}
            />
          ) : (
            <div
              className="grid h-28 w-28 place-items-center rounded-[22px] text-3xl font-bold ring-4"
              style={{ background: accent, color: onAccent, boxShadow: `0 0 0 4px ${bgBase}` }}
            >
              {initials || "·"}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-md px-6 pb-12 text-center">
        {profile.description ? (
          <p className={`mt-2 text-pretty text-[13.5px] leading-relaxed ${bodyMutedClass}`}>{profile.description}</p>
        ) : null}

        <div className="mt-6">
          <SaveContactButton profile={profile} accent={accent} dark={isDark} />
        </div>

        <div className="mt-4">
          <ContactAndSocialPills profile={profile} accent={accent} dark={isDark} />
        </div>

        <div className="mt-5">
          <LinkList links={links} accent={accent} variant="premium" dark={isDark} />
        </div>

        <div className="mt-5">
          <MapEmbed profile={profile} accent={accent} dark={isDark} />
        </div>

        <footer className={`mt-10 text-[11px] ${footerClass}`}>
          Powered by <span className={`font-medium ${isDark ? "text-white/70" : "text-slate-600"}`}>Volt Cards</span>
        </footer>
      </div>
    </TemplateRoot>
  );
}
