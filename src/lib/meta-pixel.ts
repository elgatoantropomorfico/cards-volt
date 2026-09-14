export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1431054568922499";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

function purchaseDedupeKey(orderId: string) {
  return `volt_meta_purchase:${orderId}`;
}

/** Fires Meta Purchase once per order per browser session. Call only after payment APPROVED. */
export function trackMetaPurchase(input: {
  orderId: string;
  value: number;
  currency?: string;
  orderNumber?: string | null;
}) {
  if (typeof window === "undefined") return;
  if (!input.orderId) return;

  try {
    if (sessionStorage.getItem(purchaseDedupeKey(input.orderId))) return;
    sessionStorage.setItem(purchaseDedupeKey(input.orderId), "1");
  } catch {
    /* ignore storage */
  }

  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) return;

  const payload = {
    value,
    currency: (input.currency || "ARS").toUpperCase(),
    content_type: "product",
    content_ids: [input.orderId],
    order_id: input.orderNumber || input.orderId,
  };

  const fire = () => {
    if (typeof window.fbq !== "function") return false;
    window.fbq("track", "Purchase", payload);
    return true;
  };

  if (fire()) return;

  // Pixel may still be loading when success confirms quickly
  let tries = 0;
  const id = window.setInterval(() => {
    tries += 1;
    if (fire() || tries > 25) window.clearInterval(id);
  }, 200);
}
