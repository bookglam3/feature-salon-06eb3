import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "./app/lib/adminAuth";
import type { AdminRole } from "./app/types/admin";

const ROUTE_ROLES: Record<string, AdminRole[]> = {
  "/admin/users":     ["super_admin"],
  "/admin/audit":     ["super_admin"],
  "/admin/dev":       ["super_admin", "developer"],
  "/admin/support":   ["super_admin", "support_agent"],
  "/admin/sales":     ["super_admin", "sales_agent"],
  "/admin/salons":    ["super_admin", "ops_manager", "sales_agent"],
  "/admin/analytics": ["super_admin", "ops_manager"],
  "/admin/demo":      ["guest", "super_admin"],
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

  // ── Fully public — no token needed ────────────────────────
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/invite") ||
    pathname.startsWith("/api/admin/auth")   // covers login, logout, 2fa/*
  ) {
    return NextResponse.next();
  }

  // ── Only gate /admin/* ─────────────────────────────────────
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // ── Verify token ───────────────────────────────────────────
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(
      new URL(`/admin/login?next=${encodeURIComponent(pathname)}`, req.url),
    );
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    const res = NextResponse.redirect(new URL("/admin/login?error=session_expired", req.url));
    res.cookies.delete(ADMIN_COOKIE);
    return res;
  }

  // ── Enforce 2FA ────────────────────────────────────────────
  if (!payload.mfa_verified) {
    // Pages these users ARE allowed on before passing 2FA
    if (pathname.startsWith("/admin/setup-2fa"))   return NextResponse.next();
    if (pathname.startsWith("/admin/login/verify")) return NextResponse.next();

    // Route to the right step
    if (payload.mfa_setup_required) {
      return NextResponse.redirect(new URL("/admin/setup-2fa", req.url));
    }
    return NextResponse.redirect(new URL("/admin/login/verify", req.url));
  }

  // ── Guest: enforce demo expiry + redirect to /admin/demo ──
  if (payload.role === "guest") {
    const now = Math.floor(Date.now() / 1000);
    if (payload.demo_expires_at && now > payload.demo_expires_at) {
      const res = NextResponse.redirect(new URL("/admin/login?error=demo_expired", req.url));
      res.cookies.delete(ADMIN_COOKIE);
      return res;
    }
    if (!pathname.startsWith("/admin/demo") && !pathname.startsWith("/api/admin/demo")) {
      return NextResponse.redirect(new URL("/admin/demo", req.url));
    }
    return NextResponse.next({ request: { headers: new Headers(req.headers) } });
  }

  // ── Role check ─────────────────────────────────────────────
  const allowed = requiredRolesFor(pathname);
  if (allowed.length > 0 && !allowed.includes(payload.role as AdminRole)) {
    return NextResponse.redirect(new URL("/admin/login?error=forbidden", req.url));
  }

  // ── Forward identity headers to pages ─────────────────────
  const headers = new Headers(req.headers);
  headers.set("x-admin-id",   payload.id);
  headers.set("x-admin-role", payload.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*"],
};
