"use client";

import Link from "next/link";
import { CartProvider } from "./CartContext";
import { FloatingCartIsland } from "./FloatingCartIsland";
import { IncludedSection } from "./IncludedSection";
import { LandingBootProvider } from "./LandingBoot";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { ProductSection } from "./ProductSection";
import { SocialMediaSection } from "./SocialMediaSection";

export function LandingStore() {
  return (
    <CartProvider>
      <LandingBootProvider>
        <div className="relative min-h-screen overflow-x-clip bg-background pb-28">
          <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(black,transparent)]">
            <div className="absolute inset-0 bg-grid-fade bg-[size:40px_40px] opacity-40" />
          </div>

          <LandingHeader />

          <main className="relative z-10">
            <LandingHero fill />

            <div className="container space-y-20 pb-16 pt-4 md:space-y-28">
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
      </LandingBootProvider>
    </CartProvider>
  );
}
