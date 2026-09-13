"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ArrowRight, ShieldCheck, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import { cartLines, cartTotal, formatArs } from "@/lib/store-products";
import { ProductCardPreview } from "./ProductCardPreview";

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, items, prices, increment, decrement, setQuantity, clearCart } = useCart();
  const lines = cartLines(items, prices);
  const total = cartTotal(items, prices);

  // Close with Escape key
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    if (drawerOpen) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, setDrawerOpen]);

  return (
    <AnimatePresence>
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 35 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-background text-foreground shadow-2xl border-l"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display font-semibold text-lg leading-tight">Tu Carrito</h2>
                  <p className="text-xs text-muted-foreground">{lines.length} producto{lines.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary text-muted-foreground transition"
                aria-label="Cerrar carrito"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary/80 text-muted-foreground mb-4">
                    <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">Tu carrito está vacío</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    Elegí tu tarjeta física favorita en el catálogo para comenzar tu suscripción anual.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Ver tarjetas
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lines.map((line) => (
                    <div
                      key={line.productId}
                      className="flex gap-3 rounded-2xl border bg-card p-3.5 shadow-soft transition hover:border-foreground/20"
                    >
                      {/* Mini 3D Preview representation */}
                      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 grid place-items-center">
                        <div className="scale-[0.45]">
                          <ProductCardPreview variant={line.product.variant} />
                        </div>
                      </div>

                      {/* Info & Quantity */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-display font-semibold text-sm leading-tight">{line.product.name}</h4>
                            <button
                              type="button"
                              onClick={() => setQuantity(line.productId, 0)}
                              className="text-muted-foreground hover:text-rose-600 transition p-1"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Plan anual · NFC + QR</p>
                          <p className="text-xs font-semibold mt-1">
                            {formatArs(line.annualEach)}
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              ({formatArs(line.product.monthlyPrice)}/mes)
                            </span>
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center rounded-lg border bg-secondary/50 p-0.5">
                            <button
                              type="button"
                              onClick={() => decrement(line.productId)}
                              className="grid h-6 w-6 place-items-center rounded hover:bg-background transition text-muted-foreground"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold tabular-nums">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => increment(line.productId)}
                              className="grid h-6 w-6 place-items-center rounded hover:bg-background transition text-muted-foreground"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-display text-sm font-semibold tabular-nums">
                            {formatArs(line.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs text-muted-foreground hover:text-rose-600 transition"
                    >
                      Vaciar carrito
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout CTA */}
            {lines.length > 0 && (
              <div className="border-t bg-card/60 p-6 space-y-4 backdrop-blur">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium text-foreground">{formatArs(total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Envío a domicilio</span>
                    <span className="font-medium text-emerald-600">Bonificado</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t font-semibold text-base">
                    <span>Total anual</span>
                    <span className="font-display text-xl text-foreground tabular-nums">{formatArs(total)}</span>
                  </div>
                </div>

                <Link href="/checkout" onClick={() => setDrawerOpen(false)} className="block">
                  <Button variant="gradient" size="lg" className="w-full justify-between h-12 shadow-pop">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> Iniciar compra
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      {formatArs(total)} <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>

                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Pago 100% seguro con Mercado Pago</span>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
