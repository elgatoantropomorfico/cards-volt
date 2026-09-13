import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ORDER_ACCESS_COOKIE = "volt_order_access";

export function generateOrderAccessToken() {
  return randomBytes(32).toString("base64url");
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function ensureOrderAccessToken(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { accessToken: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.accessToken) return order.accessToken;

  const accessToken = generateOrderAccessToken();
  await prisma.order.update({
    where: { id: orderId },
    data: { accessToken },
  });
  return accessToken;
}

export type OrderAccessResult =
  | {
      ok: true;
      order: {
        id: string;
        email: string;
        userId: string | null;
        profileId: string | null;
        paymentStatus: string;
        accessToken: string;
        orderNumber: string;
      };
      via: "session" | "token" | "admin";
    }
  | { ok: false; error: string; status: number };

/**
 * Authorizes access to an order for onboarding / seats / uploads.
 * Accepts: SUPERADMIN session, buyer session (userId or email), or access token.
 */
export async function assertOrderAccess(
  orderId: string,
  token?: string | null,
): Promise<OrderAccessResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      userId: true,
      profileId: true,
      paymentStatus: true,
      accessToken: true,
      orderNumber: true,
    },
  });

  if (!order) return { ok: false, error: "Pedido no encontrado", status: 404 };

  let accessToken = order.accessToken;
  if (!accessToken) {
    accessToken = await ensureOrderAccessToken(orderId);
  }

  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (session?.user && role === "SUPERADMIN") {
    return {
      ok: true,
      order: { ...order, accessToken },
      via: "admin",
    };
  }

  if (session?.user) {
    const email = session.user.email?.toLowerCase();
    if (
      (order.userId && session.user.id === order.userId) ||
      (email && email === order.email.toLowerCase())
    ) {
      return {
        ok: true,
        order: { ...order, accessToken },
        via: "session",
      };
    }
  }

  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(ORDER_ACCESS_COOKIE)?.value;
  const fromCookie =
    cookieVal && cookieVal.startsWith(`${orderId}.`)
      ? cookieVal.slice(orderId.length + 1)
      : null;

  const candidate = token || fromCookie;
  if (candidate && safeEqual(candidate, accessToken)) {
    return {
      ok: true,
      order: { ...order, accessToken },
      via: "token",
    };
  }

  return { ok: false, error: "No autorizado para este pedido", status: 403 };
}

export async function setOrderAccessCookie(orderId: string, token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORDER_ACCESS_COOKIE, `${orderId}.${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 45,
  });
}

export function onboardingPath(orderId: string, accessToken?: string | null) {
  if (!accessToken) return `/onboarding/${orderId}`;
  return `/onboarding/${orderId}?t=${encodeURIComponent(accessToken)}`;
}
