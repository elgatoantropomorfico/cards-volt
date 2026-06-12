import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingPhoneMock } from "@/components/marketing/MarketingPhoneMock";
import { TemplatesShowcase } from "@/components/marketing/TemplatesShowcase";
import {
  ArrowRight,
  Smartphone,
  Sparkles,
  Building2,
  QrCode,
  Zap,
  Palette,
  Nfc,
  ShieldCheck,
  Globe,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] [mask-image:linear-gradient(black,transparent)]">
        <div className="absolute inset-0 bg-grid-fade bg-[size:40px_40px] opacity-40" />
      </div>

      {/* Top bar */}
      <header className="relative z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground text-background shadow-soft">
              <span className="font-display text-base font-bold">V</span>
            </span>
            <span className="font-display text-base font-semibold tracking-tight">Volt Cards</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">Cómo funciona</a>
            <a href="#templates" className="hover:text-foreground">Plantillas</a>
          </nav>
          <Link href="/login">
            <Button variant="gradient" size="sm">Acceder</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="container pt-12 pb-20 md:pt-24 md:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-foreground/90 text-background">
                <Sparkles className="h-2.5 w-2.5" />
              </span>
              Tu identidad profesional en NFC
            </div>

            <h1 className="font-display mt-7 text-balance text-5xl font-semibold tracking-[-0.02em] text-foreground sm:text-6xl md:text-7xl">
              Una tarjeta.{" "}
              <span className="bg-[linear-gradient(120deg,#7c3aed,#ec4899,#f59e0b)] bg-clip-text text-transparent">
                Mil maneras
              </span>{" "}
              de presentarte.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted-foreground">
              Volt Cards es la plataforma para crear, editar y compartir tu tarjeta digital con NFC. Ocho plantillas premium, editor en vivo, integraciones con redes y mapa.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <Button variant="gradient" size="lg" className="h-12 px-7 text-[15px]">
                  Comenzar gratis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#templates">
                <Button variant="outline" size="lg" className="h-12 px-6 text-[15px]">
                  Ver plantillas
                </Button>
              </a>
            </div>
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Sin tarjeta de crédito · Setup en 2 minutos
            </p>
          </div>

          {/* Hero phone — real ProfileRenderer preview */}
          <div className="relative mx-auto mt-16 flex max-w-5xl justify-center">
            <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-70 blur-2xl" />
            <MarketingPhoneMock template="PREMIUM" />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container pb-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Todo lo que necesitás. Nada superfluo.</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">Pensado para profesionales y equipos que quieren transmitir clase con un solo toque.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Feature icon={<Nfc />} title="NFC + QR" desc="Una tarjeta para todos los dispositivos. iPhone, Android y cualquier lector QR." />
            <Feature icon={<Palette />} title="8 plantillas" desc="Minimal, Premium, Corporate y cinco diseños para nichos: Noir, Bloom, Studio, Nova y Vivid." />
            <Feature icon={<Building2 />} title="Panel admin" desc="Creá usuarios, asigná tarjetas NFC y gestioná perfiles desde un solo lugar." />
            <Feature icon={<QrCode />} title="QR descargable" desc="PNG y SVG vectorial para imprimir, signs y materiales gráficos." />
            <Feature icon={<Zap />} title="Editor en vivo" desc="Cambiá perfil, color y plantilla. Tu tarjeta NFC nunca necesita reimpresión." />
            <Feature icon={<Globe />} title="vCard universal" desc="Compatible con Apple Contacts, Google Contacts y todos los gestores." />
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="container pb-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Ocho plantillas. Cada nicho, su estilo.</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">Desde ejecutivos hasta creators. Cambialas en vivo desde el editor.</p>
          </div>
          <TemplatesShowcase />
        </section>

        {/* How */}
        <section id="how" className="container pb-32">
          <div className="rounded-3xl border bg-card/70 p-8 backdrop-blur md:p-12">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Setup en 2 minutos.</h2>
                <p className="mt-3 text-muted-foreground">Creá tu cuenta, completá tu perfil y elegí plantilla. Asociá tu tarjeta NFC física al perfil y listo.</p>
                <ol className="mt-6 space-y-3 text-sm">
                  {["Creá tu cuenta y elegí slug", "Personalizá perfil, color, links", "Pegá tu tarjeta NFC al teléfono"].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">{i + 1}</span>
                      <span className="pt-0.5 text-foreground">{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-7">
                  <Link href="/login">
                    <Button variant="gradient" size="lg">Empezar ahora <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-mesh opacity-60 blur-2xl" />
                <div className="grid grid-cols-2 gap-3">
                  <Stat number="8" label="Plantillas premium" />
                  <Stat number="15+" label="Integraciones de redes" />
                  <Stat number="∞" label="Cambios en vivo" />
                  <Stat number="0" label="Datos en la tarjeta" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t bg-card/40 backdrop-blur">
        <div className="container py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Volt Cards · voltaiagents.com
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-soft [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <h3 className="font-display mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-5 shadow-soft backdrop-blur">
      <div className="font-display text-3xl font-semibold tracking-tight">{number}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
