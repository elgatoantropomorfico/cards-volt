import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Only gate dashboard areas. Public profile pages are open.
  const sessionCookie = req.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("voltcards") &&
        (c.name.includes("session_token") || c.name.includes("session")),
    );

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/admin");

  if (isProtected && !sessionCookie) {
    // No session cookie at all → kick to login
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
