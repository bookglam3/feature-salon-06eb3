import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminRequest } from "@/app/lib/adminAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─────────────────────────────────────────────────────────────
// GET /api/admin/audit
// Query params:
//   page      (default 1)
//   limit     (default 50, max 100)
//   adminId   filter by admin user
//   action    filter by action type
//   resource  filter by resource table
//   dateFrom  ISO date string (inclusive)
//   dateTo    ISO date string (inclusive)
// Super Admin only.
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin)                      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (admin.role !== "super_admin") return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const sp       = req.nextUrl.searchParams;
  const page     = Math.max(1, parseInt(sp.get("page")  ?? "1"));
  const limit    = Math.min(100, parseInt(sp.get("limit") ?? "50"));
  const adminId  = sp.get("adminId")  || null;
  const action   = sp.get("action")   || null;
  const resource = sp.get("resource") || null;
  const dateFrom = sp.get("dateFrom") || null;
  const dateTo   = sp.get("dateTo")   || null;

  let query = supabaseAdmin
    .from("admin_audit_log")
    .select(
      `id, action, resource, resource_id, salon_id, details,
       ip_address, created_at, admin_role,
       admin:admin_id ( full_name, email )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (adminId)  query = query.eq("admin_id",  adminId);
  if (action)   query = query.eq("action",    action);
  if (resource) query = query.eq("resource",  resource);
  if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
  if (dateTo) {
    const end = new Date(dateTo);
    end.setDate(end.getDate() + 1);
    query = query.lt("created_at", end.toISOString());
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    logs:  data   ?? [],
    total: count  ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  });
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/audit/meta — distinct actions + admin list
// Used to populate the filter dropdowns.
// ─────────────────────────────────────────────────────────────
// (Served as a separate sub-route below — Next.js groups by file)
export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin)                      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (admin.role !== "super_admin") return NextResponse.json({ error: "Forbidden" },    { status: 403 });

  const [adminsResult, actionsResult] = await Promise.all([
    supabaseAdmin.from("admin_users").select("id, full_name, email, role").eq("is_active", true),
    supabaseAdmin.from("admin_audit_log").select("action").limit(1000),
  ]);

  const distinctActions = [...new Set((actionsResult.data ?? []).map(r => r.action))].sort();

  return NextResponse.json({
    admins:  adminsResult.data  ?? [],
    actions: distinctActions,
  });
}
