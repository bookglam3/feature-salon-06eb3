"use client";
import { useEffect, useState, useCallback } from "react";
import { ROLE_LABELS, ROLE_COLORS } from "@/app/types/admin";
import type { AdminRole } from "@/app/types/admin";

// ─── Types ─────────────────────────────────────────────────────
interface AdminMember {
  id:            string;
  full_name:     string;
  email:         string;
  role:          AdminRole;
  is_active:     boolean;
  created_at:    string;
  last_login_at: string | null;
  totp_enabled:  boolean;
}

interface Invite {
  id:         string;
  email:      string;
  role:       AdminRole;
  status:     string;
  created_at: string;
  expires_at: string;
  invited_by: { full_name: string; email: string } | null;
}

const INVITABLE_ROLES: AdminRole[] = ["ops_manager","support_agent","sales_agent","developer"];

// ─── Helpers ───────────────────────────────────────────────────
function RoleBadge({ role }: { role: AdminRole }) {
  const color = ROLE_COLORS[role];
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 99,
      background: `${color}18`, color, border: `1px solid ${color}40`,
      letterSpacing: "0.3px",
    }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const c = status === "pending" ? "#F59E0B" : status === "accepted" ? "#10B981" : "#EF4444";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}` }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function expiresIn(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m left`;
  return `${h}h left`;
}

// ─── Main page ──────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [members,    setMembers]    = useState<AdminMember[]>([]);
  const [invites,    setInvites]    = useState<Invite[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [invEmail,   setInvEmail]   = useState("");
  const [invRole,    setInvRole]    = useState<AdminRole>("ops_manager");
  const [invNote,    setInvNote]    = useState("");
  const [sending,    setSending]    = useState(false);
  const [sendMsg,    setSendMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [revoking,     setRevoking]     = useState<string | null>(null);
  const [resetting2fa, setResetting2fa] = useState<string | null>(null);
  const [tab,          setTab]          = useState<"team"|"invites">("team");

  // Demo account state
  const [demoEnabled,    setDemoEnabled]    = useState<boolean | null>(null);
  const [demoExpiresAt,  setDemoExpiresAt]  = useState<string | null>(null);
  const [demoLastLogin,  setDemoLastLogin]  = useState<string | null>(null);
  const [demoSaving,     setDemoSaving]     = useState(false);
  const [demoMsg,        setDemoMsg]        = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadDemo = useCallback(async () => {
    const res = await fetch("/api/admin/demo");
    if (!res.ok) return;
    const d = await res.json();
    setDemoEnabled(d.demo_enabled ?? true);
    setDemoExpiresAt(d.demo_expires_at ?? null);
    setDemoLastLogin(d.last_login_at ?? null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/admin/users",   { headers: { Cookie: document.cookie } }),
        fetch("/api/admin/invites", { headers: { Cookie: document.cookie } }),
      ]);
      const mData = membersRes.ok  ? await membersRes.json()  : { members: [] };
      const iData = invitesRes.ok  ? await invitesRes.json()  : { invites: [] };
      setMembers(mData.members  || []);
      setInvites(iData.invites  || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); loadDemo(); }, [load, loadDemo]);

  const handleDemoPatch = async (body: object) => {
    setDemoSaving(true);
    setDemoMsg(null);
    try {
      const res  = await fetch("/api/admin/demo", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setDemoMsg({ type: "err", text: json.error }); return; }
      setDemoEnabled(json.demo_enabled);
      setDemoExpiresAt(json.demo_expires_at ?? null);
      setDemoMsg({ type: "ok", text: "Demo settings updated." });
      setTimeout(() => setDemoMsg(null), 3000);
    } catch {
      setDemoMsg({ type: "err", text: "Network error." });
    } finally {
      setDemoSaving(false);
    }
  };

  const handleReset2FA = async (id: string, name: string) => {
    if (!confirm(`Reset 2FA for ${name}? They will be required to re-enroll on next login.`)) return;
    setResetting2fa(id);
    try {
      const res = await fetch(`/api/admin/auth/2fa/reset/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { alert(json.error || "Failed to reset 2FA."); return; }
      await load();
    } finally {
      setResetting2fa(null);
    }
  };

  const handleSendInvite = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSendMsg(null);
    setSending(true);
    try {
      const res  = await fetch("/api/admin/invites", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: invEmail, role: invRole, note: invNote }),
      });
      const json = await res.json();
      if (!res.ok) { setSendMsg({ type: "err", text: json.error }); return; }
      setSendMsg({ type: "ok", text: `Invite sent to ${invEmail}` });
      setInvEmail(""); setInvNote("");
      setTimeout(() => { setShowModal(false); setSendMsg(null); load(); }, 2000);
    } catch {
      setSendMsg({ type: "err", text: "Network error — please try again." });
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id: string, label: string) => {
    if (!confirm(`Revoke access for ${label}? They will immediately lose admin access.`)) return;
    setRevoking(id);
    try {
      await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setRevoking(null);
    }
  };

  // ── Card wrapper ─────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "#13131F", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18, overflow: "hidden",
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 900, fontFamily: "'Helvetica Neue',Arial,sans-serif" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#F1F5F9", fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
            Team Management
          </h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: "4px 0 0" }}>
            {members.filter(m => m.is_active).length} active · {invites.filter(i => i.status === "pending").length} pending invites
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setSendMsg(null); }}
          style={{
            padding: "11px 22px", background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
            color: "#fff", border: "none", borderRadius: 12, fontSize: 13,
            fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 18px rgba(79,70,229,0.35)",
          }}>
          + Invite Employee
        </button>
      </div>

      {/* ── Demo Access Control ───────────────────────────── */}
      <div style={{
        background: "#13131F", border: "1px solid rgba(139,92,246,0.25)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(139,92,246,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>👁</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Investor Demo Account</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                hushhushkarl@gmail.com · read-only · fake data only
              </div>
            </div>
            {demoEnabled !== null && (
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99,
                background: demoEnabled ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)",
                color: demoEnabled ? "#34D399" : "#FCA5A5",
                border: `1px solid ${demoEnabled ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}>
                {demoEnabled ? "Enabled" : "Disabled"}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {demoExpiresAt && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Expires: {expiresIn(demoExpiresAt)}
              </span>
            )}
            {demoLastLogin && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                Last login: {timeAgo(demoLastLogin)}
              </span>
            )}
            <button
              disabled={demoSaving}
              onClick={() => handleDemoPatch({ extend_hours: 24 })}
              style={{
                padding: "7px 14px", background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)", color: "#A5B4FC",
                borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: demoSaving ? "not-allowed" : "pointer",
              }}>
              + Extend 24h
            </button>
            <button
              disabled={demoSaving}
              onClick={() => handleDemoPatch({ enabled: !demoEnabled })}
              style={{
                padding: "7px 14px",
                background: demoEnabled ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
                border: `1px solid ${demoEnabled ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                color: demoEnabled ? "#FCA5A5" : "#34D399",
                borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: demoSaving ? "not-allowed" : "pointer",
              }}>
              {demoSaving ? "Saving…" : demoEnabled ? "Disable Access" : "Enable Access"}
            </button>
          </div>
        </div>

        {demoMsg && (
          <div style={{
            marginTop: 12, padding: "9px 14px", borderRadius: 9, fontSize: 12,
            background: demoMsg.type === "ok" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${demoMsg.type === "ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            color: demoMsg.type === "ok" ? "#34D399" : "#FCA5A5",
          }}>
            {demoMsg.text}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {(["team","invites"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, transition: "all 0.15s",
              background: tab === t ? "#4F46E5" : "transparent",
              color: tab === t ? "#fff" : "rgba(255,255,255,0.4)",
              boxShadow: tab === t ? "0 4px 14px rgba(79,70,229,0.3)" : "none",
            }}>
            {t === "team" ? `Active Team (${members.filter(m => m.is_active).length})` : `Invites (${invites.filter(i => i.status === "pending").length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.3)", padding: 48, textAlign: "center" }}>Loading…</div>
      ) : (

        /* ── TEAM TAB ──────────────────────────────────────── */
        tab === "team" ? (
          <div style={card}>
            {members.filter(m => m.is_active).length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                No team members yet. Invite someone above.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Member","Role","2FA","Last Login","Joined","Actions"].map(h => (
                      <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.filter(m => m.is_active).map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${ROLE_COLORS[m.role]}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: ROLE_COLORS[m.role] }}>
                            {m.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{m.full_name}</div>
                            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 18px" }}><RoleBadge role={m.role} /></td>
                      <td style={{ padding: "14px 18px" }}>
                        {m.totp_enabled ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#34D399", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "3px 9px", borderRadius: 99 }}>Enabled</span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", padding: "3px 9px", borderRadius: 99 }}>Not set up</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>{timeAgo(m.last_login_at)}</td>
                      <td style={{ padding: "14px 18px", fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
                        {new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {m.role !== "super_admin" && m.totp_enabled && (
                            <button
                              disabled={resetting2fa === m.id}
                              onClick={() => handleReset2FA(m.id, m.full_name)}
                              style={{ padding: "6px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              {resetting2fa === m.id ? "Resetting…" : "Reset 2FA"}
                            </button>
                          )}
                          {m.role !== "super_admin" && (
                            <button
                              disabled={revoking === m.id}
                              onClick={() => handleRevoke(m.id, m.full_name)}
                              style={{ padding: "6px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              {revoking === m.id ? "Revoking…" : "Revoke"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        /* ── INVITES TAB ────────────────────────────────────── */
        ) : (
          <div style={card}>
            {invites.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                No invites sent yet.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Email","Role","Status","Sent","Expires","Action"].map(h => (
                      <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invites.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: inv.status === "pending" ? 1 : 0.5 }}>
                      <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{inv.email}</td>
                      <td style={{ padding: "14px 18px" }}><RoleBadge role={inv.role} /></td>
                      <td style={{ padding: "14px 18px" }}><StatusDot status={inv.status} /></td>
                      <td style={{ padding: "14px 18px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{timeAgo(inv.created_at)}</td>
                      <td style={{ padding: "14px 18px", fontSize: 12, color: inv.status === "pending" ? "#FCD34D" : "rgba(255,255,255,0.25)" }}>
                        {inv.status === "pending" ? expiresIn(inv.expires_at) : "—"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {inv.status === "pending" && (
                          <button
                            disabled={revoking === inv.id}
                            onClick={() => handleRevoke(inv.id, inv.email)}
                            style={{ padding: "6px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            {revoking === inv.id ? "Revoking…" : "Revoke"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {/* ── INVITE MODAL ───────────────────────────────────── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 24 }}>
          <div style={{ background: "#13131F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, width: "100%", maxWidth: 440, boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>

            {/* Modal header */}
            <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ color: "#F1F5F9", fontSize: 18, fontWeight: 800, margin: 0 }}>Invite Team Member</h2>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "4px 0 0" }}>They'll receive a secure 48-hour invite link</p>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ×
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSendInvite} style={{ padding: "24px 28px 28px" }}>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={mLabel}>Email address *</label>
                <input
                  type="email" required placeholder="jane@example.com"
                  value={invEmail} onChange={e => setInvEmail(e.target.value)}
                  style={mInput}
                />
              </div>

              {/* Role selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={mLabel}>Role *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {INVITABLE_ROLES.map(r => (
                    <button key={r} type="button"
                      onClick={() => setInvRole(r)}
                      style={{
                        padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                        border: `1.5px solid ${invRole === r ? ROLE_COLORS[r] : "rgba(255,255,255,0.1)"}`,
                        background: invRole === r ? `${ROLE_COLORS[r]}14` : "rgba(255,255,255,0.03)",
                        textAlign: "left", transition: "all 0.12s",
                      }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: invRole === r ? ROLE_COLORS[r] : "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>
                        {r.replace("_"," ")}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                        {r === "ops_manager"   ? "View salons & analytics" :
                         r === "support_agent" ? "Handle tickets" :
                         r === "sales_agent"   ? "Onboard new salons" :
                                                 "Staging access only"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional note */}
              <div style={{ marginBottom: 22 }}>
                <label style={mLabel}>Personal note <span style={{ opacity: 0.5 }}>(optional)</span></label>
                <textarea
                  placeholder="Add a personal message to include in the invite email…"
                  value={invNote} onChange={e => setInvNote(e.target.value)} rows={2}
                  style={{ ...mInput, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>

              {/* Feedback */}
              {sendMsg && (
                <div style={{
                  padding: "12px 16px", borderRadius: 10, marginBottom: 18, fontSize: 13,
                  background: sendMsg.type === "ok" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${sendMsg.type === "ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                  color: sendMsg.type === "ok" ? "#34D399" : "#FCA5A5",
                }}>
                  {sendMsg.type === "ok" ? "✅ " : "⚠️ "}{sendMsg.text}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={sending}
                  style={{
                    flex: 2, padding: "12px",
                    background: sending ? "rgba(79,70,229,0.4)" : "linear-gradient(135deg,#4F46E5,#7C3AED)",
                    color: "#fff", border: "none", borderRadius: 12,
                    fontSize: 13, fontWeight: 800, cursor: sending ? "not-allowed" : "pointer",
                    boxShadow: sending ? "none" : "0 4px 18px rgba(79,70,229,0.35)",
                  }}>
                  {sending ? "Sending…" : "Send Invite Email →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal local styles ────────────────────────────────────────
const mLabel: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "rgba(255,255,255,0.35)", marginBottom: 7, letterSpacing: "0.4px",
};
const mInput: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, fontSize: 13.5, color: "#fff",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
