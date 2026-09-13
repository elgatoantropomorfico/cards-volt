import { NextResponse } from "next/server";
import {
  findMercadoPagoPaymentByOrderId,
  getMercadoPagoPayment,
} from "@/server/mercadopago";
import { handleApprovedOrder } from "@/server/order-fulfillment";
import { prisma } from "@/lib/prisma";
import { ensureOrderAccessToken } from "@/server/order-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanId(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (!s || s === "null" || s === "undefined") return undefined;
  return s;
}

/**
 * Called by the Success page when Mercado Pago redirects the browser back.
 * Only advances the order if Mercado Pago API confirms approval.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`order-confirm:${ip}`, 40, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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
        accessToken: true,
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

      if (!paymentData || paymentData.status !== "approved") {
        paymentData = await findMercadoPagoPaymentByOrderId(orderId);
      }

      if (paymentData?.status === "approved") {
        const ref = cleanId(paymentData.external_reference) || orderId;
        // Only fulfill if MP external_reference matches this order
        if (String(ref) !== orderId) {
          return NextResponse.json({ error: "Payment reference mismatch" }, { status: 400 });
        }
        await handleApprovedOrder({
          orderId,
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

    // Issue access token only after payment is approved (needed for wizard redirect)
    let accessToken: string | undefined;
    if (refreshed?.paymentStatus === "APPROVED") {
      accessToken = await ensureOrderAccessToken(orderId);
    }

    return NextResponse.json({
      id: refreshed?.id,
      orderNumber: refreshed?.orderNumber,
      paymentStatus: refreshed?.paymentStatus,
      profileId: refreshed?.profileId,
      profile: refreshed?.profile,
      accessToken,
      onboardingUrl: accessToken
        ? `/onboarding/${orderId}?t=${encodeURIComponent(accessToken)}`
        : undefined,
      confirmedNow: refreshed?.paymentStatus === "APPROVED",
    });
  } catch (error: any) {
    console.error("confirm payment error:", error);
    return NextResponse.json({ error: error.message || "Error" }, { status: 500 });
  }
}
