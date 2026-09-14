import { prisma } from "@/lib/prisma";
import { ensureProfile } from "@/server/profile-actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { appUrl } from "@/lib/utils";
import { profileToView, linksToView } from "@/server/profile-shape";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>;
}) {
  const { profileId } = await searchParams;
  const { user, profile, profiles } = await ensureProfile(profileId || null);
  const [links, nfcCards] = await Promise.all([
    prisma.link.findMany({
      where: { profileId: profile.id },
      orderBy: { order: "asc" },
    }),
    prisma.nfcCard.findMany({
      where: { profileId: profile.id },
      orderBy: { assignedAt: "desc" },
    }),
  ]);

  const base = appUrl();
  const host = base.replace(/^https?:\/\//, "");

  return (
    <DashboardShell
      user={{ email: user.email, name: user.name, role: user.role }}
      profile={profileToView(profile)}
      profiles={profiles.map((p) => ({
        id: p.id,
        slug: p.slug,
        fullName: p.fullName,
      }))}
      links={linksToView(links)}
      appHost={host}
      appBaseUrl={base}
      nfcCards={nfcCards.map((c) => ({
        id: c.id,
        code: c.code,
        status: c.status,
        assignedAt: c.assignedAt?.toISOString() ?? null,
      }))}
      nfcCard={
        nfcCards[0]
          ? {
              id: nfcCards[0].id,
              code: nfcCards[0].code,
              status: nfcCards[0].status,
              assignedAt: nfcCards[0].assignedAt?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}
