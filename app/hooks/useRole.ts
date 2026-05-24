"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import { ROLE_PERMISSIONS } from "@/app/types/admin";
import type { AdminRole, AdminUser, Permission } from "@/app/types/admin";

// ─── Return type ──────────────────────────────────────────────

export interface UseRoleResult {
  /** Full admin_users row, null if not an admin or still loading */
  user:    AdminUser | null;
  /** Shortcut for user.role */
  role:    AdminRole | null;
  loading: boolean;
  error:   string | null;
  /** True when user is a confirmed admin with any role */
  isAdmin: boolean;
  /** Check a single granular permission */
  can:     (permission: Permission) => boolean;
  /** Check if the user has exactly this role */
  is:      (role: AdminRole) => boolean;
  /** Check if the user has any of these roles */
  isAnyOf: (roles: AdminRole[]) => boolean;
  /** All permissions the current role holds */
  permissions: Permission[];
}

// ─── Hook ─────────────────────────────────────────────────────

export function useRole(): UseRoleResult {
  const [user,    setUser]    = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { setLoading(false); return; }

        const { data, error: dbErr } = await supabase
          .from("admin_users")
          .select("id, role, full_name, email, is_active, notes, created_at, last_login_at")
          .eq("id", authUser.id)
          .eq("is_active", true)
          .maybeSingle();

        if (cancelled) return;
        if (dbErr) throw dbErr;
        setUser(data as AdminUser | null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load role");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────

  const permissions: Permission[] = user?.role
    ? ROLE_PERMISSIONS[user.role]
    : [];

  const can = useCallback(
    (permission: Permission): boolean =>
      permissions.includes(permission),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.role],
  );

  const is = useCallback(
    (role: AdminRole): boolean => user?.role === role,
    [user?.role],
  );

  const isAnyOf = useCallback(
    (roles: AdminRole[]): boolean => !!user?.role && roles.includes(user.role),
    [user?.role],
  );

  return {
    user,
    role:        user?.role ?? null,
    loading,
    error,
    isAdmin:     !!user,
    can,
    is,
    isAnyOf,
    permissions,
  };
}

// ─── Convenience guard component (optional usage) ─────────────

import type { ReactNode } from "react";

/**
 * Renders children only when the user has the required permission.
 * Usage: <RoleGuard permission="edit_salons"><EditButton /></RoleGuard>
 */
export function RoleGuard({
  permission,
  role,
  fallback = null,
  children,
}: {
  permission?: Permission;
  role?:       AdminRole | AdminRole[];
  fallback?:   ReactNode;
  children:    ReactNode;
}): ReactNode {
  const { can, is, isAnyOf, loading } = useRole();
  if (loading) return null;

  if (permission && !can(permission)) return fallback;
  if (role) {
    const ok = Array.isArray(role) ? isAnyOf(role) : is(role);
    if (!ok) return fallback;
  }
  return children;
}
