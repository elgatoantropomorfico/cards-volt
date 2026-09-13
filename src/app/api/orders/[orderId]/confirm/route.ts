import { NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/server/mercadopago";
import { handleApprovedOrder } from "@/server/order-fulfillment";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Called by the Success page when Mercado Pago redirects the browser back
 * (often before or in parallel with the webhook).
 * Verifies payment with MP API and advances the order if approved.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId as string | undefined;
    const paymentId = (body.paymentId || body.collectionId) as string | undefined;

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
        profile: { select: { id: true, slug: true, publicId: true, profileStatus: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "APPROVED") {
      return NextResponse.json({
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        profileId: order.profileId,
        profile: order.profile,
        confirmedNow: false,
      });
    }

    // Prefer verifying against Mercado Pago when we have a payment id from the redirect
    if (paymentId) {
      const paymentData = await getMercadoPagoPayment(String(paymentId));
      if (paymentData?.status === "approved") {
        const ref = paymentData.external_reference || orderId;
        await handleApprovedOrder({
          orderId: String(ref),
          paymentId: String(paymentData.id),
          paymentMethod: paymentData.payment_method_id,
          rawPayload: paymentData,
        });
      }
    } else {
      // Fallback: if MP redirected with status=approved but no payment id yet,
      // still do not invent approval — wait for webhook. Dev simulator covers local.
    }

    const refreshed = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        profileId: true,
        profile: { select: { id: true, slug: true, publicId: true, profileStatus: true } },
      },
    });

    return NextResponse.json({
      id: refreshed?.id,
      orderNumber: refreshed?.orderNumber,
      paymentStatus: refreshed?.paymentStatus,
      profileId: refreshed?.profileId,
      profile: refreshed?.profile,
      confirmedNow: refreshed?.paymentStatus === "APPROVED",
    });
  } catch (error: any) {
    console.error("confirm payment error:", error);
    return NextResponse.json({ error: error.message || "Error" }, { status: 500 });
  }
}
