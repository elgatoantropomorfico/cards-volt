import { NextResponse, type NextRequest } from "next/server";

const ORDER_ACCESS_COOKIE = "volt_order_access";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies
    .getAll()
    .some((c) => c.name.includes("voltcards.session_token"));

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtected && !sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Persist order access token from ?t= without setting cookies in RSC (Next 15 crash)
  const token = req.nextUrl.searchParams.get("t");
  const onboardingMatch = pathname.match(/^\/onboarding\/([^/]+)/);
  if (token && onboardingMatch) {
    const orderId = onboardingMatch[1];
    const res = NextResponse.next();
    res.cookies.set(ORDER_ACCESS_COOKIE, `${orderId}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 45,
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/onboarding/:path*"],
};
