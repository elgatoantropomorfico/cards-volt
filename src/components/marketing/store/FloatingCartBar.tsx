"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import { cartTotal, formatArs } from "@/lib/store-products";
import { MessageCircle } from "lucide-react";

export function FloatingCartBar() {
  const { count, items } = useCart();
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 p-3 backdrop-blur-xl md:hidden">
      <div className="container flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">{count} tarjeta{count !== 1 ? "s" : ""}</p>
          <p className="font-display text-lg font-semibold tabular-nums">{formatArs(cartTotal(items))}</p>
        </div>
        <a href="#checkout" className="shrink-0">
          <Button variant="gradient" size="sm" className="gap-1.5">
            <MessageCircle className="h-4 w-4" />
            Checkout
          </Button>
        </a>
      </div>
    </div>
  );
}
