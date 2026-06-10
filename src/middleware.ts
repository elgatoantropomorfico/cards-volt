import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Only gate dashboard areas. Public profile pages are open.
  const sessionCookie =
    req.cookies.get("voltcards.session_token") ||
    req.cookies.get("voltcards.session_token.0");

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/admin");

  if (isProtected && !sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/company/:path*", "/admin/:path*"],
};
