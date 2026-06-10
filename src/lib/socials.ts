import type { LinkKind } from "./profile-types";
import {
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Github,
  Music,
  CalendarDays,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  FileText,
  LinkIcon,
  type LucideIcon,
} from "lucide-react";

// TikTok lucide isn't always present; use Music as fallback
export type SocialMeta = {
  label: string;
  icon: LucideIcon;
  color: string;
  placeholder: string;
  buildUrl?: (handle: string) => string;
  detectFromUrl?: RegExp;
};

export const SOCIALS: Record<LinkKind, SocialMeta> = {
  WEBSITE: { label: "Sitio web", icon: Globe, color: "#0F172A", placeholder: "https://misitio.com" },
  INSTAGRAM: {
    label: "Instagram",
    icon: Instagram,
    color: "#E1306C",
    placeholder: "@usuario o https://instagram.com/usuario",
    buildUrl: (h) => `https://instagram.com/${h.replace(/^@/, "")}`,
    detectFromUrl: /instagram\.com/i,
  },
  LINKEDIN: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    placeholder: "https://linkedin.com/in/usuario",
    detectFromUrl: /linkedin\.com/i,
  },
  TWITTER: {
    label: "X / Twitter",
    icon: Twitter,
    color: "#0F172A",
    placeholder: "@usuario o https://x.com/usuario",
    buildUrl: (h) => `https://x.com/${h.replace(/^@/, "")}`,
    detectFromUrl: /(twitter\.com|x\.com)/i,
  },
  FACEBOOK: {
    label: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    placeholder: "https://facebook.com/usuario",
    detectFromUrl: /facebook\.com/i,
  },
  YOUTUBE: {
    label: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    placeholder: "https://youtube.com/@canal",
    detectFromUrl: /youtu/i,
  },
  TIKTOK: {
    label: "TikTok",
    icon: Music,
    color: "#000000",
    placeholder: "@usuario o https://tiktok.com/@usuario",
    buildUrl: (h) => `https://tiktok.com/@${h.replace(/^@/, "")}`,
    detectFromUrl: /tiktok\.com/i,
  },
  GITHUB: {
    label: "GitHub",
    icon: Github,
    color: "#111827",
    placeholder: "https://github.com/usuario",
    detectFromUrl: /github\.com/i,
  },
  SPOTIFY: {
    label: "Spotify",
    icon: Music,
    color: "#1DB954",
    placeholder: "https://open.spotify.com/...",
    detectFromUrl: /spotify\.com/i,
  },
  CALENDAR: {
    label: "Agenda",
    icon: CalendarDays,
    color: "#7C3AED",
    placeholder: "https://cal.com/usuario",
    detectFromUrl: /(cal\.com|calendly\.com)/i,
  },
  EMAIL: { label: "Email", icon: Mail, color: "#0F172A", placeholder: "mailto:..." },
  PHONE: { label: "Teléfono", icon: Phone, color: "#0F172A", placeholder: "tel:+54..." },
  WHATSAPP: {
    label: "WhatsApp",
    icon: MessageCircle,
    color: "#25D366",
    placeholder: "https://wa.me/549...",
    detectFromUrl: /wa\.me|whatsapp\.com/i,
  },
  MAP: {
    label: "Ubicación",
    icon: MapPin,
    color: "#EA4335",
    placeholder: "Dirección o https://maps.google.com/...",
    detectFromUrl: /maps\.google|google\.com\/maps/i,
  },
  PDF: { label: "PDF", icon: FileText, color: "#DC2626", placeholder: "https://.../archivo.pdf" },
  OTHER: { label: "Enlace", icon: LinkIcon, color: "#475569", placeholder: "https://..." },
};

export function detectKind(url: string): LinkKind {
  for (const [k, meta] of Object.entries(SOCIALS) as [LinkKind, SocialMeta][]) {
    if (meta.detectFromUrl?.test(url)) return k;
  }
  if (/\.pdf($|\?)/i.test(url)) return "PDF";
  if (/^mailto:/i.test(url)) return "EMAIL";
  if (/^tel:/i.test(url)) return "PHONE";
  return "WEBSITE";
}

export function normalizeLinkUrl(kind: LinkKind, raw: string): string {
  const v = raw.trim();
  const meta = SOCIALS[kind];
  if (!v) return v;
  if (meta.buildUrl && !/^https?:\/\//i.test(v) && !v.startsWith("mailto:") && !v.startsWith("tel:")) {
    return meta.buildUrl(v);
  }
  if (kind === "EMAIL" && !/^mailto:/i.test(v)) return `mailto:${v}`;
  if (kind === "PHONE" && !/^tel:/i.test(v)) return `tel:${v.replace(/[^\d+]/g, "")}`;
  if (!/^https?:\/\//i.test(v) && !v.startsWith("mailto:") && !v.startsWith("tel:")) return `https://${v}`;
  return v;
}
