// ─── Role definitions ────────────────────────────────────────
export type AdminRole =
  | "super_admin"    // Platform owner — full access
  | "ops_manager"    // View all salons/appointments, no edits
  | "support_agent"  // Tickets and complaints only
  | "sales_agent"    // View + onboard new salons
  | "developer";     // Staging/test environment only

// ─── Database row types ───────────────────────────────────────
export interface AdminUser {
  id:            string;
  role:          AdminRole;
  full_name:     string;
  email:         string;
  is_active:     boolean;
  notes?:        string;
  created_at:    string;
  created_by?:   string;
  last_login_at?: string;
}

export interface AdminTokenPayload {
  id:   string;
  role: AdminRole;
  iat:  number;
  exp:  number;
}

export interface SupportTicket {
  id:           string;
  salon_id?:    string;
  subject:      string;
  description:  string;
  status:       "open" | "in_progress" | "resolved" | "closed";
  priority:     "low" | "normal" | "high" | "urgent";
  assigned_to?: string;
  created_at:   string;
  updated_at:   string;
  resolved_at?: string;
}

export interface AdminAuditLog {
  id:           string;
  admin_id?:    string;
  admin_role?:  AdminRole;
  action:       string;
  resource:     string;
  resource_id?: string;
  old_data?:    Record<string, unknown>;
  new_data?:    Record<string, unknown>;
  ip_address?:  string;
  user_agent?:  string;
  created_at:   string;
}

// ─── Granular permissions ─────────────────────────────────────
export type Permission =
  | "view_all_salons"
  | "edit_salons"
  | "delete_salons"
  | "create_salons"
  | "view_appointments"
  | "view_support_tickets"
  | "manage_support_tickets"
  | "view_sales_pipeline"
  | "manage_sales_pipeline"
  | "view_staging"
  | "manage_admin_users"
  | "view_audit_log"
  | "view_analytics";

// ─── Role → permission matrix ─────────────────────────────────
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "view_all_salons",
    "edit_salons",
    "delete_salons",
    "create_salons",
    "view_appointments",
    "view_support_tickets",
    "manage_support_tickets",
    "view_sales_pipeline",
    "manage_sales_pipeline",
    "view_staging",
    "manage_admin_users",
    "view_audit_log",
    "view_analytics",
  ],
  ops_manager: [
    "view_all_salons",
    "view_appointments",
    "view_analytics",
  ],
  support_agent: [
    "view_support_tickets",
    "manage_support_tickets",
  ],
  sales_agent: [
    "view_all_salons",
    "create_salons",
    "view_sales_pipeline",
    "manage_sales_pipeline",
  ],
  developer: [
    "view_staging",
    "view_analytics",
  ],
};

// ─── UI helpers ───────────────────────────────────────────────
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin:   "Super Admin",
  ops_manager:   "Operations Manager",
  support_agent: "Support Agent",
  sales_agent:   "Sales Agent",
  developer:     "Developer",
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin:   "#EF4444",
  ops_manager:   "#6366F1",
  support_agent: "#F59E0B",
  sales_agent:   "#10B981",
  developer:     "#06B6D4",
};

// Which /admin/* routes each role may access
export const ROLE_ALLOWED_ROUTES: Record<AdminRole, string[]> = {
  super_admin:   ["/admin"],
  ops_manager:   ["/admin", "/admin/salons", "/admin/analytics"],
  support_agent: ["/admin", "/admin/support"],
  sales_agent:   ["/admin", "/admin/salons", "/admin/sales"],
  developer:     ["/admin", "/admin/dev"],
};
