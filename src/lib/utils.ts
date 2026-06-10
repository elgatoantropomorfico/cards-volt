import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export const RESERVED_SLUGS = new Set([
  "admin", "api", "dashboard", "login", "logout", "signup", "signin",
  "company", "companies", "tenant", "tenants", "superadmin", "settings",
  "auth", "public", "static", "_next", "favicon.ico", "robots.txt",
  "sitemap.xml", "vcard", "qr", "card", "cards", "help", "support",
  "about", "terms", "privacy", "legal", "contact", "home",
]);

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 40) return false;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return true;
}

export function appUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
