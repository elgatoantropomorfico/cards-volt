import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/utils";

export type MercadoPagoPreferenceItem = {
  id: string;
  title: string;
  description?: string;
  picture_url?: string;
  category_id?: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
};

export type CreatePreferenceInput = {
  orderId: string;
  orderNumber: string;
  items: MercadoPagoPreferenceItem[];
  payer: {
    name: string;
    surname?: string;
    email: string;
    phone?: { area_code?: string; number?: string };
    identification?: { type?: string; number?: string };
    address?: { street_name?: string; street_number?: number; zip_code?: string };
  };
};

export type MercadoPagoPreferenceResult = {
  id: string;
  init_point: string;
  sandbox_init_point: string;
};

export async function getMercadoPagoConfig() {
  const dbSetting = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  const accessToken =
    dbSetting?.mpAccessToken ||
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MP_ACCESS_TOKEN ||
    "";
  const publicKey =
    dbSetting?.mpPublicKey ||
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ||
    process.env.MP_PUBLIC_KEY ||
    "";
  const webhookSecret =
    dbSetting?.mpWebhookSecret ||
    process.env.MERCADOPAGO_WEBHOOK_SECRET ||
    "";
  const sandbox = dbSetting?.mpSandbox ?? (process.env.NODE_ENV !== "production");

  return {
    accessToken,
    publicKey,
    webhookSecret,
    sandbox,
    isConfigured: Boolean(accessToken && accessToken.trim().length > 10),
  };
}

/**
 * Creates Mercado Pago Preference securely from backend.
 * Uses order_id as external_reference.
 */
export async function createMercadoPagoPreference(
  input: CreatePreferenceInput,
): Promise<MercadoPagoPreferenceResult> {
  const config = await getMercadoPagoConfig();
  const base = appUrl();

  // If no credentials configured yet, only allow simulate outside production
  if (!config.isConfigured) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_MP_SIMULATE !== "true") {
      throw new Error(
        "Mercado Pago no está configurado. Cargá el Access Token en Superadmin → Configuración.",
      );
    }
    return {
      id: `dev-pref-${input.orderId}`,
      init_point: `${base}/checkout/simulate-mp?orderId=${input.orderId}`,
      sandbox_init_point: `${base}/checkout/simulate-mp?orderId=${input.orderId}`,
    };
  }

  const payload = {
    items: input.items,
    payer: input.payer,
    external_reference: input.orderId,
    statement_descriptor: "VOLT CARDS",
    back_urls: {
      success: `${base}/checkout/success?orderId=${input.orderId}`,
      pending: `${base}/checkout/success?orderId=${input.orderId}`,
      failure: `${base}/checkout?error=payment_failed&orderId=${input.orderId}`,
    },
    auto_return: "approved",
    notification_url: `${base}/api/mercadopago/webhook`,
    metadata: {
      order_id: input.orderId,
      order_number: input.orderNumber,
    },
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      `Mercado Pago Preference Error: ${res.statusText} ${JSON.stringify(errorData)}`,
    );
  }

  const data = await res.json();
  return {
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  };
}

/**
 * Query Payment status directly from Mercado Pago API
 */
export async function getMercadoPagoPayment(paymentId: string) {
  const config = await getMercadoPagoConfig();
  if (!config.isConfigured) return null;

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Find latest payment for an order via external_reference (order id).
 * Useful when the browser returns without a usable payment_id.
 */
export async function findMercadoPagoPaymentByOrderId(orderId: string) {
  const config = await getMercadoPagoConfig();
  if (!config.isConfigured) return null;

  const url = new URL("https://api.mercadopago.com/v1/payments/search");
  url.searchParams.set("external_reference", orderId);
  url.searchParams.set("sort", "date_created");
  url.searchParams.set("criteria", "desc");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  return results[0] || null;
}
