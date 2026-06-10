"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Mail, MessageCircle, Phone, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";
import { SOCIALS } from "@/lib/socials";

function digits(s: string) {
  return s.replace(/[^\d+]/g, "");
}

export function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 124, g: 58, b: 237 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

export function rgba(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function readableOn(hex: string): "light" | "dark" {
  const { r, g, b } = hexToRgb(hex);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "dark" : "light";
}

export function SaveContactButton({
  profile,
  accent,
  dark,
  className,
}: {
  profile: ProfileView;
  accent: string;
  dark?: boolean;
  className?: string;
}) {
  const onAccent = readableOn(accent) === "dark" ? "#0F172A" : "#FFFFFF";
  return (
    <Link
      href={`/${profile.slug}/vcard`}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold shadow-soft transition active:scale-[0.98] ${className ?? ""}`}
      style={{ background: accent, color: onAccent }}
    >
      <Download className="h-4 w-4" />
      Guardar contacto
    </Link>
  );
}

type ContactChannel = {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
};

export function ContactRoundPills({
  profile,
  accent,
  dark,
  inline,
}: {
  profile: ProfileView;
  accent: string;
  dark?: boolean;
  inline?: boolean;
}) {
  const channels: ContactChannel[] = [];

  if (profile.whatsapp) {
    channels.push({
      href: `https://wa.me/${digits(profile.whatsapp)}`,
      label: "WhatsApp",
      icon: <MessageCircle className="h-4 w-4" />,
      color: "#25D366",
    });
  }
  if (profile.phone) {
    channels.push({
      href: `tel:${digits(profile.phone)}`,
      label: "Llamar",
      icon: <Phone className="h-4 w-4" />,
      color: accent,
    });
  }
  if (profile.email) {
    channels.push({
      href: `mailto:${profile.email}`,
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      color: dark ? "#fff" : "#0F172A",
    });
  }

  if (!channels.length) return inline ? null : null;

  const pills = channels.map((c) => (
        <a
          key={c.label}
          href={c.href}
          target={c.href.startsWith("http") ? "_blank" : undefined}
          rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
          aria-label={c.label}
          className="grid h-11 w-11 place-items-center rounded-full border shadow-soft transition active:scale-95"
          style={{
            background: dark ? rgba("#ffffff", 0.08) : rgba(accent, 0.08),
            borderColor: dark ? rgba("#ffffff", 0.14) : rgba(accent, 0.2),
            color: c.color,
          }}
        >
          {c.icon}
        </a>
  ));

  if (inline) return <>{pills}</>;
  return <div className="flex flex-wrap items-center justify-center gap-2.5">{pills}</div>;
}

export function SocialPills({
  profile,
  accent,
  dark,
  inline,
}: {
  profile: ProfileView;
  accent: string;
  dark?: boolean;
  inline?: boolean;
}) {
  const items: { kind: keyof typeof SOCIALS; url: string }[] = [];
  if (profile.instagram) items.push({ kind: "INSTAGRAM", url: SOCIALS.INSTAGRAM.buildUrl!(profile.instagram) });
  if (profile.linkedin) items.push({ kind: "LINKEDIN", url: ensureUrl(profile.linkedin) });
  if (profile.twitter) items.push({ kind: "TWITTER", url: SOCIALS.TWITTER.buildUrl!(profile.twitter) });
  if (profile.facebook) items.push({ kind: "FACEBOOK", url: ensureUrl(profile.facebook) });
  if (profile.youtube) items.push({ kind: "YOUTUBE", url: ensureUrl(profile.youtube) });
  if (profile.tiktok) items.push({ kind: "TIKTOK", url: SOCIALS.TIKTOK.buildUrl!(profile.tiktok) });
  if (profile.github) items.push({ kind: "GITHUB", url: ensureUrl(profile.github) });

  if (!items.length) return inline ? null : null;

  const pills = items.map(({ kind, url }) => {
        const Meta = SOCIALS[kind];
        const Icon = Meta.icon;
        return (
          <a
            key={kind}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={Meta.label}
            className="grid h-11 w-11 place-items-center rounded-full border shadow-soft transition active:scale-95"
            style={{
              background: dark ? rgba("#ffffff", 0.08) : rgba(accent, 0.08),
              borderColor: dark ? rgba("#ffffff", 0.14) : rgba(accent, 0.2),
              color: dark ? "#fff" : Meta.color,
            }}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
  });

  if (inline) return <>{pills}</>;
  return <div className="flex flex-wrap items-center justify-center gap-2.5">{pills}</div>;
}

function ensureUrl(v: string) {
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

const CONTACT_LINK_KINDS = new Set<ProfileLink["kind"]>(["EMAIL", "PHONE", "WHATSAPP"]);

/** Custom links only — contact channels use round pills, not the list. */
export function customLinksOnly(links: ProfileLink[]) {
  return links.filter((l) => !CONTACT_LINK_KINDS.has(l.kind));
}

export function ContactAndSocialPills({
  profile,
  accent,
  dark,
  align = "center",
}: {
  profile: ProfileView;
  accent: string;
  dark?: boolean;
  align?: "center" | "start";
}) {
  const hasContact = !!(profile.whatsapp || profile.phone || profile.email);
  const hasSocial = !!(
    profile.instagram ||
    profile.linkedin ||
    profile.twitter ||
    profile.facebook ||
    profile.youtube ||
    profile.tiktok ||
    profile.github
  );
  if (!hasContact && !hasSocial) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", align === "start" ? "justify-start" : "justify-center")}>
      <ContactRoundPills profile={profile} accent={accent} dark={dark} inline />
      <SocialPills profile={profile} accent={accent} dark={dark} inline />
    </div>
  );
}

export function LinkList({
  links,
  accent,
  variant = "minimal",
  dark,
}: {
  links: ProfileLink[];
  accent: string;
  variant?: "minimal" | "premium" | "corporate";
  dark?: boolean;
}) {
  const items = customLinksOnly(links);
  if (!items.length) return null;
  return (
    <div className="flex w-full flex-col gap-2">
      {items.map((l) => {
        const Meta = SOCIALS[l.kind] || SOCIALS.OTHER;
        const Icon = Meta.icon;
        const isPremium = variant === "premium";
        const isCorp = variant === "corporate";
        const cls = isPremium
          ? dark
            ? "group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
            : "group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-soft transition hover:shadow-pop"
          : isCorp
            ? "group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-foreground/30"
            : "group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-soft transition hover:shadow-pop";

        return (
          <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className={cls}>
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{
                background: isPremium && dark ? "rgba(255,255,255,0.12)" : rgba(accent, 0.1),
                color: isPremium && dark ? "#fff" : Meta.color,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate">{l.label}</span>
            <ExternalLink className="h-4 w-4 opacity-40 transition-opacity group-hover:opacity-80" />
          </a>
        );
      })}
    </div>
  );
}

export function MapEmbed({ profile, accent, dark }: { profile: ProfileView; accent: string; dark?: boolean }) {
  if (!profile.location) return null;
  const q = encodeURIComponent(profile.location);
  const src = `https://www.google.com/maps?q=${q}&output=embed`;
  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : rgba(accent, 0.18) }}
    >
      <iframe
        src={src}
        loading="lazy"
        title="Ubicación"
        className="h-44 w-full"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={`https://www.google.com/maps?q=${q}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium"
        style={{ color: dark ? "#fff" : accent }}
      >
        <MapPin className="h-3.5 w-3.5" />
        {profile.location}
      </a>
    </div>
  );
}

/** @deprecated use SaveContactButton + ContactRoundPills */
export function ContactActions({
  profile,
  accent,
  variant = "premium",
}: {
  profile: ProfileView;
  accent: string;
  variant?: "minimal" | "premium" | "corporate";
}) {
  const dark = variant === "premium";
  return (
    <div className="flex w-full flex-col gap-3">
      <SaveContactButton profile={profile} accent={accent} dark={dark} />
      <ContactRoundPills profile={profile} accent={accent} dark={dark} />
    </div>
  );
}
