"use client";

import * as React from "react";
import {
  type CartLine,
  type ProductId,
  cartItemCount,
  emptyCart,
  getProduct,
} from "@/lib/store-products";

type CartContextValue = {
  items: CartLine[];
  count: number;
  setQuantity: (productId: ProductId, quantity: number) => void;
  increment: (productId: ProductId) => void;
  decrement: (productId: ProductId) => void;
  addOne: (productId: ProductId) => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartLine[]>(emptyCart);

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
  }, []);

  const value = React.useMemo(
    () => ({
      items,
      count: cartItemCount(items),
      setQuantity,
      increment,
      decrement,
      addOne,
    }),
    [items, setQuantity, increment, decrement, addOne],
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

export function useProductMeta(productId: ProductId) {
  return getProduct(productId);
}
