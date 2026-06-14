import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/app/lib/adminAuth";

// Public admin paths that don't require an admin_token cookie
const ADMIN_PUBLIC_PATHS = ["/admin/login", "/admin/invite"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/")) {
    const isPublic = ADMIN_PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (!isPublic) {
      const token = req.cookies.get(ADMIN_COOKIE)?.value;
      const payload = token ? await verifyAdminToken(token) : null;
      if (!payload) {
        const res = NextResponse.redirect(new URL("/admin/login", req.url));
        if (token) res.cookies.delete(ADMIN_COOKIE); // clear stale/invalid cookie
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
