import type { Template } from "@/lib/profile-types";
import {
  Sparkles,
  LayoutPanelTop,
  Building2,
  Moon,
  Flower2,
  PenTool,
  Cpu,
  Zap,
} from "lucide-react";
import type React from "react";

export type TemplateMeta = {
  id: Template;
  name: string;
  tagline: string;
  niche: string;
  icon: React.ReactNode;
  defaultColor: string;
  previewFrom: string;
  previewTo: string;
  previewPill: string;
  dark?: boolean;
};

export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    id: "MINIMAL",
    name: "Minimal",
    tagline: "Outlined · Linktree refinado",
    niche: "Freelancers · general",
    icon: <Sparkles className="h-4 w-4" />,
    defaultColor: "#0F172A",
    previewFrom: "#fafafa",
    previewTo: "#fafafa",
    previewPill: "#0F172A",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    tagline: "HiHello · arco curvo dramático",
    niche: "Founders · ejecutivos",
    icon: <LayoutPanelTop className="h-4 w-4" />,
    defaultColor: "#A855F7",
    previewFrom: "#070710",
    previewTo: "#1a0e3a",
    previewPill: "#A855F7",
    dark: true,
  },
  {
    id: "CORPORATE",
    name: "Corporate",
    tagline: "Ejecutivo · sobrio y confiable",
    niche: "Empresas · B2B",
    icon: <Building2 className="h-4 w-4" />,
    defaultColor: "#1E3A8A",
    previewFrom: "#ffffff",
    previewTo: "#f1f5f9",
    previewPill: "#1E3A8A",
  },
  {
    id: "NOIR",
    name: "Noir",
    tagline: "Lujo oscuro · líneas finas",
    niche: "Fotógrafos · moda · premium",
    icon: <Moon className="h-4 w-4" />,
    defaultColor: "#C9A227",
    previewFrom: "#0a0a0a",
    previewTo: "#171717",
    previewPill: "#C9A227",
    dark: true,
  },
  {
    id: "BLOOM",
    name: "Bloom",
    tagline: "Cálido · orgánico · suave",
    niche: "Wellness · belleza · coaches",
    icon: <Flower2 className="h-4 w-4" />,
    defaultColor: "#DB2777",
    previewFrom: "#FFF5EB",
    previewTo: "#FFE8F0",
    previewPill: "#DB2777",
  },
  {
    id: "STUDIO",
    name: "Studio",
    tagline: "Editorial · tipografía bold",
    niche: "Agencias · diseño · arte",
    icon: <PenTool className="h-4 w-4" />,
    defaultColor: "#DC2626",
    previewFrom: "#ffffff",
    previewTo: "#f5f5f5",
    previewPill: "#DC2626",
  },
  {
    id: "NOVA",
    name: "Nova",
    tagline: "Glass · tech · futurista",
    niche: "Startups · SaaS · devs",
    icon: <Cpu className="h-4 w-4" />,
    defaultColor: "#06B6D4",
    previewFrom: "#0B1020",
    previewTo: "#111827",
    previewPill: "#06B6D4",
    dark: true,
  },
  {
    id: "VIVID",
    name: "Vivid",
    tagline: "Gradiente · energía · creators",
    niche: "Influencers · música · eventos",
    icon: <Zap className="h-4 w-4" />,
    defaultColor: "#F97316",
    previewFrom: "#7C3AED",
    previewTo: "#EC4899",
    previewPill: "#F97316",
    dark: true,
  },
];

export const TEMPLATE_IDS = TEMPLATE_CATALOG.map((t) => t.id);

export function templateMeta(id: Template) {
  return TEMPLATE_CATALOG.find((t) => t.id === id) ?? TEMPLATE_CATALOG[0];
}
