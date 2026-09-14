import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOrderAccess, ensureOrderAccessToken } from "@/server/order-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const ip = clientIp(req);
  const rl = rateLimit(`order-status:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { orderId } = await context.params;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("t");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      profileId: true,
      accessToken: true,
      total: true,
      currency: true,
      profile: {
        select: {
          id: true,
          slug: true,
          publicId: true,
          profileStatus: true,
          onboardingStatus: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const access = await assertOrderAccess(orderId, token);
  if (!access.ok) {
    // Minimal public poll for checkout success (no PII / no wizard token)
    // Include total only when APPROVED so Meta Purchase can fire on success page
    return NextResponse.json(
      {
        id: order.id,
        paymentStatus: order.paymentStatus,
        ...(order.paymentStatus === "APPROVED"
          ? {
              orderNumber: order.orderNumber,
              total: Number(order.total),
              currency: order.currency || "ARS",
            }
          : {}),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const accessToken = order.accessToken || (await ensureOrderAccessToken(orderId));

  return NextResponse.json(
    {
      id: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      profileId: order.profileId,
      profile: order.profile,
      total: Number(order.total),
      currency: order.currency || "ARS",
      accessToken,
      onboardingUrl: `/onboarding/${order.id}?t=${encodeURIComponent(accessToken)}`,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
