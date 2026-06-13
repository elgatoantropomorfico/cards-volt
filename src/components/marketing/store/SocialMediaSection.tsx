import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingPhoneMock } from "@/components/marketing/MarketingPhoneMock";
import { TemplatesShowcase } from "@/components/marketing/TemplatesShowcase";
import {
  ArrowRight,
  Building2,
  Globe,
  Palette,
  QrCode,
  ShieldCheck,
  Zap,
} from "lucide-react";

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <h3 className="font-display mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

export function SocialMediaSection() {
  return (
    <section id="social" className="scroll-mt-20 space-y-16">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
            Volt Cards Social Media
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Tu link-in-bio profesional, incluido en el plan
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Cada tarjeta apunta a tu perfil en cards.voltaiagents.com. Editá foto, bio, links, mapa, redes y
            plantilla desde el panel — con preview en vivo. Es la plataforma que ya usás para gestionar tu presencia
            digital.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Acceder al panel <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#templates">
              <Button variant="ghost" size="sm">
                Ver plantillas
              </Button>
            </a>
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Incluido en suscripción anual · Sin costo extra de plataforma
          </p>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-60 blur-2xl" />
          <MarketingPhoneMock template="PREMIUM" themeMode="DARK" className="scale-[0.92] sm:scale-100" />
        </div>
      </div>

      <div>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Ocho plantillas · dos modos
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Probá modo claro y oscuro en cada diseño — incluidos en tu suscripción.
          </p>
        </div>
        <div id="templates" className="scroll-mt-24 overflow-hidden">
          <TemplatesShowcase />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Feature icon={<Palette />} title="8 plantillas × 2 modos" desc="Minimal, Premium, Corporate y cinco diseños para nichos." />
        <Feature icon={<Zap />} title="Editor en vivo" desc="Cambiá perfil, color y plantilla sin reimprimir la tarjeta." />
        <Feature icon={<QrCode />} title="QR descargable" desc="PNG y SVG para materiales gráficos adicionales." />
        <Feature icon={<Building2 />} title="Panel admin" desc="Equipos y tarjetas NFC gestionadas desde un solo lugar." />
        <Feature icon={<Globe />} title="vCard universal" desc="Compatible con Apple Contacts, Google y más." />
        <Feature icon={<ShieldCheck />} title="Perfil propio" desc="URL cards.voltaiagents.com/tu-nombre" />
      </div>
    </section>
  );
}
