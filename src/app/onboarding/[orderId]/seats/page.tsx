import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeatsAssignClient } from "./SeatsAssignClient";

export const dynamic = "force-dynamic";

export default async function SeatsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

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

  if (!order || order.paymentStatus !== "APPROVED") {
    notFound();
  }

  // If only one seat, nothing to assign — send them to dashboard conceptually via empty pending
  return (
    <SeatsAssignClient
      orderId={order.id}
      orderNumber={order.orderNumber}
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
