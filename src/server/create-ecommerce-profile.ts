import { generatePublicId } from "@/lib/id";
import { normalizeSlug } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function createEcommerceProfile(input: {
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  orderId: string;
  orderNumber: string;
}) {
  let baseSlug = normalizeSlug(input.fullName) || "user";
  if (baseSlug.length < 3) baseSlug = `${baseSlug}-card`;
  let candidateSlug = baseSlug;
  let i = 1;
  while (await prisma.profile.findUnique({ where: { slug: candidateSlug }, select: { id: true } })) {
    i += 1;
    candidateSlug = `${baseSlug}-${i}`;
  }

  return prisma.profile.create({
    data: {
      userId: input.userId,
      publicId: generatePublicId(),
      slug: candidateSlug,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone || null,
      source: "ECOMMERCE",
      sourceOrderId: input.orderId,
      sourceOrderNumber: input.orderNumber,
      profileStatus: "PENDING_CONFIGURATION",
      onboardingStatus: "NOT_STARTED",
      onboardingStep: 1,
    },
  });
}
