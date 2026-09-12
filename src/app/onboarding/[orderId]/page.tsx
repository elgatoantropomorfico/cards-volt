import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { profileToView } from "@/server/profile-shape";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      profile: {
        include: {
          links: { orderBy: { order: "asc" } },
        },
      },
      items: true,
    },
  });

  if (!order || !order.profile) {
    notFound();
  }

  const profileView = profileToView(order.profile);
  const links = order.profile.links.map((l) => ({
    id: l.id,
    kind: l.kind as any,
    label: l.label,
    url: l.url,
    order: l.order,
  }));

  const appHost =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "cards.voltaiagents.com";

  return (
    <OnboardingWizard
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        profileStatus: order.profile.profileStatus,
        fulfillmentStatus: order.fulfillmentStatus,
      }}
      initialProfile={profileView}
      initialLinks={links}
      appHost={appHost}
    />
  );
}
