"use client";

import { Button } from "@/components/ui/button";
import { NfcCardVisual } from "./NfcCardVisual";
import { useCart, useCartQuantity } from "./CartContext";
import {
  STORE_PRODUCTS,
  annualUnitPrice,
  formatArs,
  type ProductId,
} from "@/lib/store-products";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

function ProductCard({ productId }: { productId: ProductId }) {
  const product = STORE_PRODUCTS.find((p) => p.id === productId)!;
  const qty = useCartQuantity(productId);
  const { increment, decrement, addOne } = useCart();
  const annual = annualUnitPrice(product.monthlyPrice);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop",
        product.variant === "black" && "border-neutral-800/20",
      )}
    >
      {product.badge ? (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-soft">
          {product.badge}
        </span>
      ) : null}

      <div
        className={cn(
          "flex items-center justify-center px-6 pb-2 pt-8",
          product.variant === "white" ? "bg-neutral-100/80" : "bg-neutral-950",
        )}
      >
        <NfcCardVisual variant={product.variant} className="w-[min(100%,260px)] transition duration-500 group-hover:scale-[1.02]" />
      </div>

      <div className="flex flex-1 flex-col p-6 pt-5">
        <h3 className="font-display text-xl font-semibold tracking-tight">{product.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-semibold">{formatArs(product.monthlyPrice)}</span>
          <span className="text-sm text-muted-foreground">/ mes</span>
        </div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Facturación anual · <span className="font-medium text-foreground">{formatArs(annual)}</span> por tarjeta
        </p>

        <ul className="mt-5 space-y-2">
          {product.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6">
          {qty === 0 ? (
            <Button variant="gradient" className="w-full" onClick={() => addOne(productId)}>
              <ShoppingCart className="h-4 w-4" /> Agregar al carrito
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/40 p-2">
              <Button variant="ghost" size="icon" onClick={() => decrement(productId)} aria-label="Quitar una">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-display text-lg font-semibold tabular-nums">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => increment(productId)} aria-label="Agregar una">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductSection() {
  return (
    <section id="tarjetas" className="scroll-mt-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">Catálogo</p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Elegí tu tarjeta física
        </h2>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Dos acabados premium. NFC y QR incluidos. Suscripción anual con acceso a Volt Cards Social Media.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {STORE_PRODUCTS.map((p) => (
          <ProductCard key={p.id} productId={p.id} />
        ))}
      </div>
    </section>
  );
}
