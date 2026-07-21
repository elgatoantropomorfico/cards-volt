import type { Link as DbLink, Profile as DbProfile } from "@prisma/client";
import type { ProfileLink, ProfileView } from "@/lib/profile-types";

export function profileToView(p: DbProfile): ProfileView {
  return {
    id: p.id,
    slug: p.slug,
    active: p.active,
    fullName: p.fullName,
    jobTitle: p.jobTitle,
    companyName: p.companyName,
    description: p.description,
    email: p.email,
    phone: p.phone,
    whatsapp: p.whatsapp,
    website: p.website,
    avatarUrl: p.avatarUrl,
    coverUrl: p.coverUrl,
    location: p.location,
    locationLat: p.locationLat,
    locationLng: p.locationLng,
    instagram: p.instagram,
    linkedin: p.linkedin,
    twitter: p.twitter,
    facebook: p.facebook,
    youtube: p.youtube,
    tiktok: p.tiktok,
    github: p.github,
    alias: p.alias,
    showSaveContact: p.showSaveContact,
    template: p.template,
    primaryColor: p.primaryColor,
    themeMode: p.themeMode,
  };
}

export function linksToView(rows: DbLink[]): ProfileLink[] {
  return rows.map((l) => ({
    id: l.id,
    kind: l.kind,
    label: l.label,
    url: l.url,
    icon: l.icon,
    order: l.order,
  }));
}
