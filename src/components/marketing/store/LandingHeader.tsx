"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

const NAV = [
  { href: "#tarjetas", label: "Tarjetas" },
  { href: "#social", label: "Social Media" },
  { href: "#checkout", label: "Checkout" },
];

export function LandingHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/75 backdrop-blur-xl">
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
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-foreground">
              {item.label}
            </a>
          ))}
          <Link href="/login" className="transition hover:text-foreground">
            Acceder
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <a href="#checkout" className="relative">
            <Button variant="outline" size="sm" className="gap-1.5 pr-3">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
              <span
                className={cn(
                  "grid min-w-[1.25rem] place-items-center rounded-full px-1 text-[10px] font-bold",
                  count > 0 ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                )}
              >
                {count}
              </span>
            </Button>
          </a>
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
