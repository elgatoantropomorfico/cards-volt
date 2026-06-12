"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import {
  ANNUAL_MONTHS,
  STORE_PRODUCTS,
  buildWhatsAppCheckoutMessage,
  buildWhatsAppCheckoutUrl,
  cartLines,
  cartTotal,
  formatArs,
  whatsAppNumber,
} from "@/lib/store-products";
import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "@/components/ui/toaster";

export function CheckoutSection() {
  const { items, increment, decrement } = useCart();
  const lines = cartLines(items);
  const total = cartTotal(items);
  const hasItems = lines.length > 0;
  const waUrl = buildWhatsAppCheckoutUrl(items);
  const phoneConfigured = whatsAppNumber().length >= 10;

  function handleCheckout() {
    if (!hasItems) {
      toast({ title: "Carrito vacío", description: "Agregá al menos una tarjeta.", variant: "error" });
      return;
    }
    if (!waUrl) {
      toast({
        title: "WhatsApp no configurado",
        description: "Contactá al administrador del sitio.",
        variant: "error",
      });
      return;
    }
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="checkout" className="scroll-mt-20">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Checkout</p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Confirmá tu pedido por WhatsApp
        </h2>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Revisá cantidades y total anual. Al continuar, enviamos el carrito completo por WhatsApp para coordinar pago y envío.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          {STORE_PRODUCTS.map((product) => {
            const qty = items.find((i) => i.productId === product.id)?.quantity ?? 0;
            const annualEach = product.monthlyPrice * ANNUAL_MONTHS;

            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-display font-semibold">{product.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatArs(product.monthlyPrice)}/mes · {formatArs(annualEach)} anual c/u
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-1 rounded-xl border bg-secondary/30 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => decrement(product.id)}
                      aria-label={`Menos ${product.shortName}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-display text-base font-semibold tabular-nums">{qty}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => increment(product.id)}
                      aria-label={`Más ${product.shortName}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Subtotal anual</p>
                    <p className="font-display text-lg font-semibold tabular-nums">
                      {formatArs(annualEach * qty)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {!hasItems ? (
            <p className="rounded-xl border border-dashed bg-secondary/20 px-4 py-6 text-center text-sm text-muted-foreground">
              Tu carrito está vacío.{" "}
              <a href="#tarjetas" className="font-medium text-foreground underline-offset-2 hover:underline">
                Elegí una tarjeta
              </a>
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-pop">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBag className="h-4 w-4" />
              Resumen del pedido
            </div>

            <div className="mt-4 space-y-3 border-b pb-4">
              {lines.length ? (
                lines.map((line) => (
                  <div key={line.productId} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {line.product.shortName} × {line.quantity}
                    </span>
                    <span className="font-medium tabular-nums">{formatArs(line.lineTotal)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin ítems</p>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total anual</p>
                <p className="font-display text-3xl font-semibold tabular-nums">{formatArs(total)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Facturación anual · 12 meses</p>
              </div>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="mt-6 w-full bg-[linear-gradient(120deg,#16a34a_0%,#22c55e_50%,#059669_100%)] hover:brightness-110"
              disabled={!hasItems || !phoneConfigured}
              onClick={handleCheckout}
            >
              <MessageCircle className="h-4 w-4" />
              Comprar por WhatsApp
            </Button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Se abre WhatsApp con el detalle del carrito precargado
            </p>

            {hasItems ? (
              <div className="mt-5 rounded-xl bg-secondary/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Vista previa del mensaje:</p>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-[10px]">
                  {buildWhatsAppCheckoutMessage(items)}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
