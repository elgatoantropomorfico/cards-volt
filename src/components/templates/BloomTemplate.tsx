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

export function BloomTemplate({
  profile,
  links,
  fluid,
}: {
  profile: ProfileView;
  links: ProfileLink[];
  fluid?: boolean;
}) {
  const accent = profile.primaryColor || "#DB2777";
  const initials = profile.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TemplateRoot fluid={fluid} className="relative text-rose-950">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(165deg, #FFF8F2 0%, #FFE8F0 45%, #FFF5EB 100%)" }}
      />
      <div
        className="pointer-events-none absolute -right-16 top-20 h-56 w-56 rounded-full blur-3xl"
        style={{ background: rgba(accent, 0.18) }}
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-32 h-48 w-48 rounded-full blur-3xl"
        style={{ background: rgba("#F59E0B", 0.12) }}
      />

      <div className="relative mx-auto max-w-md px-5 pb-14 pt-12">
        <div className="rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(219,39,119,0.2)] backdrop-blur-sm">
          <div className="flex flex-col items-center text-center">
            <div
              className="rounded-full p-[3px]"
              style={{ background: `linear-gradient(135deg, ${accent}, #F9A8D4)` }}
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={profile.fullName} className="h-24 w-24 rounded-full object-cover ring-4 ring-white" />
              ) : (
                <div
                  className="grid h-24 w-24 place-items-center rounded-full text-2xl font-semibold text-white ring-4 ring-white"
                  style={{ background: accent }}
                >
                  {initials || "·"}
                </div>
              )}
            </div>

            <h1 className="font-display mt-5 text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
            {profile.jobTitle ? <p className="mt-1 text-sm text-rose-800/70">{profile.jobTitle}</p> : null}
            {profile.companyName ? (
              <p className="mt-1 text-sm font-medium" style={{ color: accent }}>
                {profile.companyName}
              </p>
            ) : null}
          </div>

          {profile.description ? (
            <p className="mt-5 text-center text-[13px] leading-relaxed text-rose-900/65">{profile.description}</p>
          ) : null}

          <div className="mt-6">
            <SaveContactButton profile={profile} accent={accent} className="!shadow-md" />
          </div>

          <div className="mt-4">
            <ContactAndSocialPills profile={profile} accent={accent} />
          </div>
        </div>

        <div className="mt-5">
          <LinkList links={links} accent={accent} variant="bloom" />
        </div>

        <div className="mt-5">
          <MapEmbed profile={profile} accent={accent} />
        </div>

        <footer className="mt-10 text-center text-[11px] text-rose-900/40">
          Powered by <span className="font-medium text-rose-900/60">Volt Cards</span>
        </footer>
      </div>
    </TemplateRoot>
  );
}
