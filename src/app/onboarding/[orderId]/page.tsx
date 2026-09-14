import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { profileToView } from "@/server/profile-shape";
import { OnboardingWizard } from "./OnboardingWizard";
import { ProfileChoiceClient } from "./ProfileChoiceClient";
import { assertOrderAccess } from "@/server/order-access";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
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

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      profile: {
        include: {
          links: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Existing account with profiles but this order not linked yet → choice UI
  if (!order.profileId && order.userId) {
    const existingProfiles = await prisma.profile.findMany({
      where: { userId: order.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        fullName: true,
        profileStatus: true,
      },
    });

    if (existingProfiles.length > 0) {
      return (
        <ProfileChoiceClient
          orderId={order.id}
          orderNumber={order.orderNumber}
          accessToken={access.order.accessToken}
          profiles={existingProfiles}
        />
      );
    }

    notFound();
  }

  if (!order.profile) {
    notFound();
  }

  const credential = order.userId
    ? await prisma.account.findFirst({
        where: { userId: order.userId, providerId: "credential" },
        select: { password: true },
      })
    : null;

  const needsPassword = !credential?.password;

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
        email: order.email,
        accessToken: access.order.accessToken,
      }}
      initialProfile={profileView}
      initialLinks={links}
      appHost={appHost}
      needsPassword={needsPassword}
    />
  );
}
