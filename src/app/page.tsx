import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Sparkles, Building2, QrCode, Zap, Palette } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl">
        <div
          className="relative left-1/2 aspect-[1155/678] w-[72rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-400 via-fuchsia-400 to-amber-300 opacity-25"
          style={{ clipPath: "polygon(74% 44%, 100% 61%, 97% 26%, 85% 0%, 80% 2%, 72% 32%, 60% 62%, 52% 68%, 47% 58%, 45% 34%, 27% 76%, 0 64%, 17% 100%, 27% 76%, 76% 97%, 74% 44%)" }}
        />
      </div>

      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white shadow-sm">V</span>
          Volt Cards
        </Link>
        <Link href="/login">
          <Button variant="ghost" size="sm">Iniciar sesión</Button>
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="pt-16 pb-24 text-center md:pt-24 md:pb-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3" /> Tarjetas NFC profesionales
          </div>
          <h1 className="mt-8 text-balance text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
            Tu presentación profesional,
            <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">
              en un solo toque.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-slate-600">
            Compartí contacto, redes y links con una tarjeta NFC. Editá tu perfil en tiempo real,
            sin reimprimir nada.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="h-12 px-6 text-base shadow-lg shadow-slate-900/10">
                Acceder a mi cuenta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://github.com/elgatoantropomorfico/cards-volt" target="_blank" rel="noopener">
              <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                Ver en GitHub
              </Button>
            </a>
          </div>

          {/* Phone mockup preview */}
          <div className="relative mx-auto mt-20 max-w-sm">
            <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-tr from-indigo-200 via-fuchsia-200 to-amber-100 opacity-40 blur-2xl" />
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
              <div className="overflow-hidden rounded-[2rem] bg-slate-50 p-6">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 ring-4 ring-white" />
                <p className="mt-4 text-base font-semibold text-slate-900">Nacho Pérez</p>
                <p className="text-xs text-slate-500">CEO · Volt AI Agents</p>
                <div className="mt-6 grid grid-cols-2 gap-2 text-left">
                  {["Guardar contacto", "WhatsApp", "Llamar", "Email"].map((l, i) => (
                    <div
                      key={l}
                      className={`rounded-xl py-2 text-center text-xs font-medium ${
                        i === 0 ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
                      }`}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {["LinkedIn", "Portfolio", "Instagram"].map((l) => (
                    <div key={l} className="rounded-lg bg-white py-2 text-center text-xs font-medium text-slate-700 ring-1 ring-slate-200">{l}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-24 md:grid-cols-3">
          <Feature icon={<Smartphone />} title="NFC + QR">
            Una tarjeta para todos los dispositivos. iPhone, Android, lectores QR.
          </Feature>
          <Feature icon={<Palette />} title="3 plantillas">
            Minimal, Premium y Corporate. Cambialas cuando quieras desde tu panel.
          </Feature>
          <Feature icon={<Building2 />} title="Para equipos">
            Empresas con múltiples empleados y administración centralizada.
          </Feature>
          <Feature icon={<QrCode />} title="QR descargable">
            PNG y SVG listos para imprimir, signs, materiales gráficos.
          </Feature>
          <Feature icon={<Zap />} title="Edición en vivo">
            Tu tarjeta NFC nunca cambia. Lo que cambia es tu perfil, al instante.
          </Feature>
          <Feature icon={<Sparkles />} title="vCard universal">
            Guardado de contacto compatible con Apple Contacts y Google Contacts.
          </Feature>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Volt Cards · voltaiagents.com
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}
