import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export async function getResendApiKey(): Promise<string | null> {
  const settings = await prisma.storeSetting.findUnique({
    where: { id: "default" },
    select: { resendApiKey: true },
  });
  const key = settings?.resendApiKey?.trim() || process.env.RESEND_API_KEY?.trim() || "";
  return key || null;
}

export async function getResendClient(): Promise<Resend | null> {
  const key = await getResendApiKey();
  if (!key) return null;
  return new Resend(key);
}

export async function getActiveSalesMailbox() {
  const mailbox = await prisma.storeMailbox.findFirst({
    where: { role: "SALES", active: true },
    orderBy: { createdAt: "asc" },
  });
  if (mailbox) return mailbox;

  // Fallback seed address if catalog hasn't run yet
  return {
    id: "fallback",
    email: "ventas@cards.voltaiagents.com",
    label: "Ventas Volt Cards",
    role: "SALES",
    active: true,
    notes: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://cards.voltaiagents.com"
  );
}

export function brandLogoUrl() {
  return `${appBaseUrl()}/brand/volt-mark.png`;
}
