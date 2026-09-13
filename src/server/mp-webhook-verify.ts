import { createHmac, timingSafeEqual } from "crypto";
import { getMercadoPagoConfig } from "@/server/mercadopago";

/**
 * Validates Mercado Pago webhook signature when a secret is configured.
 * Docs: x-signature = ts=...,v1=...  +  x-request-id
 */
export async function verifyMercadoPagoWebhook(
  req: Request,
  dataId: string | undefined,
): Promise<{ ok: boolean; reason?: string }> {
  const { webhookSecret } = await getMercadoPagoConfig();
  if (!webhookSecret?.trim()) {
    // No secret configured: allow but flag (ops should set it in prod)
    if (process.env.NODE_ENV === "production" && process.env.REQUIRE_MP_WEBHOOK_SECRET === "true") {
      return { ok: false, reason: "webhook_secret_required" };
    }
    return { ok: true, reason: "secret_not_configured" };
  }

  const xSignature = req.headers.get("x-signature") || "";
  const xRequestId = req.headers.get("x-request-id") || "";
  if (!xSignature || !dataId) {
    return { ok: false, reason: "missing_signature_headers" };
  }

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as Record<string, string>;

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { ok: false, reason: "malformed_signature" };

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", webhookSecret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "signature_mismatch" };
    }
  } catch {
    return { ok: false, reason: "signature_compare_failed" };
  }

  return { ok: true };
}
