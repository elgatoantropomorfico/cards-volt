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
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
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
          <div className="relative flex items-center gap-1.5 rounded-full bg-secondary/60 px-2.5 py-1.5 text-sm">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <span
              className={cn(
                "grid min-w-[1.25rem] place-items-center rounded-full px-1 text-[10px] font-bold",
                count > 0 ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {count}
            </span>
          </div>
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
