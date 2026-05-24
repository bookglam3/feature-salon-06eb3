import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface LogInput {
  adminId:     string;
  adminRole:   string;
  action:      string;   // e.g. "login", "update_salon", "invite_sent"
  resource:    string;   // table: "salons", "appointments", "admin_users"
  resourceId?: string;
  salonId?:    string;
  details?:    string;   // human-readable: "Updated plan from starter → pro"
  oldData?:    unknown;
  newData?:    unknown;
  req?:        NextRequest;
}

// Common action constants — import these instead of raw strings
export const LOG_ACTIONS = {
  LOGIN:               "login",
  LOGOUT:              "logout",
  VIEW_SALON:          "view_salon",
  UPDATE_SALON:        "update_salon",
  DELETE_SALON:        "delete_salon",
  CREATE_SALON:        "create_salon",
  VIEW_APPOINTMENTS:   "view_appointments",
  UPDATE_APPOINTMENT:  "update_appointment",
  DELETE_APPOINTMENT:  "delete_appointment",
  INVITE_SENT:         "invite_sent",
  INVITE_REVOKED:      "invite_revoked",
  INVITE_ACCEPTED:     "invite_accepted",
  ADMIN_DEACTIVATED:   "admin_deactivated",
  ADMIN_CREATED:       "admin_created",
  BROADCAST_SENT:      "broadcast_sent",
  SETTINGS_UPDATED:    "settings_updated",
  FLAG_TOGGLED:        "flag_toggled",
  PLAN_CHANGED:        "plan_changed",
  TRIAL_EXTENDED:      "trial_extended",
  AGENT_APPROVED:      "agent_approved",
  AGENT_REJECTED:      "agent_rejected",
} as const;

/**
 * Records an admin action to admin_audit_log.
 * Non-throwing — a log failure never crashes the calling request.
 * Call this from any /api/admin/* route after a successful action.
 */
export async function logAction(input: LogInput): Promise<void> {
  try {
    const ip = input.req?.headers.get("x-forwarded-for")?.split(",")[0].trim()
      ?? input.req?.headers.get("x-real-ip")
      ?? undefined;
    const ua = input.req?.headers.get("user-agent") ?? undefined;

    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id:    input.adminId,
      admin_role:  input.adminRole,
      action:      input.action,
      resource:    input.resource,
      resource_id: input.resourceId ?? null,
      salon_id:    input.salonId    ?? null,
      details:     input.details    ?? null,
      old_data:    input.oldData    ?? null,
      new_data:    input.newData    ?? null,
      ip_address:  ip               ?? null,
      user_agent:  ua               ?? null,
    });
  } catch (err) {
    console.error("[logAction] insert failed:", err);
  }
}
