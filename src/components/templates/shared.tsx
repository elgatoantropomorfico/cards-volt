"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Mail, MessageCircle, Phone, MapPin, ExternalLink } from "lucide-react";
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

export function ContactActions({
  profile,
  accent,
  variant = "premium",
}: {
  profile: ProfileView;
  accent: string;
  variant?: "minimal" | "premium" | "corporate";
}) {
  type Btn = { href: string; label: string; icon: React.ReactNode; download?: boolean; primary?: boolean };
  const buttons: Btn[] = [];

  buttons.push({
    href: `/${profile.slug}/vcard`,
    label: "Guardar contacto",
    icon: <Download className="h-4 w-4" />,
    download: true,
    primary: true,
  });

  if (profile.whatsapp) {
    buttons.push({ href: `https://wa.me/${digits(profile.whatsapp)}`, label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> });
  }
  if (profile.phone) {
    buttons.push({ href: `tel:${digits(profile.phone)}`, label: "Llamar", icon: <Phone className="h-4 w-4" /> });
  }
  if (profile.email) {
    buttons.push({ href: `mailto:${profile.email}`, label: "Email", icon: <Mail className="h-4 w-4" /> });
  }

  const isMinimal = variant === "minimal";
  const isCorp = variant === "corporate";

  return (
    <div className={isCorp ? "flex flex-col gap-2" : "grid w-full grid-cols-1 gap-2 sm:grid-cols-2"}>
      {buttons.map((b, i) => {
        const isPrimary = !!b.primary;
        const style: React.CSSProperties = isPrimary
          ? { background: accent, color: readableOn(accent) === "dark" ? "#0F172A" : "#fff" }
          : isMinimal
            ? {
                background: "transparent",
                color: "currentColor",
                border: `1px solid ${rgba(accent, 0.25)}`,
              }
            : {
                background: rgba(accent, 0.12),
                color: "currentColor",
                border: `1px solid ${rgba(accent, 0.25)}`,
              };

        return (
          <Link
            key={i}
            href={b.href}
            target={b.href.startsWith("http") ? "_blank" : undefined}
            {...(b.download ? { rel: "noopener" } : {})}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-medium shadow-soft transition-transform active:scale-[0.98]"
            style={style}
          >
            {b.icon}
            <span className="truncate">{b.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function SocialPills({ profile, accent, dark }: { profile: ProfileView; accent: string; dark?: boolean }) {
  const items: { kind: keyof typeof SOCIALS; url: string }[] = [];
  if (profile.instagram) items.push({ kind: "INSTAGRAM", url: SOCIALS.INSTAGRAM.buildUrl!(profile.instagram) });
  if (profile.linkedin) items.push({ kind: "LINKEDIN", url: ensureUrl(profile.linkedin) });
  if (profile.twitter) items.push({ kind: "TWITTER", url: SOCIALS.TWITTER.buildUrl!(profile.twitter) });
  if (profile.facebook) items.push({ kind: "FACEBOOK", url: ensureUrl(profile.facebook) });
  if (profile.youtube) items.push({ kind: "YOUTUBE", url: ensureUrl(profile.youtube) });
  if (profile.tiktok) items.push({ kind: "TIKTOK", url: SOCIALS.TIKTOK.buildUrl!(profile.tiktok) });
  if (profile.github) items.push({ kind: "GITHUB", url: ensureUrl(profile.github) });

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map(({ kind, url }) => {
        const Meta = SOCIALS[kind];
        const Icon = Meta.icon;
        return (
          <a
            key={kind}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={Meta.label}
            className="grid h-10 w-10 place-items-center rounded-full border transition active:scale-95"
            style={{
              background: dark ? rgba("#ffffff", 0.06) : rgba(accent, 0.06),
              borderColor: dark ? rgba("#ffffff", 0.12) : rgba(accent, 0.18),
              color: dark ? "#fff" : Meta.color,
            }}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}

function ensureUrl(v: string) {
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function LinkList({
  links,
  accent,
  variant = "minimal",
}: {
  links: ProfileLink[];
  accent: string;
  variant?: "minimal" | "premium" | "corporate";
}) {
  if (!links.length) return null;
  return (
    <div className="flex w-full flex-col gap-2">
      {links.map((l) => {
        const Meta = SOCIALS[l.kind] || SOCIALS.OTHER;
        const Icon = Meta.icon;
        const cls =
          variant === "premium"
            ? "group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
            : variant === "corporate"
              ? "group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition hover:border-foreground/30"
              : "group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-soft transition hover:shadow-pop";

        return (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{
                background: variant === "premium" ? "rgba(255,255,255,0.12)" : rgba(accent, 0.1),
                color: variant === "premium" ? "#fff" : Meta.color,
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
  // Lightweight static-looking embed via Google Maps no-key (using their public embed)
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
