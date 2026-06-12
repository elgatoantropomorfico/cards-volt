import type { ProfileLink, ProfileView } from "@/lib/profile-types";

export const DEMO_PROFILE: ProfileView = {
  id: "demo",
  slug: "jose-martin",
  active: true,
  fullName: "José Martín",
  jobTitle: "Founder & Creative Director",
  companyName: "Volt AI Agents",
  description: "Ayudo a marcas a crecer con identidad digital memorable. Una tarjeta, mil conexiones.",
  email: "hola@voltaiagents.com",
  phone: "+5491112345678",
  whatsapp: "+5491112345678",
  website: "https://voltaiagents.com",
  location: "Buenos Aires, Argentina",
  instagram: "@voltaiagents",
  linkedin: "linkedin.com/in/voltai",
  twitter: "@voltaiagents",
  template: "PREMIUM",
  primaryColor: "#A855F7",
  themeMode: "DARK",
  avatarUrl: null,
  coverUrl: null,
};

export const DEMO_LINKS: ProfileLink[] = [
  { id: "d1", kind: "WEBSITE", label: "Sitio web", url: "https://voltaiagents.com", order: 0 },
  { id: "d2", kind: "INSTAGRAM", label: "Instagram", url: "https://instagram.com/voltaiagents", order: 1 },
  { id: "d3", kind: "LINKEDIN", label: "LinkedIn", url: "https://linkedin.com/in/voltai", order: 2 },
  { id: "d4", kind: "CALENDAR", label: "Agendar reunión", url: "https://cal.com", order: 3 },
];

export function demoProfileFor(template: ProfileView["template"]): ProfileView {
  const colors: Record<ProfileView["template"], string> = {
    MINIMAL: "#0F172A",
    PREMIUM: "#A855F7",
    CORPORATE: "#1E3A8A",
    NOIR: "#C9A227",
    BLOOM: "#DB2777",
    STUDIO: "#DC2626",
    NOVA: "#06B6D4",
    VIVID: "#F97316",
  };
  const themes: Partial<Record<ProfileView["template"], ProfileView["themeMode"]>> = {
    MINIMAL: "LIGHT",
    CORPORATE: "LIGHT",
    BLOOM: "LIGHT",
    STUDIO: "LIGHT",
    PREMIUM: "DARK",
    NOIR: "DARK",
    NOVA: "DARK",
    VIVID: "DARK",
  };
  return {
    ...DEMO_PROFILE,
    template,
    primaryColor: colors[template],
    themeMode: themes[template] ?? "DARK",
  };
}
