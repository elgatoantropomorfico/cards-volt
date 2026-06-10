import { ensureProfile } from "@/server/profile-actions";
import { AppearanceForm } from "@/components/dashboard/AppearanceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AppearancePage() {
  const { profile } = await ensureProfile();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>Elegí plantilla, color y fotos.</CardDescription>
      </CardHeader>
      <CardContent>
        <AppearanceForm
          initial={{
            template: profile.template,
            primaryColor: profile.primaryColor,
            avatarUrl: profile.avatarUrl,
            coverUrl: profile.coverUrl,
            slug: profile.slug,
          }}
        />
      </CardContent>
    </Card>
  );
}
