"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ADMIN_EMAIL = "adilgill2008@gmail.com";

// ─── Design tokens (mirrors /admin styling) ───────────────────────────────────
const T = {
  bg: "#F6F8FC",
  surface: "#FFFFFF",
  nav: "#0A0F1C",
  navBorder: "rgba(255,255,255,0.07)",
  navText: "rgba(255,255,255,0.45)",
  navActive: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  text2: "#64748B",
  text3: "#94A3B8",
  indigo: "#6366F1",
  indigoSoft: "#EEF2FF",
  green: "#10B981",
  greenSoft: "#ECFDF5",
  amber: "#F59E0B",
  amberSoft: "#FFFBEB",
  red: "#EF4444",
  redSoft: "#FEF2F2",
  shadow: "0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)",
};

type Channel = "email" | "whatsapp" | "sms";
type RecipientType = "registered" | "all";
type CountryCode = "GB" | "PK" | "AE" | "SA";
type Tab = "registered" | "all";

interface BroadcastLog {
  id: string;
  subject: string;
  message: string;
  channels: Channel[];
  countries: string[];
  recipient_type: RecipientType;
  total_sent: number;
  total_failed: number;
  sent_by_admin_id: string | null;
  sent_at: string;
  status: "success" | "partial" | "failed" | "sending";
}

interface CapabilitiesResponse {
  capabilities: { email: boolean; sms: boolean; whatsapp: boolean };
  countsByCountry: Record<string, number>;
  consentedTotal: number;
  totalUsers: number;
  logs: BroadcastLog[];
}

const COUNTRY_META: { code: CountryCode; flag: string; label: string }[] = [
  { code: "GB", flag: "🇬🇧", label: "UK" },
  { code: "PK", flag: "🇵🇰", label: "Pakistan" },
  { code: "AE", flag: "🇦🇪", label: "UAE" },
  { code: "SA", flag: "🇸🇦", label: "Saudi Arabia" },
];

const NAV_ITEMS: { key: string; label: string; icon: string; href: string }[] = [
  { key: "overview",      label: "Overview",        icon: "▣", href: "/admin" },
  { key: "salons",        label: "Salons",          icon: "✂", href: "/admin" },
  { key: "revenue",       label: "Revenue",         icon: "₤", href: "/admin" },
  { key: "users",         label: "Users",           icon: "⊙", href: "/admin" },
  { key: "applications",  label: "Applications",    icon: "✦", href: "/admin" },
  { key: "verifications", label: "Verifications",   icon: "🪪", href: "/admin" },
  { key: "announcements", label: "Announcements",   icon: "◉", href: "/admin" },
  { key: "broadcast",     label: "Broadcast",       icon: "📣", href: "/admin/broadcast" },
  { key: "flags",         label: "Feature Flags",   icon: "⚑", href: "/admin" },
  { key: "settings",      label: "Settings",        icon: "◎", href: "/admin" },
];

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 16, padding: 20, boxShadow: T.shadow,
    ...style,
  }}>{children}</div>
);

const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 3,
    background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0,
  }}>{(name || "A").charAt(0).toUpperCase()}</div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th style={{
    fontSize: 11, fontWeight: 700, letterSpacing: "0.7px", textTransform: "uppercase",
    color: T.text3, padding: "11px 16px", textAlign: "left",
    borderBottom: `1px solid ${T.border}`, background: T.bg,
  }}>{children}</th>
);
const Td = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: "13px 16px", fontSize: 13.5, color: T.text, verticalAlign: "middle", ...style }}>{children}</td>
);

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: "#ECFDF5", color: "#059669", label: "Success" },
  partial: { bg: "#FFFBEB", color: "#D97706", label: "Partial" },
  failed:  { bg: "#FEF2F2", color: "#DC2626", label: "Failed" },
  sending: { bg: "#EEF2FF", color: "#6366F1", label: "Sending" },
};

// Detect Arabic/Urdu so we can flip the message preview to RTL
function isRTL(s: string): boolean {
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(s);
}

export default function BroadcastPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authorised,  setAuthorised]  = useState(false);
  const [loggedInAs,  setLoggedInAs]  = useState<string | null>(null);

  // Tab
  const [tab, setTab] = useState<Tab>("registered");

  // Capabilities + data
  const [caps, setCaps] = useState<CapabilitiesResponse["capabilities"]>({ email: true, sms: true, whatsapp: true });
  const [countsByCountry, setCountsByCountry] = useState<Record<string, number>>({});
  const [consentedTotal, setConsentedTotal]   = useState(0);
  const [totalUsers, setTotalUsers]           = useState(0);
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    email: true, whatsapp: false, sms: false,
  });
  // "ALL" or specific country
  const [country, setCountry] = useState<"ALL" | CountryCode>("ALL");

  // Modal / preview state
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // ── Auth gate ────
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setLoggedInAs(user?.email ?? null);
      if (!user || user.email !== ADMIN_EMAIL) {
        setAuthChecked(true); // show access-denied screen instead of silent redirect
        return;
      }
      setAuthorised(true);
      setAuthChecked(true);
    })();
  }, [router]);

  // ── Load capabilities + logs ────
  const loadAll = async () => {
    setLogsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/broadcast", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json: CapabilitiesResponse = await res.json();
      if (res.ok) {
        setCaps(json.capabilities || { email: false, sms: false, whatsapp: false });
        setCountsByCountry(json.countsByCountry || {});
        setConsentedTotal(json.consentedTotal || 0);
        setTotalUsers(json.totalUsers || 0);
        setLogs(json.logs || []);

        // Default channel selection to first available channel
        setChannels(prev => {
          const next = { ...prev };
          if (!json.capabilities.email)    next.email = false;
          if (!json.capabilities.sms)      next.sms = false;
          if (!json.capabilities.whatsapp) next.whatsapp = false;
          // Ensure at least one is on if any is available
          if (!next.email && !next.sms && !next.whatsapp) {
            if (json.capabilities.email)    next.email = true;
            else if (json.capabilities.sms) next.sms = true;
            else if (json.capabilities.whatsapp) next.whatsapp = true;
          }
          return next;
        });
      }
    } catch (e) {
      console.error("[broadcast] loadAll", e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { if (authorised) loadAll(); }, [authorised]);

  // ── Send confirmation handler ────
  const validateForm = (): string | null => {
    if (!subject.trim())  return "Subject is required.";
    if (!message.trim())  return "Message body is required.";
    const picked = (Object.keys(channels) as Channel[]).filter(c => channels[c]);
    if (picked.length === 0) return "Pick at least one channel.";
    return null;
  };

  const handleAskConfirm = () => {
    setFeedback(null);
    const err = validateForm();
    if (err) { setFeedback({ kind: "error", text: err }); return; }
    setShowConfirm(true);
  };

  // ── Actual send ────
  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setFeedback(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const picked = (Object.keys(channels) as Channel[]).filter(c => channels[c]);

      const recipientType: RecipientType = tab === "all" ? "all" : "registered";
      const countriesPayload: string[] = country === "ALL" ? ["ALL"] : [country];

      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          channels: picked,
          recipientType,
          countries: countriesPayload,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ kind: "error", text: json.error || "Send failed." });
      } else {
        const breakdown = (json.perChannel || [])
          .map((r: { channel: string; sent: number; failed: number }) =>
            `${r.channel}: ${r.sent} sent${r.failed ? `, ${r.failed} failed` : ""}`
          ).join(" · ");
        setFeedback({
          kind: "success",
          text: `Broadcast dispatched to ${json.totalRecipients} recipients — ${breakdown}`,
        });
        setSubject("");
        setMessage("");
        loadAll();
      }
    } catch (e) {
      setFeedback({ kind: "error", text: (e as Error).message || "Network error." });
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Derived: target audience size for confirmation modal
  const targetAudience = useMemo(() => {
    if (tab === "all") return totalUsers;
    if (country === "ALL") return consentedTotal;
    return countsByCountry[country] || 0;
  }, [tab, country, totalUsers, consentedTotal, countsByCountry]);

  const pickedChannels = useMemo(
    () => (Object.keys(channels) as Channel[]).filter(c => channels[c]),
    [channels]
  );
  const messageIsRTL = useMemo(() => isRTL(message) || isRTL(subject), [message, subject]);

  if (!authChecked) {
    return (
      <div style={{
        minHeight: "100vh", background: T.nav,
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid rgba(99,102,241,0.2)",
          borderTopColor: T.indigo, borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>LOADING</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authorised) return (
    <div style={{
      minHeight: "100vh", background: T.nav,
      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
      fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
    }}>
      <div style={{ fontSize: 36 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Access Denied</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 340 }}>
        This page requires the super admin account.<br/>
        Currently logged in as: <strong style={{ color: "#F59E0B" }}>{loggedInAs || "not logged in"}</strong><br/>
        Required: <strong style={{ color: "#10B981" }}>{ADMIN_EMAIL}</strong>
      </div>
      <a href="/login" style={{
        marginTop: 8, padding: "10px 24px", borderRadius: 10,
        background: "#6366F1", color: "#fff", textDecoration: "none",
        fontSize: 13, fontWeight: 700,
      }}>Login with correct account →</a>
    </div>
  );

  const anyChannel = caps.email || caps.sms || caps.whatsapp;

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, display: "flex",
      fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .tab-content{animation:fadeUp 0.25s ease both}
        .nav-item{transition:all 0.15s;cursor:pointer;text-decoration:none}
        .nav-item:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important}
        input{font-family:inherit}
        input:focus{border-color:${T.indigo}!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1)!important;outline:none}
        textarea{font-family:inherit}
        textarea:focus{border-color:${T.indigo}!important;outline:none}
        select{font-family:inherit;cursor:pointer;outline:none}
        select:focus{border-color:${T.indigo}!important}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        .channel-card{transition:all 0.15s;cursor:pointer;user-select:none}
        .row-hover:hover td{background:#F8FAFC!important}
      `}</style>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{
        width: 232, minHeight: "100vh", background: T.nav, flexShrink: 0,
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${T.navBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: T.indigo, borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff", fontWeight: 800, letterSpacing: -0.5,
            }}>F</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px" }}>feature</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 1 }}>Super Admin</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => {
            const active = item.key === "broadcast";
            return (
              <a key={item.key} className="nav-item" href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                  color: active ? T.navActive : T.navText,
                  background: active ? "rgba(99,102,241,0.18)" : "transparent",
                  fontSize: 13.5, fontWeight: active ? 600 : 500,
                  position: "relative",
                }}>
                {active && (
                  <div style={{
                    position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 20, background: T.indigo, borderRadius: "0 3px 3px 0",
                  }} />
                )}
                <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: "14px 10px", borderTop: `1px solid ${T.navBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8 }}>
            <Avatar name="A" size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Adil Gill</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Super Admin</div>
            </div>
            <button onClick={handleLogout} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.3)", fontSize: 13, padding: 4,
            }} title="Sign out">⏻</button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <header style={{
          background: T.surface, borderBottom: `1px solid ${T.border}`,
          padding: "0 24px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 0 #E2E8F0",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>Broadcast Notifications</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>Reach registered users by country, or write & send to everyone.</div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>

            {/* ── Feedback banner ─────────────────────────────────── */}
            {feedback && (
              <div style={{
                padding: "12px 16px", borderRadius: 10, fontSize: 13,
                background: feedback.kind === "success" ? T.greenSoft : T.redSoft,
                border: `1px solid ${feedback.kind === "success" ? "#A7F3D0" : "#FECACA"}`,
                color: feedback.kind === "success" ? "#065F46" : "#991B1B",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {feedback.kind === "success" ? "✓" : "⚠"} {feedback.text}
                <button onClick={() => setFeedback(null)} style={{
                  marginLeft: "auto", background: "none", border: "none",
                  cursor: "pointer", color: "inherit", fontSize: 16,
                }}>×</button>
              </div>
            )}

            {/* ── Capability warning ───────────────────────────────── */}
            {!anyChannel && (
              <Card style={{ background: T.amberSoft, borderColor: "#FDE68A" }}>
                <div style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>
                  No messaging channels are configured. Check that RESEND_API_KEY and/or Twilio keys are set in your environment.
                </div>
              </Card>
            )}

            {/* ── Tabs ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, width: "fit-content" }}>
              {([
                { key: "registered", label: "Registered Users",  desc: `${consentedTotal} eligible` },
                { key: "all",        label: "Write & Send (All)", desc: `${totalUsers} total` },
              ] as { key: Tab; label: string; desc: string }[]).map(t => {
                const active = tab === t.key;
                return (
                  <button key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      padding: "9px 16px", borderRadius: 9, border: "none",
                      background: active ? T.indigo : "transparent",
                      color: active ? "#fff" : T.text2,
                      fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                    }}>
                    <span>{t.label}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 500,
                      color: active ? "rgba(255,255,255,0.8)" : T.text3,
                    }}>{t.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* ── REGISTERED tab — country counts ─────────────────── */}
            {tab === "registered" && (
              <Card>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Audience by Country</div>
                  <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>
                    Counts only include registered users with <strong>marketing_consent = true</strong>.
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
                  <button
                    onClick={() => setCountry("ALL")}
                    style={{
                      padding: "14px 16px", borderRadius: 12,
                      border: `1.5px solid ${country === "ALL" ? T.indigo : T.border}`,
                      background: country === "ALL" ? T.indigoSoft : T.surface,
                      textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                    }}>
                    <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>All countries</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: country === "ALL" ? T.indigo : T.text, marginTop: 4 }}>
                      {consentedTotal}
                    </div>
                  </button>
                  {COUNTRY_META.map(c => {
                    const active = country === c.code;
                    return (
                      <button key={c.code}
                        onClick={() => setCountry(c.code)}
                        style={{
                          padding: "14px 16px", borderRadius: 12,
                          border: `1.5px solid ${active ? T.indigo : T.border}`,
                          background: active ? T.indigoSoft : T.surface,
                          textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                        }}>
                        <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          <span style={{ fontSize: 14, marginRight: 6 }}>{c.flag}</span>{c.label}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: active ? T.indigo : T.text, marginTop: 4 }}>
                          {countsByCountry[c.code] || 0}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── ALL tab — warning ───────────────────────────────── */}
            {tab === "all" && (
              <Card style={{ background: T.redSoft, borderColor: "#FECACA" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 22 }}>⚠</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#991B1B" }}>Sending to ALL users — admin override</div>
                    <div style={{ fontSize: 12.5, color: "#7F1D1D", marginTop: 4, lineHeight: 1.6 }}>
                      Marketing consent is ignored for this tab. This bypass should only be used for
                      critical platform announcements (security incidents, outages, legal notices).
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Compose form ────────────────────────────────────── */}
            <Card>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: "-0.2px" }}>Compose</div>
                <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>
                  Supports English, Urdu, Arabic — RTL is applied automatically when needed.
                </div>
              </div>

              {/* Country filter (registered tab only) */}
              {tab === "registered" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    Country filter
                  </label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value as "ALL" | CountryCode)}
                    style={{
                      width: 280, height: 40, padding: "0 12px",
                      border: `1px solid ${T.border}`, borderRadius: 9,
                      fontSize: 13.5, color: T.text, background: T.bg,
                    }}>
                    <option value="ALL">All countries ({consentedTotal})</option>
                    {COUNTRY_META.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.label} ({countsByCountry[c.code] || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. New feature released this week"
                  dir={messageIsRTL ? "rtl" : "ltr"}
                  style={{
                    width: "100%", height: 40, padding: "0 14px",
                    border: `1px solid ${T.border}`, borderRadius: 9,
                    fontSize: 13.5, color: T.text, background: T.bg,
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={7}
                  placeholder="Write your announcement here…"
                  dir={messageIsRTL ? "rtl" : "ltr"}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: `1px solid ${T.border}`, fontSize: 13.5, color: T.text,
                    resize: "vertical", background: T.bg, lineHeight: 1.6,
                  }}
                />
                <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>
                  {messageIsRTL ? "RTL detected — preview will render right-to-left." : "Plain text. Use blank lines for paragraphs."}
                </div>
              </div>

              {/* Channels — only show those configured in env */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                  Channels
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {([
                    { key: "email",    label: "Email",    icon: "✉",  color: T.indigo, soft: T.indigoSoft, enabled: caps.email },
                    { key: "whatsapp", label: "WhatsApp", icon: "💬", color: T.green,  soft: T.greenSoft,  enabled: caps.whatsapp },
                    { key: "sms",      label: "SMS",      icon: "📱", color: T.amber,  soft: T.amberSoft,  enabled: caps.sms },
                  ] as { key: Channel; label: string; icon: string; color: string; soft: string; enabled: boolean }[])
                  .filter(ch => ch.enabled)
                  .map(ch => {
                    const on = channels[ch.key];
                    return (
                      <button key={ch.key}
                        onClick={() => setChannels(p => ({ ...p, [ch.key]: !p[ch.key] }))}
                        className="channel-card"
                        style={{
                          flex: "1 1 180px", padding: "12px 14px", borderRadius: 12,
                          border: `1.5px solid ${on ? ch.color : T.border}`,
                          background: on ? ch.soft : T.surface,
                          display: "flex", alignItems: "center", gap: 10,
                          fontFamily: "inherit", textAlign: "left",
                        }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5,
                          border: `1.5px solid ${on ? ch.color : T.text3}`,
                          background: on ? ch.color : "transparent",
                          color: "#fff", fontSize: 12, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{on ? "✓" : ""}</div>
                        <span style={{ fontSize: 18 }}>{ch.icon}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: on ? ch.color : T.text }}>{ch.label}</span>
                      </button>
                    );
                  })}
                  {!anyChannel && (
                    <div style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>No channels available.</div>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={!subject.trim() && !message.trim()}
                  style={{
                    height: 40, padding: "0 18px", borderRadius: 10,
                    border: `1px solid ${T.border}`, background: T.surface,
                    color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>
                  Preview
                </button>
                <button
                  onClick={handleAskConfirm}
                  disabled={sending || !anyChannel}
                  style={{
                    height: 44, padding: "0 24px", borderRadius: 10, border: "none",
                    background: sending ? T.text3 : T.indigo, color: "#fff",
                    fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer",
                    fontFamily: "inherit", opacity: sending ? 0.7 : 1,
                    boxShadow: sending ? "none" : "0 6px 18px rgba(99,102,241,0.35)",
                  }}>
                  {sending ? "Sending…" : `▶ Send Now${pickedChannels.length > 1 ? ` (${pickedChannels.length} channels)` : ""}`}
                </button>
                <div style={{ fontSize: 12, color: T.text3 }}>
                  Will reach approx <strong>{targetAudience}</strong> {targetAudience === 1 ? "user" : "users"}.
                </div>
              </div>
            </Card>

            {/* ── Logs ─────────────────────────────────────────────── */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Broadcast Logs</div>
                  <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>Most recent 200 broadcast attempts</div>
                </div>
                <button onClick={loadAll}
                  style={{
                    height: 32, padding: "0 12px", borderRadius: 8, background: T.indigoSoft,
                    border: "none", fontSize: 12, cursor: "pointer", color: T.indigo,
                    fontWeight: 700, fontFamily: "inherit",
                  }}>↻ Refresh</button>
              </div>

              {logsLoading ? (
                <div style={{ padding: 48, textAlign: "center", color: T.text3, fontSize: 14 }}>Loading logs…</div>
              ) : logs.length === 0 ? (
                <div style={{ padding: 56, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>◌</div>
                  <div style={{ fontSize: 14, color: T.text3, fontWeight: 500 }}>No broadcasts sent yet</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Date", "Subject", "Countries", "Channels", "Sent", "Failed", "Status"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {logs.map(log => {
                        const meta = STATUS_META[log.status] || STATUS_META.success;
                        const countryLabels = (log.countries || []).map(c => {
                          if (c === "ALL") return "All";
                          const m = COUNTRY_META.find(x => x.code === c);
                          return m ? `${m.flag} ${m.label}` : c;
                        }).join(", ");
                        return (
                          <tr key={log.id} className="row-hover">
                            <Td style={{ color: T.text2, fontSize: 12.5, whiteSpace: "nowrap" }}>
                              {new Date(log.sent_at).toLocaleString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </Td>
                            <Td>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{log.subject}</div>
                              <div style={{ fontSize: 11, color: T.text3 }}>
                                {log.recipient_type === "all" ? "All users (admin override)" : "Registered users"}
                              </div>
                            </Td>
                            <Td style={{ fontSize: 12, color: T.text2 }}>{countryLabels || "—"}</Td>
                            <Td>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {(log.channels || []).map(c => (
                                  <span key={c} style={{
                                    fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                                    background: T.indigoSoft, color: T.indigo, textTransform: "uppercase",
                                  }}>{c}</span>
                                ))}
                              </div>
                            </Td>
                            <Td style={{ fontWeight: 700 }}>{log.total_sent}</Td>
                            <Td style={{ fontWeight: 700, color: log.total_failed ? T.red : T.text2 }}>{log.total_failed}</Td>
                            <Td>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                                background: meta.bg, color: meta.color,
                              }}>{meta.label}</span>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* ── Preview modal ──────────────────────────────────────────────── */}
      {showPreview && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(10,15,28,0.6)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
          <div style={{
            background: T.surface, borderRadius: 20, width: "100%", maxWidth: 620,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
            animation: "fadeUp 0.2s ease",
          }}>
            <div style={{
              background: T.nav, borderRadius: "20px 20px 0 0",
              padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Preview</div>
              <button onClick={() => setShowPreview(false)} style={{
                background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8,
                padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 16,
              }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{
                background: "#F4F4F5", borderRadius: 12, overflow: "hidden",
                border: `1px solid ${T.border}`,
              }}>
                <div style={{
                  background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                  padding: "28px 22px", textAlign: "center",
                }}>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Feature Salon</div>
                  <div dir={messageIsRTL ? "rtl" : "ltr"} style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>
                    {subject || <em style={{ opacity: 0.6 }}>(subject)</em>}
                  </div>
                </div>
                <div dir={messageIsRTL ? "rtl" : "ltr"} style={{
                  padding: 22, fontSize: 13.5, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap",
                  background: "#fff",
                }}>
                  {message || <em style={{ color: T.text3 }}>(message body)</em>}
                </div>
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: T.text3 }}>
                Channels: <strong>{pickedChannels.join(", ") || "none"}</strong> · Audience: <strong>~{targetAudience}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation modal ─────────────────────────────────────────── */}
      {showConfirm && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1001,
            background: "rgba(10,15,28,0.6)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
          <div style={{
            background: T.surface, borderRadius: 18, width: "100%", maxWidth: 460,
            boxShadow: "0 24px 80px rgba(0,0,0,0.2)", padding: 24,
            animation: "fadeUp 0.2s ease",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 6 }}>
              {tab === "all" ? "Send to ALL users?" : "Send broadcast?"}
            </div>
            <div style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.6, marginBottom: 18 }}>
              Sending to <strong>~{targetAudience}</strong> user{targetAudience === 1 ? "" : "s"} in{" "}
              <strong>
                {tab === "all"
                  ? "all countries (admin override)"
                  : country === "ALL"
                  ? "all countries"
                  : COUNTRY_META.find(c => c.code === country)?.label || country}
              </strong>{" "}
              via <strong>{pickedChannels.join(", ")}</strong>. This cannot be undone. Continue?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{
                flex: 1, height: 42, borderRadius: 10, border: `1px solid ${T.border}`,
                background: T.surface, color: T.text2, fontSize: 13.5, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={handleSend} style={{
                flex: 1, height: 42, borderRadius: 10, border: "none",
                background: tab === "all" ? T.red : T.indigo, color: "#fff",
                fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Yes, Send Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
