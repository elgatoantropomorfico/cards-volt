import { NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/server/mercadopago";
import { handleApprovedOrder } from "@/server/order-fulfillment";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Mercado Pago IPN / Webhooks Endpoint
 * Receives notifications and validates payment idempotently.
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Mercado Pago sends topic or type
    const type = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId = body.data?.id || body.id || url.searchParams.get("data.id") || url.searchParams.get("id");

    if (type === "payment" && dataId) {
      const paymentData = await getMercadoPagoPayment(String(dataId));

      if (paymentData) {
        const orderId = paymentData.external_reference;
        const status = paymentData.status;

        if (orderId) {
          if (status === "approved") {
            await handleApprovedOrder({
              orderId,
              paymentId: String(paymentData.id),
              paymentMethod: paymentData.payment_method_id,
              rawPayload: paymentData,
            });
          } else if (status === "rejected" || status === "cancelled") {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                paymentStatus: status === "rejected" ? "REJECTED" : "CANCELLED",
                events: {
                  create: [
                    {
                      type: `payment.${status}`,
                      title: `Pago ${status}`,
                      detail: paymentData.status_detail || `Mercado Pago estado: ${status}`,
                    },
                  ],
                },
              },
            }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Mercado Pago Webhook error:", error);
    // Return 200 so MP doesn't relentlessly retry malformed notifications
    return NextResponse.json({ received: true, error: error.message });
  }
}
