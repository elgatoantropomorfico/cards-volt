import Link from "next/link";
import { Download, Mail, MessageCircle, Phone } from "lucide-react";
import type { Profile } from "@prisma/client";

function digits(s: string) {
  return s.replace(/[^\d+]/g, "");
}

export function ContactActions({ profile, accent }: { profile: Profile; accent: string }) {
  const buttons: Array<{ href: string; label: string; icon: React.ReactNode; download?: boolean }> = [];

  buttons.push({
    href: `/${profile.slug}/vcard`,
    label: "Guardar contacto",
    icon: <Download className="h-4 w-4" />,
    download: true,
  });

  if (profile.whatsapp) {
    buttons.push({
      href: `https://wa.me/${digits(profile.whatsapp)}`,
      label: "WhatsApp",
      icon: <MessageCircle className="h-4 w-4" />,
    });
  }
  if (profile.phone) {
    buttons.push({
      href: `tel:${digits(profile.phone)}`,
      label: "Llamar",
      icon: <Phone className="h-4 w-4" />,
    });
  }
  if (profile.email) {
    buttons.push({
      href: `mailto:${profile.email}`,
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
    });
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      {buttons.map((b, i) => (
        <Link
          key={i}
          href={b.href}
          target={b.href.startsWith("http") ? "_blank" : undefined}
          {...(b.download ? { rel: "noopener" } : {})}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl font-medium text-white shadow-sm transition active:scale-[0.99]"
          style={{ background: i === 0 ? accent : "#0F172A" }}
        >
          {b.icon}
          {b.label}
        </Link>
      ))}
    </div>
  );
}
