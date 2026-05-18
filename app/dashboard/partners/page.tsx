"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import DashboardShell, { HamburgerBtn } from "../components/DashboardShell";
import { SkeletonDashboard } from "../components/SkeletonLoader";
import Modal, { FormGroup, ModalActions, BtnPrimary, BtnSecondary } from "../components/Modal";
import { useToast } from "../components/Toast";
import { ToastProvider } from "../components/Toast";

// ─── Types ─────────────────────────────────────────────────────
interface Agent {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  city: string;
  experience: string;
  own_vehicle: boolean;
  daily_availability: string;
  why_hire: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  referral_code: string | null;
  referred_salons: number;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  "fresher": "Fresher",
  "less-than-1": "< 1 year",
  "1-2": "1–2 years",
  "2-5": "2–5 years",
  "5+": "5+ years",
};

const AVAIL_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "mornings": "Mornings",
  "evenings": "Evenings",
  "weekends": "Weekends",
};

const STATUS_STYLE = {
  pending:  { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", label: "⏳ Pending" },
  approved: { bg: "#ECFDF5", color: "#065F46", border: "#6EE7B7", label: "✅ Approved" },
  rejected: { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", label: "❌ Rejected" },
};

// ─── Main Component ────────────────────────────────────────────
function PartnersPageInner() {
  const router = useRouter();
  const toast = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Agent | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  }, []);

  const loadAgents = useCallback(async () => {
    const token = await getToken();
    const url = filter === "all" ? "/api/partners" : `/api/partners?status=${filter}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const json = await res.json();
      setAgents(json.agents || []);
    } else {
      toast.error("Failed to load partner applications");
    }
  }, [filter, getToken, toast]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      // ── Super Admin only ─────────────────────────────────────
      if (user.email !== "adilgill2008@gmail.com") {
        router.replace("/dashboard");
        return;
      }
      // ─────────────────────────────────────────────────────────
      const { data: salon } = await supabase.from("salons").select("name").eq("owner_id", user.id).single();
      setSalonName(salon?.name || "");
      await loadAgents();
      setLoading(false);
    };
    init();
  }, [router, loadAgents]);

  useEffect(() => {
    if (!loading) loadAgents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openReview = (agent: Agent, status: "approved" | "rejected") => {
    setSelected(agent);
    setReviewStatus(status);
    setReviewNotes(agent.admin_notes || "");
    setReviewModal(true);
  };

  const handleReview = async () => {
    if (!selected) return;
    setSaving(true);
    const token = await getToken();
    const res = await fetch("/api/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: selected.id, status: reviewStatus, admin_notes: reviewNotes }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(json.error || "Failed to update"); return; }
    toast.success(reviewStatus === "approved" ? "Application approved! Referral code generated." : "Application rejected.");
    setReviewModal(false);
    setSelected(null);
    await loadAgents();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${code}`);
    setCopiedCode(code);
    toast.info("Referral link copied!");
    setTimeout(() => setCopiedCode(""), 2500);
  };

  const filtered = agents.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  // ── Stats
  const stats = {
    total: agents.length,
    pending: agents.filter(a => a.status === "pending").length,
    approved: agents.filter(a => a.status === "approved").length,
    rejected: agents.filter(a => a.status === "rejected").length,
    referred: agents.reduce((s, a) => s + (a.referred_salons || 0), 0),
  };

  if (loading) return <DashboardShell salonName=""><SkeletonDashboard /></DashboardShell>;

  const Topbar = (
    <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HamburgerBtn />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.3px" }}>Partner Applications</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{stats.pending} pending review</div>
        </div>
      </div>
      <a
        href="/partner"
        target="_blank"
        style={{ background: "var(--indigo)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "7px 14px", borderRadius: "var(--r-sm)", textDecoration: "none", whiteSpace: "nowrap" }}
      >
        View Form →
      </a>
    </header>
  );

  return (
    <DashboardShell salonName={salonName} topbar={Topbar}>
      <div style={{ padding: "24px 20px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total",    value: stats.total,    color: "var(--indigo)",   bg: "var(--indigo-light)" },
            { label: "Pending",  value: stats.pending,  color: "#D97706",          bg: "#FFFBEB" },
            { label: "Approved", value: stats.approved, color: "var(--green)",    bg: "var(--green-light)" },
            { label: "Rejected", value: stats.rejected, color: "var(--red)",      bg: "var(--red-light)" },
            { label: "Signups Referred", value: stats.referred, color: "#7C3AED", bg: "#F5F3FF" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "14px 16px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--slate-100)", borderRadius: "var(--r-sm)", padding: 3, gap: 2 }}>
            {(["all", "pending", "approved", "rejected"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "6px 14px", fontSize: 12.5, borderRadius: 6, border: "none", background: filter === f ? "#fff" : "transparent", color: filter === f ? "var(--text-1)" : "var(--text-3)", fontWeight: filter === f ? 600 : 400, cursor: "pointer", textTransform: "capitalize", transition: "all 0.12s", boxShadow: filter === f ? "var(--shadow-xs)" : "none" }}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, city…"
            style={{ flex: 1, minWidth: 180, maxWidth: 300, padding: "8px 13px", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", fontSize: 13.5, outline: "none", fontFamily: "var(--font)", color: "var(--text-1)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Table / Cards */}
        {filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>No applications yet</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Share <strong>/partner</strong> with potential agents to start receiving applications.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(agent => {
              const st = STATUS_STYLE[agent.status];
              return (
                <div key={agent.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px 18px", transition: "box-shadow 0.14s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, var(--indigo), #7C3AED)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 800, color: "#fff",
                      }}>
                        {agent.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.2px" }}>{agent.full_name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>
                          📍 {agent.city} · 📞 {agent.phone}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                        {new Date(agent.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Details chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {[
                      `🎓 ${EXPERIENCE_LABELS[agent.experience] || agent.experience}`,
                      `⏰ ${AVAIL_LABELS[agent.daily_availability] || agent.daily_availability}`,
                      agent.own_vehicle ? "🚗 Has vehicle" : "🚶 No vehicle",
                      agent.whatsapp ? `💬 WhatsApp: ${agent.whatsapp}` : "",
                    ].filter(Boolean).map(chip => (
                      <span key={chip} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 99, background: "var(--slate-100)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                        {chip}
                      </span>
                    ))}
                  </div>

                  {/* Why hire */}
                  <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 12, padding: "10px 12px", background: "var(--slate-50)", borderRadius: "var(--r-sm)", borderLeft: "3px solid var(--indigo-pale)" }}>
                    {agent.why_hire.length > 180 ? agent.why_hire.slice(0, 180) + "…" : agent.why_hire}
                  </div>

                  {/* Referral code (approved only) */}
                  {agent.referral_code && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F0F4FF", borderRadius: "var(--r-sm)", marginBottom: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Referral Code:</span>
                      <code style={{ fontSize: 13, fontWeight: 800, color: "var(--indigo)", background: "var(--indigo-light)", padding: "2px 10px", borderRadius: 6 }}>
                        {agent.referral_code}
                      </code>
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>→ {agent.referred_salons} signups</span>
                      <button
                        onClick={() => copyCode(agent.referral_code!)}
                        style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: copiedCode === agent.referral_code ? "var(--green)" : "var(--indigo)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
                      >
                        {copiedCode === agent.referral_code ? "✓ Copied" : "Copy Link"}
                      </button>
                    </div>
                  )}

                  {/* Admin notes */}
                  {agent.admin_notes && (
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", padding: "8px 12px", background: "#FFFBEB", borderRadius: "var(--r-sm)", marginBottom: 12, borderLeft: "3px solid #FDE68A" }}>
                      📝 <strong>Note:</strong> {agent.admin_notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {agent.status !== "approved" && (
                      <button
                        onClick={() => openReview(agent, "approved")}
                        style={{ padding: "7px 16px", background: "var(--green-light)", color: "var(--green)", border: "1px solid var(--green-pale)", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}
                      >
                        ✅ Approve
                      </button>
                    )}
                    {agent.status !== "rejected" && (
                      <button
                        onClick={() => openReview(agent, "rejected")}
                        style={{ padding: "7px 16px", background: "var(--red-light)", color: "var(--red)", border: "1px solid var(--red-pale)", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}
                      >
                        ❌ Reject
                      </button>
                    )}
                    {agent.status !== "pending" && (
                      <button
                        onClick={() => openReview(agent, "approved")}
                        style={{ padding: "7px 16px", background: "#fff", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)" }}
                      >
                        📝 Edit Notes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        open={reviewModal}
        onClose={() => { setReviewModal(false); setSelected(null); }}
        title={reviewStatus === "approved" ? "✅ Approve Application" : "❌ Reject Application"}
        maxWidth={480}
      >
        {selected && (
          <>
            <div style={{ padding: "12px 14px", background: "var(--slate-50)", borderRadius: "var(--r-sm)", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{selected.full_name}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>{selected.city} · {selected.phone}</div>
            </div>

            {reviewStatus === "approved" && !selected.referral_code && (
              <div style={{ marginBottom: 16, padding: "12px 14px", background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: "var(--r-sm)", fontSize: 13, color: "#065F46" }}>
                🔗 A unique referral code will be automatically generated upon approval.
              </div>
            )}

            <FormGroup label="Admin Notes (optional)" hint="These notes are internal only — not shown to the applicant.">
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={4}
                placeholder={reviewStatus === "approved" ? "e.g. Strong candidate, good experience in Lahore area." : "e.g. Not enough experience at this time. May reapply in 3 months."}
                style={{
                  width: "100%", padding: "10px 13px", border: "1px solid var(--border-2)",
                  borderRadius: "var(--r-sm)", fontSize: 13.5, fontFamily: "var(--font)",
                  outline: "none", resize: "vertical", color: "var(--text-1)", lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </FormGroup>

            <ModalActions>
              <BtnSecondary type="button" onClick={() => { setReviewModal(false); setSelected(null); }}>Cancel</BtnSecondary>
              <BtnPrimary
                type="button"
                disabled={saving}
                onClick={handleReview}
                style={{ background: reviewStatus === "approved" ? "var(--green)" : "var(--red)" }}
              >
                {saving ? "Saving…" : reviewStatus === "approved" ? "Confirm Approval" : "Confirm Rejection"}
              </BtnPrimary>
            </ModalActions>
          </>
        )}
      </Modal>
    </DashboardShell>
  );
}

// Wrap in ToastProvider for standalone use
export default function PartnersPage() {
  return (
    <ToastProvider>
      <PartnersPageInner />
    </ToastProvider>
  );
}
