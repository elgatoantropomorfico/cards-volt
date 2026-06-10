import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileRenderer } from "@/components/templates/ProfileRenderer";
import { InactiveProfile } from "@/components/templates/InactiveProfile";
import { profileToView, linksToView } from "@/server/profile-shape";

export const revalidate = 30;

type Props = { params: Promise<{ slug: string }> };

async function loadProfile(slug: string) {
  return prisma.profile.findUnique({
    where: { slug },
    include: { links: { orderBy: { order: "asc" } }, company: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile || !profile.active) return { title: "Perfil no disponible" };
  return {
    title: `${profile.fullName} — Volt Cards`,
    description: profile.description || profile.jobTitle || undefined,
    openGraph: {
      title: profile.fullName,
      description: profile.description || profile.jobTitle || undefined,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) notFound();
  if (!profile.active) return <InactiveProfile name={profile.fullName} />;

  return <ProfileRenderer profile={profileToView(profile)} links={linksToView(profile.links)} />;
}
