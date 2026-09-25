import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

/**
 * Optimistic route protection: bounces anonymous visitors away from the
 * dashboard/admin areas before rendering. Pages and API handlers still do the
 * authoritative check (including a DB lookup) themselves.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
