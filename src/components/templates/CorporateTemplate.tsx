"use client";

import * as React from "react";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import {
  SaveContactButton,
  ContactAndSocialPills,
  LinkList,
  MapEmbed,
  rgba,
  customLinksOnly,
} from "./shared";
import { TemplateRoot } from "./TemplateRoot";
import { CoverImage } from "./CoverImage";

export function CorporateTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#1E3A8A";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TemplateRoot fluid={fluid} className="relative bg-white text-slate-900">
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${accent}, ${rgba(accent, 0.3)})` }}
      />

      {profile.coverUrl ? (
        <CoverImage src={profile.coverUrl} alt={profile.companyName ?? profile.fullName} className="border-b" />
      ) : null}

      <div className="mx-auto max-w-md px-6 py-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          {!profile.coverUrl && (
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              {profile.companyName || "Tarjeta digital"}
            </span>
          )}
          {profile.coverUrl && <span />}
          <span className="font-mono text-[10px] uppercase text-slate-400">/{profile.slug}</span>
        </header>

        <section className="mt-8 flex items-start gap-5">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="h-24 w-24 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div
              className="grid h-24 w-24 place-items-center rounded-2xl text-2xl font-bold text-white ring-1 ring-slate-200"
              style={{ background: accent }}
            >
              {initials || "·"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold leading-tight tracking-tight">
              {profile.fullName || "Tu nombre"}
            </h1>
            {profile.jobTitle ? <p className="mt-0.5 text-sm text-slate-700">{profile.jobTitle}</p> : null}
            {profile.companyName ? (
              <p className="mt-0.5 text-sm font-medium" style={{ color: accent }}>
                {profile.companyName}
              </p>
            ) : null}
          </div>
        </section>

        {profile.description ? (
          <p
            className="mt-6 border-l-2 pl-4 text-[13.5px] leading-relaxed text-slate-700"
            style={{ borderColor: accent }}
          >
            {profile.description}
          </p>
        ) : null}

        <section className="mt-8 space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Contacto</h2>
          <SaveContactButton profile={profile} accent={accent} />
          <ContactAndSocialPills profile={profile} accent={accent} align="start" />
        </section>

        {customLinksOnly(links).length ? (
          <section className="mt-6">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Enlaces</h2>
            <LinkList links={links} accent={accent} variant="corporate" />
          </section>
        ) : null}

        {profile.location ? (
          <section className="mt-6">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ubicación</h2>
            <MapEmbed profile={profile} accent={accent} />
          </section>
        ) : null}

        <footer className="mt-12 border-t pt-4 text-center text-[11px] text-slate-400">
          Powered by <span className="font-medium text-slate-600">Volt Cards</span>
        </footer>
      </div>
    </TemplateRoot>
  );
}
