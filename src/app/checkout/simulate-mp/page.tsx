import { redirect } from "next/navigation";
import { handleApprovedOrder } from "@/server/order-fulfillment";
import { getMercadoPagoConfig } from "@/server/mercadopago";

export const dynamic = "force-dynamic";

/**
 * Dev-only simulation when Mercado Pago credentials are not configured.
 * Blocked in production unless ALLOW_MP_SIMULATE=true.
 */
export default async function SimulateMpPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const allow =
    process.env.ALLOW_MP_SIMULATE === "true" ||
    process.env.NODE_ENV !== "production";

  if (!allow) {
    redirect("/");
  }

  const config = await getMercadoPagoConfig();
  // If real MP is configured in prod-like env, never simulate
  if (config.isConfigured && process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const { orderId } = await searchParams;

  if (orderId) {
    await handleApprovedOrder({
      orderId,
      paymentId: `sim-pay-${Date.now()}`,
      paymentMethod: "visa_simulated",
    });
    const { ensureOrderAccessToken } = await import("@/server/order-access");
    const token = await ensureOrderAccessToken(orderId);
    redirect(`/checkout/success?orderId=${orderId}&t=${encodeURIComponent(token)}`);
  }

  redirect("/");
}
