import { ensureProfile } from "@/server/profile-actions";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardHome() {
  const { profile } = await ensureProfile();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Información pública que verán quienes escaneen tu tarjeta.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initial={{
              id: profile.id,
              slug: profile.slug,
              fullName: profile.fullName,
              jobTitle: profile.jobTitle ?? "",
              companyName: profile.companyName ?? "",
              description: profile.description ?? "",
              email: profile.email ?? "",
              phone: profile.phone ?? "",
              whatsapp: profile.whatsapp ?? "",
              website: profile.website ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
