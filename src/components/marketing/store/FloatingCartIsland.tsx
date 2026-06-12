"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import {
  buildWhatsAppCheckoutUrl,
  cartLines,
  cartTotal,
  formatArs,
  whatsAppNumber,
} from "@/lib/store-products";
import { ChevronDown, MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export function FloatingCartIsland() {
  const { count, items, increment, decrement } = useCart();
  const [expanded, setExpanded] = React.useState(false);
  const lines = cartLines(items);
  const total = cartTotal(items);
  const waUrl = buildWhatsAppCheckoutUrl(items);

  function handleCheckout() {
    if (!waUrl) {
      toast({ title: "Carrito vacío", description: "Agregá al menos una tarjeta.", variant: "error" });
      return;
    }
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
        >
          <div
            className={cn(
              "pointer-events-auto w-full max-w-md overflow-hidden rounded-[28px] bg-foreground/95 text-background shadow-[0_20px_60px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl",
            )}
          >
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/10">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-white/55">
                  {count} tarjeta{count !== 1 ? "s" : ""} · plan anual
                </p>
                <p className="font-display truncate text-lg font-semibold tabular-nums">{formatArs(total)}</p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-white/50 transition-transform", expanded && "rotate-180")}
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden border-t border-white/10"
                >
                  <div className="space-y-2 px-4 py-3">
                    {lines.map((line) => (
                      <div key={line.productId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-white/70">{line.product.shortName}</span>
                        <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
                          <button
                            type="button"
                            onClick={() => decrement(line.productId)}
                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10"
                            aria-label={`Menos ${line.product.shortName}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => increment(line.productId)}
                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10"
                            aria-label={`Más ${line.product.shortName}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="border-t border-white/10 p-3 pt-2">
              <Button
                size="lg"
                className="h-11 w-full rounded-2xl border-0 bg-[linear-gradient(120deg,#22c55e_0%,#16a34a_100%)] text-white shadow-none hover:brightness-110"
                disabled={!whatsAppNumber()}
                onClick={handleCheckout}
              >
                <MessageCircle className="h-4 w-4" />
                Comprar por WhatsApp
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
