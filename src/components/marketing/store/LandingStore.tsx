"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartProvider } from "./CartContext";
import { FloatingCartIsland } from "./FloatingCartIsland";
import { HeroCards3D } from "./HeroCards3D";
import { IncludedSection } from "./IncludedSection";
import { LandingHeader } from "./LandingHeader";
import { ProductSection } from "./ProductSection";
import { SocialMediaSection } from "./SocialMediaSection";
import { ArrowRight, Nfc, Sparkles } from "lucide-react";

export function LandingStore() {
  return (
    <CartProvider>
      <div className="relative min-h-screen overflow-hidden bg-background pb-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(black,transparent)]">
          <div className="absolute inset-0 bg-grid-fade bg-[size:40px_40px] opacity-40" />
        </div>

        <LandingHeader />

        <main className="relative z-10">
          <section className="container grid items-center gap-8 pb-16 pt-10 md:grid-cols-2 md:gap-10 md:pb-24 md:pt-14">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
                  <Nfc className="h-2.5 w-2.5" />
                </span>
                Tarjetas NFC + QR · Suscripción anual
              </div>

              <h1 className="font-display mt-6 text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl md:text-[3.25rem] md:leading-[1.05]">
                Tu tarjeta física.{" "}
                <span className="bg-[linear-gradient(120deg,#7c3aed,#ec4899,#f59e0b)] bg-clip-text text-transparent">
                  Tu perfil digital.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-pretty text-[16px] leading-relaxed text-muted-foreground">
                Blanca o negra, con NFC y QR integrados. Incluye Volt Cards Social Media: editá tu link-in-bio
                profesional desde el panel. Pagás anual, recibís la tarjeta y coordinamos por WhatsApp.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#tarjetas">
                  <Button variant="gradient" size="lg" className="h-12 px-7">
                    Ver tarjetas <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                  Desde $18.000/mes · plan anual
                </span>
                <span>NFC + QR incluidos</span>
                <span>Social Media incluido</span>
              </div>
            </div>

            <div className="order-1 flex items-center justify-center md:order-2">
              <HeroCards3D />
            </div>
          </section>

          <div className="container space-y-20 pb-16 md:space-y-28">
            <ProductSection />
            <IncludedSection />
            <SocialMediaSection />

            <section className="scroll-mt-20">
              <div className="rounded-3xl border bg-card/70 p-8 backdrop-blur md:p-10">
                <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                  Cómo comprar en 3 pasos
                </h2>
                <ol className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    { step: "1", title: "Elegí modelo y cantidad", desc: "Tarjeta blanca o negra. Sumá las que necesites al carrito." },
                    { step: "2", title: "Revisá el total anual", desc: "La isla flotante muestra el monto antes de enviar." },
                    { step: "3", title: "WhatsApp y listo", desc: "Coordinamos pago, personalización y envío de tu tarjeta." },
                  ].map((item) => (
                    <li key={item.step} className="rounded-2xl border bg-background/60 p-5">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                        {item.step}
                      </span>
                      <h3 className="font-display mt-3 font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>
        </main>

        <footer className="relative z-10 border-t bg-card/40 backdrop-blur">
          <div className="container flex flex-col items-center justify-between gap-4 py-8 text-xs text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} Volt Cards · voltaiagents.com</span>
            <div className="flex gap-4">
              <Link href="/login" className="hover:text-foreground">
                Acceder al panel
              </Link>
              <a href="#tarjetas" className="hover:text-foreground">
                Comprar tarjetas
              </a>
            </div>
          </div>
        </footer>

        <FloatingCartIsland />
      </div>
    </CartProvider>
  );
}
