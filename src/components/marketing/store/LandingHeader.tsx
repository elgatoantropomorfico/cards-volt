"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

const NAV = [
  { href: "#tarjetas", label: "Tarjetas" },
  { href: "#social", label: "Social Media" },
];

export function LandingHeader() {
  const { count, setDrawerOpen } = useCart();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-foreground text-background shadow-soft">
            <span className="font-display text-base font-bold">V</span>
          </span>
          <div className="leading-tight">
            <span className="font-display text-sm font-semibold tracking-tight sm:text-base">Volt Cards</span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">NFC · QR · Social Media</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a key="#tarjetas" href="#tarjetas" className="transition hover:text-foreground">
            Tarjetas
          </a>
          <a key="#social" href="#social" className="transition hover:text-foreground">
            Social Media
          </a>
          <Link href="/login" className="transition hover:text-foreground">
            Acceder
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative flex items-center gap-1.5 rounded-full bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-sm transition"
            aria-label="Abrir carrito"
          >
            <ShoppingBag className="h-4 w-4 text-foreground" />
            <span
              className={cn(
                "grid min-w-[1.25rem] place-items-center rounded-full px-1 text-[11px] font-bold",
                count > 0 ? "bg-violet-600 text-white" : "text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
          <a href="#tarjetas" className="hidden sm:block">
            <Button variant="gradient" size="sm">
              Comprar
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
