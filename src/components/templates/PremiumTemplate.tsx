"use client";

import * as React from "react";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { ContactActions, LinkList, MapEmbed, SocialPills, rgba, readableOn } from "./shared";

// HiHello / Popl inspired: dramatic arc hero, overlapping avatar, sticky CTA.
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
  const onAccent = readableOn(accent) === "dark" ? "#0F172A" : "#FFFFFF";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className={`relative ${fluid ? "h-full" : "min-h-screen"} bg-[#070710] text-white overflow-y-auto`}>
      {/* HERO with curved arc bottom */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: profile.coverUrl
              ? `linear-gradient(180deg, rgba(7,7,16,0) 30%, rgba(7,7,16,0.85) 100%), url(${profile.coverUrl}) center/cover`
              : `radial-gradient(120% 80% at 50% -10%, ${rgba(accent, 0.95)} 0%, ${rgba(accent, 0.55)} 35%, #070710 90%)`,
          }}
        />
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />

        <div className="relative px-6 pb-20 pt-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
            {profile.companyName || "Volt Cards"}
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold leading-tight tracking-tight">
            {profile.fullName || "Tu nombre"}
          </h1>
          {profile.jobTitle ? (
            <p className="mt-1 text-sm text-white/80">{profile.jobTitle}</p>
          ) : null}
        </div>

        {/* Curved bottom arc */}
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -bottom-px h-16 w-full text-[#070710]"
          aria-hidden
        >
          <path d="M0,200 C320,80 1120,80 1440,200 L1440,200 L0,200 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Avatar overlapping the arc */}
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
              className="h-28 w-28 rounded-[22px] object-cover ring-4 ring-[#070710]"
            />
          ) : (
            <div
              className="grid h-28 w-28 place-items-center rounded-[22px] text-3xl font-bold ring-4 ring-[#070710]"
              style={{ background: accent, color: onAccent }}
            >
              {initials || "·"}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-md px-6 pb-32 text-center">
        {profile.description ? (
          <p className="mt-2 text-pretty text-[13.5px] leading-relaxed text-white/75">
            {profile.description}
          </p>
        ) : null}

        <div className="mt-6">
          <SocialPills profile={profile} accent={accent} dark />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Stat label="Slug" value={`/${profile.slug}`} accent={accent} />
          {profile.location ? <Stat label="Ubicación" value={profile.location.split(",")[0]} accent={accent} /> : <Stat label="Volt" value="NFC" accent={accent} />}
          <Stat label="Plan" value="Premium" accent={accent} />
        </div>

        <div className="mt-6">
          <ContactActions profile={profile} accent={accent} variant="premium" />
        </div>

        <div className="mt-5">
          <LinkList links={links} accent={accent} variant="premium" />
        </div>

        <div className="mt-5">
          <MapEmbed profile={profile} accent={accent} dark />
        </div>

        <footer className="mt-10 text-[11px] text-white/40">
          Powered by <span className="font-medium text-white/70">Volt Cards</span>
        </footer>
      </div>

      {/* Sticky save-contact CTA */}
      <div className="pointer-events-none sticky bottom-0 left-0 right-0 z-10 -mt-24">
        <div className="pointer-events-auto mx-auto max-w-md px-6 pb-5">
          <a
            href={`/${profile.slug}/vcard`}
            className="block w-full rounded-2xl px-5 py-3.5 text-center text-sm font-semibold shadow-pop transition active:scale-[0.99]"
            style={{ background: accent, color: onAccent }}
          >
            Guardar contacto
          </a>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-2xl border px-2.5 py-2.5 text-left"
      style={{ background: rgba(accent, 0.08), borderColor: rgba(accent, 0.2) }}
    >
      <div className="text-[10px] uppercase tracking-wider text-white/60">{label}</div>
      <div className="mt-0.5 truncate text-[12.5px] font-medium text-white">{value}</div>
    </div>
  );
}
