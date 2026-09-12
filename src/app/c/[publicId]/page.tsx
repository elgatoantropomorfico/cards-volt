import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InactiveProfile } from "@/components/templates/InactiveProfile";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ publicId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  const profile = await prisma.profile.findUnique({
    where: { publicId },
    select: { fullName: true, jobTitle: true, description: true, active: true, slug: true },
  });
  if (!profile || !profile.active) return { title: "Perfil no disponible — Volt Cards" };
  return {
    title: `${profile.fullName} — Volt Cards`,
    description: profile.description || profile.jobTitle || undefined,
  };
}

/**
 * Permanent Immutable Physical Resolver:
 * Resolves /c/:publicId -> redirects cleanly or renders active profile
 * Guarantees physical NFC and printed QR NEVER break if user updates their slug!
 */
export default async function PhysicalCardResolverPage({ params }: Props) {
  const { publicId } = await params;

  const profile = await prisma.profile.findUnique({
    where: { publicId },
    select: { id: true, slug: true, active: true, fullName: true },
  });

  if (!profile) {
    notFound();
  }

  if (!profile.active) {
    return <InactiveProfile name={profile.fullName} />;
  }

  // Redirect to current human slug with 307 temporary redirect so search engines and browsers
  // always re-resolve through /c/:publicId when tapped again!
  redirect(`/${profile.slug}`);
}
