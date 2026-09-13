"use client";

import * as React from "react";
import {
  type CartLine,
  type ProductId,
  type PriceMap,
  cartItemCount,
  emptyCart,
} from "@/lib/store-products";

type CartContextValue = {
  items: CartLine[];
  count: number;
  prices: PriceMap;
  pricesReady: boolean;
  hydratePrices: (prices: PriceMap) => void;
  setQuantity: (productId: ProductId, quantity: number) => void;
  increment: (productId: ProductId) => void;
  decrement: (productId: ProductId) => void;
  addOne: (productId: ProductId) => void;
  clearCart: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

const STORAGE_KEY = "voltcards_cart_v1";

export function CartProvider({
  children,
  initialPrices = {},
}: {
  children: React.ReactNode;
  initialPrices?: PriceMap;
}) {
  const [items, setItems] = React.useState<CartLine[]>(emptyCart);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [prices, setPrices] = React.useState<PriceMap>(initialPrices);
  const [pricesReady, setPricesReady] = React.useState(
    Object.keys(initialPrices).length > 0,
  );

  // Keep SSR prices in sync when the server revalidates and remounts with new props
  React.useEffect(() => {
    if (initialPrices && Object.keys(initialPrices).length > 0) {
      setPrices(initialPrices);
      setPricesReady(true);
    }
  }, [initialPrices]);

  // Load cart from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartLine[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = emptyCart().map((p) => {
            const found = parsed.find((item) => item.productId === p.productId);
            return found ? { productId: p.productId, quantity: Math.max(0, found.quantity) } : p;
          });
          setItems(merged);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Client refresh of live catalog (no-store) — backup if SSR prices missing
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/store/catalog", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const map: PriceMap = {};
        for (const p of data.products || []) {
          if (p.slug === "white" || p.slug === "black") {
            map[p.slug as ProductId] = {
              monthlyPrice: Number(p.monthlyPrice),
              annualPrice: Number(p.price),
            };
          }
        }
        if (!cancelled && Object.keys(map).length > 0) {
          setPrices(map);
          setPricesReady(true);
        }
      } catch {
        // keep SSR / hardcoded fallback
      } finally {
        if (!cancelled) setPricesReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save cart to localStorage on update
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const hydratePrices = React.useCallback((next: PriceMap) => {
    if (next && Object.keys(next).length > 0) {
      setPrices(next);
      setPricesReady(true);
    }
  }, []);

  const setQuantity = React.useCallback((productId: ProductId, quantity: number) => {
    setItems((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: Math.max(0, Math.min(99, quantity)) } : line,
      ),
    );
  }, []);

  const increment = React.useCallback((productId: ProductId) => {
    setItems((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line,
      ),
    );
  }, []);

  const decrement = React.useCallback((productId: ProductId) => {
    setItems((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: Math.max(0, line.quantity - 1) } : line,
      ),
    );
  }, []);

  const addOne = React.useCallback((productId: ProductId) => {
    setItems((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    );
    setDrawerOpen(true);
  }, []);

  const clearCart = React.useCallback(() => {
    setItems(emptyCart());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const value = React.useMemo(
    () => ({
      items,
      count: cartItemCount(items),
      prices,
      pricesReady,
      hydratePrices,
      setQuantity,
      increment,
      decrement,
      addOne,
      clearCart,
      drawerOpen,
      setDrawerOpen,
    }),
    [
      items,
      prices,
      pricesReady,
      hydratePrices,
      setQuantity,
      increment,
      decrement,
      addOne,
      clearCart,
      drawerOpen,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useCartQuantity(productId: ProductId) {
  const { items } = useCart();
  return items.find((i) => i.productId === productId)?.quantity ?? 0;
}

/** Injects SSR catalog prices into the cart context as soon as the landing mounts. */
export function CatalogPriceBootstrap({ prices }: { prices: PriceMap }) {
  const { hydratePrices } = useCart();
  React.useLayoutEffect(() => {
    hydratePrices(prices);
  }, [prices, hydratePrices]);
  return null;
}
