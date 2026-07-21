import type { ProfileLink, ProfileView, Template, ThemeMode } from "@/lib/profile-types";

type DemoPersona = {
  slug: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
  description: string;
  primaryColor: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
};

export const DEMO_PERSONAS: Record<Template, DemoPersona> = {
  MINIMAL: {
    slug: "luna-ortiz",
    fullName: "Luna Ortiz",
    jobTitle: "UX Designer",
    companyName: "Independiente",
    description: "Diseño experiencias digitales claras, humanas y memorables.",
    primaryColor: "#0F172A",
    instagram: "@lunaortiz",
    linkedin: "linkedin.com/in/lunaortiz",
  },
  PREMIUM: {
    slug: "mateo-vargas",
    fullName: "Mateo Vargas",
    jobTitle: "CEO & Founder",
    companyName: "Arcline Studio",
    description: "Construyo marcas que se sienten premium desde el primer contacto.",
    primaryColor: "#A855F7",
    instagram: "@arcline",
    linkedin: "linkedin.com/in/mateovargas",
  },
  CORPORATE: {
    slug: "elena-morales",
    fullName: "Elena Morales",
    jobTitle: "Directora Comercial",
    companyName: "Meridian Capital",
    description: "Estrategia, relaciones y crecimiento sostenible para equipos B2B.",
    primaryColor: "#1E3A8A",
    linkedin: "linkedin.com/in/elenamorales",
  },
  NOIR: {
    slug: "valentina-cruz",
    fullName: "Valentina Cruz",
    jobTitle: "Fotógrafa editorial",
    companyName: "Cruz Atelier",
    description: "Retratos, moda y narrativa visual con luz y contraste.",
    primaryColor: "#C9A227",
    instagram: "@cruzatelier",
  },
  BLOOM: {
    slug: "camila-duarte",
    fullName: "Camila Duarte",
    jobTitle: "Coach de bienestar",
    companyName: "Alma Vital",
    description: "Acompaño procesos de equilibrio, hábitos y autoconocimiento.",
    primaryColor: "#DB2777",
    instagram: "@almavital",
  },
  STUDIO: {
    slug: "tomas-riva",
    fullName: "Tomás Riva",
    jobTitle: "Director creativo",
    companyName: "Riva & Co.",
    description: "Branding, campañas y dirección de arte para marcas con carácter.",
    primaryColor: "#DC2626",
    instagram: "@rivaco",
    linkedin: "linkedin.com/in/tomasriva",
  },
  NOVA: {
    slug: "ignacio-ferreyra",
    fullName: "Ignacio Ferreyra",
    jobTitle: "CTO",
    companyName: "Orbit Labs",
    description: "Producto, infraestructura y equipos que escalan sin fricción.",
    primaryColor: "#06B6D4",
    linkedin: "linkedin.com/in/ignacioferreyra",
    instagram: "@orbitlabs",
  },
  VIVID: {
    slug: "zoe-nakamura",
    fullName: "Zoe Nakamura",
    jobTitle: "Creadora & DJ",
    companyName: "Neon Pulse",
    description: "Música, contenido y comunidad. Siempre en movimiento.",
    primaryColor: "#F97316",
    instagram: "@neonpulse",
    tiktok: "@zoe.nakamura",
  },
};

const BASE_CONTACT = {
  email: "hola@demo.cards",
  phone: "+5491122334455",
  whatsapp: "+5491122334455",
  website: "https://demo.cards",
  location: "Córdoba, Argentina",
};

export const DEMO_LINKS: ProfileLink[] = [
  { id: "d1", kind: "WEBSITE", label: "Portfolio", url: "https://demo.cards", order: 0 },
  { id: "d2", kind: "INSTAGRAM", label: "Instagram", url: "https://instagram.com", order: 1 },
  { id: "d3", kind: "LINKEDIN", label: "LinkedIn", url: "https://linkedin.com", order: 2 },
  { id: "d4", kind: "CALENDAR", label: "Agendar", url: "https://cal.com", order: 3 },
];

/** Hero / login default persona */
export function heroDemoProfile(themeMode: ThemeMode = "DARK") {
  return demoProfileFor("PREMIUM", themeMode);
}

export function demoProfileFor(template: Template, themeMode: ThemeMode = "LIGHT"): ProfileView {
  const p = DEMO_PERSONAS[template];
  return {
    id: `demo-${template.toLowerCase()}`,
    slug: p.slug,
    active: true,
    fullName: p.fullName,
    jobTitle: p.jobTitle,
    companyName: p.companyName,
    description: p.description,
    ...BASE_CONTACT,
    instagram: p.instagram ?? null,
    linkedin: p.linkedin ?? null,
    twitter: null,
    tiktok: p.tiktok ?? null,
    template,
    primaryColor: p.primaryColor,
    themeMode,
    avatarUrl: null,
    coverUrl: null,
    alias: null,
    showSaveContact: true,
  };
}
