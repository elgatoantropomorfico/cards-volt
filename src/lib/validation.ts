import { z } from "zod";
import { normalizeOptionalHttpUrl, normalizeWebsite } from "./socials";

const ZOD_MSG: Record<string, string> = {
  "Invalid url": "URL inválida",
  "Invalid email": "Email inválido",
  "Invalid input": "Valor inválido",
};

export function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  const field = issue.path.length ? String(issue.path[issue.path.length - 1]) : "campo";
  const label = FIELD_LABELS[field] ?? field;
  const msg = ZOD_MSG[issue.message] ?? issue.message;
  return `${label}: ${msg}`;
}

const FIELD_LABELS: Record<string, string> = {
  website: "Sitio web",
  email: "Email",
  avatarUrl: "Avatar",
  coverUrl: "Portada",
  slug: "Slug",
  fullName: "Nombre",
  url: "URL",
  label: "Etiqueta",
};

/** Empty string → null; domain or https URL → normalized https URL. */
export const optionalWebsite = z
  .union([z.literal(""), z.null(), z.undefined(), z.string()])
  .transform((v) => {
    if (v === "" || v == null) return null;
    return normalizeWebsite(String(v));
  })
  .pipe(z.union([z.null(), z.string().url({ message: "URL inválida" })]));

export const optionalHttpUrl = z
  .union([z.literal(""), z.null(), z.undefined(), z.string()])
  .transform((v) => {
    if (v === "" || v == null) return null;
    return normalizeOptionalHttpUrl(String(v));
  })
  .pipe(z.union([z.null(), z.string().url({ message: "URL inválida" })]));

export const optionalEmail = z
  .union([z.literal(""), z.null(), z.undefined(), z.string()])
  .transform((v) => (v === "" || v == null ? null : String(v).trim()))
  .pipe(z.union([z.null(), z.string().email({ message: "Email inválido" })]));
