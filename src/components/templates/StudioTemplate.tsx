"use client";

import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import {
  SaveContactButton,
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
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TemplateRoot fluid={fluid} className="relative bg-white text-neutral-950">
      <div className="h-2 w-full" style={{ background: accent }} />

      <div className="mx-auto max-w-md px-5 pb-14 pt-8">
        <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
              {profile.companyName || "Portfolio"}
            </p>
            <h1 className="font-display mt-2 text-[2rem] font-bold leading-[0.95] tracking-tight">
              {profile.fullName}
            </h1>
            {profile.jobTitle ? (
              <p className="mt-3 text-sm font-medium text-neutral-600">{profile.jobTitle}</p>
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
          <p className="mt-6 text-[15px] leading-relaxed text-neutral-600">{profile.description}</p>
        ) : null}

        <section className="mt-8 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Contacto</h2>
          <SaveContactButton profile={profile} accent={accent} className="!rounded-lg" />
          <ContactAndSocialPills profile={profile} accent={accent} align="start" />
        </section>

        {customLinksOnly(links).length ? (
          <section className="mt-8">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Enlaces</h2>
            <LinkList links={links} accent={accent} variant="studio" />
          </section>
        ) : null}

        {profile.location ? (
          <section className="mt-8">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Ubicación</h2>
            <MapEmbed profile={profile} accent={accent} />
          </section>
        ) : null}

        <footer className="mt-12 border-t border-neutral-200 pt-4 text-[11px] text-neutral-400">
          Volt Cards
        </footer>
      </div>
    </TemplateRoot>
  );
}
