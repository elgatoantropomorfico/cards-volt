import type { Profile } from "@prisma/client";

function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildVCard(p: Profile): string {
  const parts = (p.fullName || "").trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(p.fullName)}`,
  ];
  if (p.companyName) lines.push(`ORG:${esc(p.companyName)}`);
  if (p.jobTitle) lines.push(`TITLE:${esc(p.jobTitle)}`);
  if (p.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${esc(p.email)}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL,VOICE:${esc(p.phone)}`);
  if (p.whatsapp) lines.push(`TEL;TYPE=WORK,VOICE:${esc(p.whatsapp)}`);
  if (p.website) lines.push(`URL:${esc(p.website)}`);
  if (p.description) lines.push(`NOTE:${esc(p.description)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
