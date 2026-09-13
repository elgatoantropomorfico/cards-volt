import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeatsAssignClient } from "./SeatsAssignClient";
import {
  assertOrderAccess,
  setOrderAccessCookie,
} from "@/server/order-access";

export const dynamic = "force-dynamic";

export default async function SeatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderId } = await params;
  const { t } = await searchParams;

  const access = await assertOrderAccess(orderId, t || null);
  if (!access.ok || access.order.paymentStatus !== "APPROVED") {
    notFound();
  }

  if (access.via === "token" || t) {
    await setOrderAccessCookie(orderId, access.order.accessToken);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      seats: {
        orderBy: { seatIndex: "asc" },
        include: {
          profile: {
            select: { id: true, slug: true, fullName: true, profileStatus: true },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <SeatsAssignClient
      orderId={order.id}
      orderNumber={order.orderNumber}
      accessToken={access.order.accessToken}
      seats={order.seats.map((s) => ({
        id: s.id,
        seatIndex: s.seatIndex,
        status: s.status,
        productId: s.productId,
        assigneeEmail: s.assigneeEmail,
        assigneeName: s.assigneeName,
        profile: s.profile,
      }))}
    />
  );
}
