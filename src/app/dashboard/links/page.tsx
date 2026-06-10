import { ensureProfile } from "@/server/profile-actions";
import { prisma } from "@/lib/prisma";
import { LinksManager } from "@/components/dashboard/LinksManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LinksPage() {
  const { profile } = await ensureProfile();
  const links = await prisma.link.findMany({
    where: { profileId: profile.id },
    orderBy: { order: "asc" },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Links</CardTitle>
        <CardDescription>Agregá, editá, reordená o eliminá links.</CardDescription>
      </CardHeader>
      <CardContent>
        <LinksManager initial={links.map((l) => ({ id: l.id, label: l.label, url: l.url }))} />
      </CardContent>
    </Card>
  );
}
