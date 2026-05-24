import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/app/lib/adminAuth";
import type { AdminRole } from "@/app/types/admin";

const ROUTE_ROLES: Record<string, AdminRole[]> = {
  "/admin/users":     ["super_admin"],
  "/admin/audit":     ["super_admin"],
  "/admin/dev":       ["super_admin", "developer"],
  "/admin/support":   ["super_admin", "support_agent"],
  "/admin/sales":     ["super_admin", "sales_agent"],
  "/admin/salons":    ["super_admin", "ops_manager", "sales_agent"],
  "/admin/analytics": ["super_admin", "ops_manager"],
  "/admin":           ["super_admin", "ops_manager", "support_agent", "sales_agent", "developer"],
};

function requiredRolesFor(pathname: string): AdminRole[] {
  const routes = Object.keys(ROUTE_ROLES).sort((a, b) => b.length - a.length);
  for (const route of routes) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return ROUTE_ROLES[route];
    }
  }
  return [];
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Public admin routes (no session required) ─────────────
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/invite") ||
    pathname.startsWith("/api/admin/auth")
  ) {
    return NextResponse.next();
  }

  // ── Only gate /admin/* routes ──────────────────────────────
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // ── Check token ────────────────────────────────────────────
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(
      new URL(`/admin/login?next=${encodeURIComponent(pathname)}`, req.url),
    );
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    const res = NextResponse.redirect(
      new URL("/admin/login?error=session_expired", req.url),
    );
    res.cookies.delete(ADMIN_COOKIE);
    return res;
  }

  // ── Check role for this route ──────────────────────────────
  const allowed = requiredRolesFor(pathname);
  if (allowed.length > 0 && !allowed.includes(payload.role as AdminRole)) {
    return NextResponse.redirect(
      new URL("/admin?error=forbidden", req.url),
    );
  }

  // ── Pass admin identity to page/layout via headers ─────────
  const headers = new Headers(req.headers);
  headers.set("x-admin-id",   payload.id);
  headers.set("x-admin-role", payload.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
