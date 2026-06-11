import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_PROTECTED = ["/dashboard"];
const ADMIN_PROTECTED = ["/admin/dashboard", "/admin/users", "/admin/codes", "/admin/settings", "/admin/audit", "/admin/backup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userSession = request.cookies.get("neovpn_session")?.value;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminTokens = request.cookies
      .getAll("neovpn_admin_session")
      .some((c) => c.value.length > 0);
    if (!adminTokens && ADMIN_PROTECTED.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (USER_PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!userSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/login" && userSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/admin/login") {
    const hasAdminSession = request.cookies
      .getAll("neovpn_admin_session")
      .some((c) => c.value.length > 0);
    if (hasAdminSession) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
  ],
};
