export type ProductId = "white" | "black";

export type StoreProduct = {
  id: ProductId;
  name: string;
  shortName: string;
  tagline: string;
  monthlyPrice: number;
  variant: "white" | "black";
  features: string[];
  badge?: string;
};

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "white",
    name: "Tarjeta Blanca",
    shortName: "Blanca",
    tagline: "Minimal · elegante · versátil",
    monthlyPrice: 18_000,
    variant: "white",
    badge: "Más elegida",
    features: ["NFC + QR incluidos", "Acabado mate premium", "Volt Cards Social Media"],
  },
  {
    id: "black",
    name: "Tarjeta Negra",
    shortName: "Negra",
    tagline: "Bold · premium · impacto",
    monthlyPrice: 22_000,
    variant: "black",
    features: ["NFC + QR incluidos", "Acabado satinado oscuro", "Volt Cards Social Media"],
  },
];

export const ANNUAL_MONTHS = 12;

export const SUBSCRIPTION_INCLUDES = [
  "Tarjeta física con chip NFC",
  "Código QR integrado en la tarjeta",
  "Volt Cards Social Media — perfil editable tipo link-in-bio",
  "8 plantillas con modo claro y oscuro",
  "Editor en vivo · vCard · mapa · redes",
];

export function getProduct(id: ProductId): StoreProduct {
  return STORE_PRODUCTS.find((p) => p.id === id)!;
}

export function annualUnitPrice(monthly: number): number {
  return monthly * ANNUAL_MONTHS;
}

export function formatArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type CartLine = {
  productId: ProductId;
  quantity: number;
};

export function cartLines(items: CartLine[]) {
  return items
    .filter((i) => i.quantity > 0)
    .map((item) => {
      const product = getProduct(item.productId);
      const annualEach = annualUnitPrice(product.monthlyPrice);
      return {
        ...item,
        product,
        annualEach,
        lineTotal: annualEach * item.quantity,
      };
    });
}

export function cartTotal(items: CartLine[]): number {
  return cartLines(items).reduce((sum, line) => sum + line.lineTotal, 0);
}

export function cartItemCount(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function emptyCart(): CartLine[] {
  return STORE_PRODUCTS.map((p) => ({ productId: p.id, quantity: 0 }));
}

const DEFAULT_WHATSAPP_NUMBER = "5493794789169";

export function whatsAppNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
}

export function buildWhatsAppCheckoutMessage(items: CartLine[]): string | null {
  const lines = cartLines(items);
  if (!lines.length) return null;

  return [
    "Hola! Quiero comprar tarjetas Volt Cards:",
    "",
    ...lines.flatMap((line) => [
      `• ${line.product.name} × ${line.quantity}`,
      `  ${formatArs(line.product.monthlyPrice)}/mes · Plan anual: ${formatArs(line.lineTotal)}`,
      "",
    ]),
    "─────────────────",
    `Total anual: ${formatArs(cartTotal(items))}`,
    "",
    "Incluye: tarjeta física NFC + QR + suscripción Volt Cards Social Media (perfil editable en cards.voltaiagents.com)",
    "",
    "¿Cómo seguimos con el pago y envío?",
  ].join("\n");
}

export function buildWhatsAppCheckoutUrl(items: CartLine[]): string | null {
  const phone = whatsAppNumber();
  const body = buildWhatsAppCheckoutMessage(items);
  if (!phone || !body) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
}
