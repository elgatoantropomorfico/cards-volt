import { NextResponse } from "next/server";
import {
  findMercadoPagoPaymentByOrderId,
  getMercadoPagoPayment,
} from "@/server/mercadopago";
import { handleApprovedOrder } from "@/server/order-fulfillment";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanId(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (!s || s === "null" || s === "undefined") return undefined;
  return s;
}

/**
 * Called by the Success page when Mercado Pago redirects the browser back
 * (often before or in parallel with the webhook).
 * Verifies payment with MP API and advances the order if approved.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId: pathOrderId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const orderId = cleanId(body.orderId) || cleanId(pathOrderId);
    const paymentId = cleanId(body.paymentId || body.collectionId);

    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        profileId: true,
        profile: {
          select: { id: true, slug: true, publicId: true, profileStatus: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus !== "APPROVED") {
      let paymentData = paymentId ? await getMercadoPagoPayment(paymentId) : null;

      // Fallback: search MP by external_reference = orderId
      if (!paymentData || paymentData.status !== "approved") {
        paymentData = await findMercadoPagoPaymentByOrderId(orderId);
      }

      if (paymentData?.status === "approved") {
        const ref = cleanId(paymentData.external_reference) || orderId;
        await handleApprovedOrder({
          orderId: String(ref),
          paymentId: String(paymentData.id),
          paymentMethod: paymentData.payment_method_id,
          rawPayload: paymentData,
        });
      }
    }

    const refreshed = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        profileId: true,
        profile: {
          select: { id: true, slug: true, publicId: true, profileStatus: true },
        },
      },
    });

    return NextResponse.json({
      id: refreshed?.id,
      orderNumber: refreshed?.orderNumber,
      paymentStatus: refreshed?.paymentStatus,
      profileId: refreshed?.profileId,
      profile: refreshed?.profile,
      onboardingUrl: `/onboarding/${orderId}`,
      confirmedNow: refreshed?.paymentStatus === "APPROVED",
    });
  } catch (error: any) {
    console.error("confirm payment error:", error);
    return NextResponse.json({ error: error.message || "Error" }, { status: 500 });
  }
}
