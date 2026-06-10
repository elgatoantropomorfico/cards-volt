import { prisma } from "@/lib/prisma";
import { ensureProfile } from "@/server/profile-actions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { appUrl } from "@/lib/utils";
import { profileToView, linksToView } from "@/server/profile-shape";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await ensureProfile();
  const links = await prisma.link.findMany({
    where: { profileId: profile.id },
    orderBy: { order: "asc" },
  });

  const base = appUrl();
  const host = base.replace(/^https?:\/\//, "");

  return (
    <DashboardShell
      user={{ email: user.email, name: user.name, role: user.role }}
      profile={profileToView(profile)}
      links={linksToView(links)}
      appHost={host}
      appBaseUrl={base}
    />
  );
}
