import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Sparkles, Building2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">V</span>
          Volt Cards
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost">Iniciar sesión</Button></Link>
        </nav>
      </header>

      <main className="container mx-auto py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            <Sparkles className="h-3 w-3" /> Tarjetas NFC profesionales
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
            Tu presentación profesional,<br />
            <span className="bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent">
              en un solo toque.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Compartí tus datos de contacto, redes y links con una tarjeta NFC.
            Editá tu perfil en tiempo real, sin reimprimir nada.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg">
                Acceder a mi cuenta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          <Feature icon={<Smartphone />} title="NFC + QR">
            Una tarjeta para todos los dispositivos. iPhone, Android, lectores QR.
          </Feature>
          <Feature icon={<Sparkles />} title="3 plantillas">
            Minimal, Premium y Corporate. Cambialas cuando quieras.
          </Feature>
          <Feature icon={<Building2 />} title="Para equipos">
            Empresas con múltiples empleados y administración centralizada.
          </Feature>
        </div>
      </main>

      <footer className="container mx-auto border-t py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Volt Cards · voltaiagents.com
      </footer>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{children}</p>
    </div>
  );
}
