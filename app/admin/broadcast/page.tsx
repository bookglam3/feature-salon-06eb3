"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Channel      = "email" | "whatsapp" | "sms";
type RecipientType = "registered" | "all" | "custom";
type CountryCode   = "GB" | "PK" | "AE" | "SA";
type Tab           = "custom" | "registered" | "all";

interface BroadcastLog {
  id: string;
  subject: string;
  channels: Channel[];
  countries: string[];
  recipient_type: RecipientType;
  total_sent: number;
  total_failed: number;
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

// Variables that can be inserted into the message
const MSG_VARS: { tag: string; sample: string; desc: string }[] = [
  { tag: "{name}",       sample: "Sarah",       desc: "Recipient name" },
  { tag: "{salon_name}", sample: "Glow Studio",  desc: "Salon name" },
  { tag: "{link}",       sample: "featuresalon.co.uk/book/glow", desc: "Booking link" },
];

const NAV_ITEMS = [
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

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: "#ECFDF5", color: "#059669", label: "Success" },
  partial: { bg: "#FFFBEB", color: "#D97706", label: "Partial" },
  failed:  { bg: "#FEF2F2", color: "#DC2626", label: "Failed" },
  sending: { bg: "#EEF2FF", color: "#6366F1", label: "Sending" },
};

function isRTL(s: string): boolean {
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(s);
}

function applyVarSamples(text: string): string {
  return text
    .replace(/\{name\}/g,       "Sarah")
    .replace(/\{salon_name\}/g, "Glow Studio")
    .replace(/\{link\}/g,       "featuresalon.co.uk/book/glow");
}

function splitList(raw: string): string[] {
  return raw.split(/[\s,;\n]+/).map(x => x.trim()).filter(Boolean);
}

// ─── Tiny shared components ───────────────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, boxShadow: T.shadow, ...style }}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text2, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 6 }}>
    {children}
  </div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.7px", textTransform: "uppercase" as const, color: T.text3, padding: "11px 16px", textAlign: "left" as const, borderBottom: `1px solid ${T.border}`, background: T.bg }}>
    {children}
  </th>
);
const Td = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: "13px 16px", fontSize: 13.5, color: T.text, verticalAlign: "middle" as const, ...style }}>{children}</td>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BroadcastPage() {
  const router = useRouter();
  const msgRef = useRef<HTMLTextAreaElement>(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [authorised,  setAuthorised]  = useState(false);
  const [loggedInAs,  setLoggedInAs]  = useState<string | null>(null);

  // Audience tab
  const [tab, setTab] = useState<Tab>("registered");

  // Custom list inputs
  const [customEmails, setCustomEmails] = useState("");
  const [customPhones, setCustomPhones] = useState("");

  // Capabilities + data
  const [caps, setCaps]                   = useState({ email: true, sms: false, whatsapp: false });
  const [countsByCountry, setCountsByCountry] = useState<Record<string, number>>({});
  const [consentedTotal, setConsentedTotal]   = useState(0);
  const [totalUsers, setTotalUsers]           = useState(0);
  const [logs, setLogs]                   = useState<BroadcastLog[]>([]);
  const [logsLoading, setLogsLoading]     = useState(false);

  // Compose form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<Record<Channel, boolean>>({ email: true, whatsapp: false, sms: false });
  const [country,  setCountry]  = useState<"ALL" | CountryCode>("ALL");

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending,     setSending]     = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      setLoggedInAs(user?.email ?? null);
      if (!user || user.email !== ADMIN_EMAIL) {
        setAuthChecked(true);
        return;
      }
      setAuthorised(true);
      setAuthChecked(true);
    })();
  }, [router]);

  // ── Load capabilities + logs ───────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/broadcast", { headers: { Authorization: `Bearer ${token}` } });
      const json: CapabilitiesResponse = await res.json();
      if (res.ok) {
        setCaps(json.capabilities || { email: false, sms: false, whatsapp: false });
        setCountsByCountry(json.countsByCountry || {});
        setConsentedTotal(json.consentedTotal || 0);
        setTotalUsers(json.totalUsers || 0);
        setLogs(json.logs || []);
        setChannels(prev => {
          const next = { ...prev };
          if (!json.capabilities.email)    next.email    = false;
          if (!json.capabilities.sms)      next.sms      = false;
          if (!json.capabilities.whatsapp) next.whatsapp = false;
          if (!next.email && !next.sms && !next.whatsapp) {
            if (json.capabilities.email)         next.email    = true;
            else if (json.capabilities.sms)      next.sms      = true;
            else if (json.capabilities.whatsapp) next.whatsapp = true;
          }
          return next;
        });
      }
    } catch (e) { console.error("[broadcast] loadAll", e); }
    finally     { setLogsLoading(false); }
  }, []);

  useEffect(() => { if (authorised) loadAll(); }, [authorised, loadAll]);

  // ── Insert variable tag at cursor ──────────────────────────────────────────
  const insertVar = (tag: string) => {
    const el = msgRef.current;
    if (!el) { setMessage(m => m + tag); return; }
    const start = el.selectionStart ?? message.length;
    const end   = el.selectionEnd   ?? message.length;
    const next  = message.slice(0, start) + tag + message.slice(end);
    setMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  // ── Progress bar animation ─────────────────────────────────────────────────
  const startProgress = () => {
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      // advance quickly at first, then slow down near 90%
      p += p < 40 ? 8 : p < 70 ? 4 : p < 85 ? 1.5 : 0.3;
      if (p >= 90) { clearInterval(interval); p = 90; }
      setProgress(Math.min(p, 90));
    }, 300);
    return interval;
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateForm = (): string | null => {
    if (!subject.trim()) return "Subject is required.";
    if (!message.trim()) return "Message body is required.";
    const picked = (Object.keys(channels) as Channel[]).filter(c => channels[c]);
    if (picked.length === 0) return "Pick at least one channel.";
    if (tab === "custom") {
      const emails = splitList(customEmails);
      const phones = splitList(customPhones);
      if (emails.length === 0 && phones.length === 0) return "Enter at least one email or phone number.";
    }
    return null;
  };

  const handleAskConfirm = () => {
    setFeedback(null);
    const err = validateForm();
    if (err) { setFeedback({ kind: "error", text: err }); return; }
    setShowConfirm(true);
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setFeedback(null);

    const progressInterval = startProgress();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const picked = (Object.keys(channels) as Channel[]).filter(c => channels[c]);

      const body: Record<string, unknown> = {
        subject: subject.trim(),
        message: message.trim(),
        channels: picked,
        recipientType: tab === "custom" ? "custom" : tab === "all" ? "all" : "registered",
        countries:     tab === "registered" && country !== "ALL" ? [country] : ["ALL"],
      };
      if (tab === "custom") {
        body.customEmails = customEmails;
        body.customPhones = customPhones;
      }

      const res  = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setSending(false);
        setProgress(0);
      }, 800);

      if (!res.ok) {
        setFeedback({ kind: "error", text: json.error || "Send failed." });
      } else {
        const breakdown = (json.perChannel || [])
          .map((r: { channel: string; sent: number; failed: number }) =>
            `${r.channel}: ${r.sent} sent${r.failed ? `, ${r.failed} failed` : ""}`)
          .join(" · ");
        setFeedback({ kind: "success", text: `✓ Sent to ${json.totalRecipients} recipients — ${breakdown}` });
        setSubject("");
        setMessage("");
        setCustomEmails("");
        setCustomPhones("");
        loadAll();
      }
    } catch (e) {
      clearInterval(progressInterval);
      setSending(false);
      setProgress(0);
      setFeedback({ kind: "error", text: (e as Error).message || "Network error." });
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  // ── Derived ────────────────────────────────────────────────────────────────
  const targetAudience = useMemo(() => {
    if (tab === "all")    return totalUsers;
    if (tab === "custom") return Math.max(splitList(customEmails).length, splitList(customPhones).length);
    if (country === "ALL") return consentedTotal;
    return countsByCountry[country] || 0;
  }, [tab, country, totalUsers, consentedTotal, countsByCountry, customEmails, customPhones]);

  const pickedChannels = useMemo(
    () => (Object.keys(channels) as Channel[]).filter(c => channels[c]),
    [channels]
  );
  const anyChannel    = caps.email || caps.sms || caps.whatsapp;
  const msgIsRTL      = useMemo(() => isRTL(message) || isRTL(subject), [message, subject]);
  const previewMsg    = useMemo(() => applyVarSamples(message), [message]);
  const previewSubject = useMemo(() => applyVarSamples(subject), [subject]);
  const charCount     = message.length;

  // ── Loading / auth screens ─────────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: T.nav, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: T.indigo, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>LOADING</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!authorised) return (
    <div style={{ minHeight: "100vh", background: T.nav, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif" }}>
      <div style={{ fontSize: 36 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Access Denied</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 340 }}>
        Currently logged in as: <strong style={{ color: "#F59E0B" }}>{loggedInAs || "not logged in"}</strong><br/>
        Required: <strong style={{ color: "#10B981" }}>{ADMIN_EMAIL}</strong>
      </div>
      <a href="/login" style={{ marginTop: 8, padding: "10px 24px", borderRadius: 10, background: "#6366F1", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
        Login with correct account →
      </a>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes progressPulse{0%,100%{opacity:1}50%{opacity:0.7}}
        .tab-content{animation:fadeUp 0.25s ease both}
        .nav-item{transition:all 0.15s;cursor:pointer;text-decoration:none}
        .nav-item:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important}
        input,textarea,select{font-family:inherit}
        input:focus,textarea:focus,select:focus{border-color:${T.indigo}!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1)!important;outline:none}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        .chip{cursor:pointer;transition:all 0.12s;user-select:none}
        .chip:hover{border-color:${T.indigo}!important;background:${T.indigoSoft}!important;color:${T.indigo}!important}
        .row-hover:hover td{background:#F8FAFC!important}
        .ch-btn{transition:all 0.15s;cursor:pointer;user-select:none}
      `}</style>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{ width: 232, minHeight: "100vh", background: T.nav, flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${T.navBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: T.indigo, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 800 }}>F</div>
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
              <a key={item.key} href={item.href} className="nav-item" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                color: active ? T.navActive : T.navText,
                background: active ? "rgba(99,102,241,0.18)" : "transparent",
                fontSize: 13.5, fontWeight: active ? 600 : 500, position: "relative",
              }}>
                {active && <div style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: T.indigo, borderRadius: "0 3px 3px 0" }} />}
                <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ padding: "14px 10px", borderTop: `1px solid ${T.navBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 32/3, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>A</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Adil Gill</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Super Admin</div>
            </div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 13, padding: 4 }} title="Sign out">⏻</button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Header */}
        <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 0 #E2E8F0" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: "-0.3px" }}>Broadcast Notifications</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>Send messages to registered users, all users, or a custom list</div>
          </div>
        </header>

        {/* Progress bar — appears during send */}
        {sending && (
          <div style={{ height: 3, background: T.bg, position: "relative", zIndex: 20 }}>
            <div style={{
              position: "absolute", left: 0, top: 0, height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg,${T.indigo},#8B5CF6)`,
              transition: "width 0.3s ease",
              animation: "progressPulse 1.5s ease-in-out infinite",
            }} />
          </div>
        )}

        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>

            {/* Feedback */}
            {feedback && (
              <div style={{
                padding: "12px 16px", borderRadius: 10, fontSize: 13,
                background: feedback.kind === "success" ? T.greenSoft : T.redSoft,
                border: `1px solid ${feedback.kind === "success" ? "#A7F3D0" : "#FECACA"}`,
                color: feedback.kind === "success" ? "#065F46" : "#991B1B",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {feedback.text}
                <button onClick={() => setFeedback(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}>×</button>
              </div>
            )}

            {/* No channel warning */}
            {!anyChannel && (
              <Card style={{ background: T.amberSoft, borderColor: "#FDE68A" }}>
                <div style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>
                  ⚠ No messaging channels configured. Set RESEND_API_KEY or Twilio env vars to enable channels.
                </div>
              </Card>
            )}

            {/* ── Audience Tabs ─────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, width: "fit-content" }}>
              {([
                { key: "custom",     icon: "📋", label: "Custom List",      desc: "Paste emails / phones" },
                { key: "registered", icon: "👥", label: "Registered Users", desc: `${consentedTotal} with consent` },
                { key: "all",        icon: "⚡", label: "All Users",        desc: `${totalUsers} total` },
              ] as { key: Tab; icon: string; label: string; desc: string }[]).map(t => {
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{
                    padding: "9px 16px", borderRadius: 9, border: "none",
                    background: active ? T.indigo : "transparent",
                    color: active ? "#fff" : T.text2,
                    fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1,
                  }}>
                    <span>{t.icon} {t.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, color: active ? "rgba(255,255,255,0.75)" : T.text3 }}>{t.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Custom List inputs ─────────────────────────────────────── */}
            {tab === "custom" && (
              <Card>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Custom Recipient List</div>
                  <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>Paste or type emails and/or phone numbers. Separate by comma, space, or new line.</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <Label>Email Addresses</Label>
                    <textarea
                      value={customEmails}
                      onChange={e => setCustomEmails(e.target.value)}
                      rows={5}
                      placeholder={"jane@example.com\nbob@salon.co.uk\nanita@hair.com"}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 12.5, color: T.text, resize: "vertical", background: T.bg, fontFamily: "monospace" }}
                    />
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>
                      {splitList(customEmails).length} email{splitList(customEmails).length !== 1 ? "s" : ""} detected
                    </div>
                  </div>
                  <div>
                    <Label>Phone Numbers</Label>
                    <textarea
                      value={customPhones}
                      onChange={e => setCustomPhones(e.target.value)}
                      rows={5}
                      placeholder={"+447911123456\n+923001234567\n07700123456"}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 12.5, color: T.text, resize: "vertical", background: T.bg, fontFamily: "monospace" }}
                    />
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>
                      {splitList(customPhones).length} number{splitList(customPhones).length !== 1 ? "s" : ""} detected
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Registered tab — country breakdown ────────────────────── */}
            {tab === "registered" && (
              <Card>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Audience by Country</div>
                  <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>Only users with marketing consent. Click to filter.</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                  <button onClick={() => setCountry("ALL")} style={{ padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${country === "ALL" ? T.indigo : T.border}`, background: country === "ALL" ? T.indigoSoft : T.surface, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>All countries</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: country === "ALL" ? T.indigo : T.text, marginTop: 4 }}>{consentedTotal}</div>
                  </button>
                  {COUNTRY_META.map(c => {
                    const active = country === c.code;
                    return (
                      <button key={c.code} onClick={() => setCountry(c.code)} style={{ padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${active ? T.indigo : T.border}`, background: active ? T.indigoSoft : T.surface, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                        <div style={{ fontSize: 11, color: T.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}><span style={{ fontSize: 14, marginRight: 4 }}>{c.flag}</span>{c.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: active ? T.indigo : T.text, marginTop: 4 }}>{countsByCountry[c.code] || 0}</div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── All Users warning ──────────────────────────────────────── */}
            {tab === "all" && (
              <Card style={{ background: T.redSoft, borderColor: "#FECACA" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 22 }}>⚠</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#991B1B" }}>Admin Override — Sending to ALL {totalUsers} users</div>
                    <div style={{ fontSize: 12.5, color: "#7F1D1D", marginTop: 4, lineHeight: 1.6 }}>Marketing consent is ignored. Use only for critical platform announcements.</div>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Compose Form ───────────────────────────────────────────── */}
            <Card>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Compose Message</div>
                <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>Supports English, Urdu, Arabic. Use variables to personalise.</div>
              </div>

              {/* Country filter (registered only) */}
              {tab === "registered" && (
                <div style={{ marginBottom: 14 }}>
                  <Label>Country Filter</Label>
                  <select value={country} onChange={e => setCountry(e.target.value as "ALL" | CountryCode)} style={{ height: 40, padding: "0 12px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13.5, color: T.text, background: T.bg, width: 260, cursor: "pointer" }}>
                    <option value="ALL">All countries ({consentedTotal})</option>
                    {COUNTRY_META.map(c => <option key={c.code} value={c.code}>{c.flag} {c.label} ({countsByCountry[c.code] || 0})</option>)}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div style={{ marginBottom: 14 }}>
                <Label>Subject</Label>
                <input
                  type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Special offer just for you, {name}!"
                  dir={msgIsRTL ? "rtl" : "ltr"}
                  style={{ width: "100%", height: 42, padding: "0 14px", border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 13.5, color: T.text, background: T.bg }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <Label>Message Body</Label>
                  <div style={{ fontSize: 11, color: T.text3 }}>{charCount} chars</div>
                </div>
                <textarea
                  ref={msgRef}
                  value={message} onChange={e => setMessage(e.target.value)}
                  rows={7} placeholder={"Hi {name}, we have a special announcement from {salon_name}…"}
                  dir={msgIsRTL ? "rtl" : "ltr"}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13.5, color: T.text, resize: "vertical", background: T.bg, lineHeight: 1.6 }}
                />
              </div>

              {/* Variable chips */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, color: T.text3, fontWeight: 600 }}>Insert variable:</span>
                {MSG_VARS.map(v => (
                  <button key={v.tag} onClick={() => insertVar(v.tag)} className="chip" title={v.desc}
                    style={{ padding: "4px 10px", borderRadius: 99, border: `1px solid ${T.border}`, background: T.bg, fontSize: 12, color: T.text2, fontFamily: "monospace", cursor: "pointer", fontWeight: 600 }}>
                    {v.tag}
                  </button>
                ))}
                {msgIsRTL && <span style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginLeft: 4 }}>RTL detected</span>}
              </div>

              {/* Channels */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Label>Channels</Label>
                  {/* Select all button */}
                  <button onClick={() => {
                    const allOn = pickedChannels.length === Object.values(caps).filter(Boolean).length;
                    setChannels({ email: !allOn && caps.email, whatsapp: !allOn && caps.whatsapp, sms: !allOn && caps.sms });
                  }} style={{ height: 24, padding: "0 10px", borderRadius: 99, border: `1px solid ${T.border}`, background: "transparent", fontSize: 11, color: T.text2, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    {pickedChannels.length === Object.values(caps).filter(Boolean).length ? "Deselect all" : "Select all"}
                  </button>
                </div>
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
                        <button key={ch.key} onClick={() => setChannels(p => ({ ...p, [ch.key]: !p[ch.key] }))} className="ch-btn"
                          style={{ flex: "1 1 160px", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${on ? ch.color : T.border}`, background: on ? ch.soft : T.surface, display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" as const, cursor: "pointer" }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${on ? ch.color : T.text3}`, background: on ? ch.color : "transparent", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {on ? "✓" : ""}
                          </div>
                          <span style={{ fontSize: 17 }}>{ch.icon}</span>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: on ? ch.color : T.text }}>{ch.label}</span>
                        </button>
                      );
                    })
                  }
                  {!anyChannel && <div style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>No channels configured.</div>}
                </div>
              </div>

              {/* Action row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => setShowPreview(true)} disabled={!subject && !message}
                  style={{ height: 40, padding: "0 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  👁 Preview
                </button>
                <button onClick={handleAskConfirm} disabled={sending || !anyChannel}
                  style={{ height: 44, padding: "0 28px", borderRadius: 10, border: "none", background: sending ? T.text3 : T.indigo, color: "#fff", fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: sending ? 0.7 : 1, boxShadow: sending ? "none" : "0 6px 18px rgba(99,102,241,0.35)" }}>
                  {sending ? `Sending… ${Math.round(progress)}%` : `▶ Send Now${pickedChannels.length > 1 ? ` (${pickedChannels.length} channels)` : ""}`}
                </button>
                <div style={{ fontSize: 12, color: T.text3 }}>
                  ~<strong>{targetAudience}</strong> recipient{targetAudience !== 1 ? "s" : ""}
                </div>
              </div>
            </Card>

            {/* ── Broadcast Logs ─────────────────────────────────────────── */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Broadcast Logs</div>
                  <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>Last 200 broadcast attempts</div>
                </div>
                <button onClick={loadAll} style={{ height: 32, padding: "0 12px", borderRadius: 8, background: T.indigoSoft, border: "none", fontSize: 12, cursor: "pointer", color: T.indigo, fontWeight: 700, fontFamily: "inherit" }}>↻ Refresh</button>
              </div>
              {logsLoading ? (
                <div style={{ padding: 48, textAlign: "center", color: T.text3 }}>Loading…</div>
              ) : logs.length === 0 ? (
                <div style={{ padding: 56, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>◌</div>
                  <div style={{ fontSize: 14, color: T.text3 }}>No broadcasts sent yet</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Date", "Subject", "Countries", "Channels", "Sent", "Failed", "Status"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>
                      {logs.map(log => {
                        const meta = STATUS_META[log.status] || STATUS_META.success;
                        const countryLabel = (log.countries || []).map(c => {
                          if (c === "ALL") return "All";
                          const m = COUNTRY_META.find(x => x.code === c);
                          return m ? `${m.flag} ${m.label}` : c;
                        }).join(", ");
                        return (
                          <tr key={log.id} className="row-hover">
                            <Td style={{ color: T.text2, fontSize: 12.5, whiteSpace: "nowrap" }}>
                              {new Date(log.sent_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </Td>
                            <Td>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{log.subject}</div>
                              <div style={{ fontSize: 11, color: T.text3, textTransform: "capitalize" }}>{log.recipient_type}</div>
                            </Td>
                            <Td style={{ fontSize: 12, color: T.text2 }}>{countryLabel || "—"}</Td>
                            <Td>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {(log.channels || []).map(c => (
                                  <span key={c} style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: T.indigoSoft, color: T.indigo, textTransform: "uppercase" }}>{c}</span>
                                ))}
                              </div>
                            </Td>
                            <Td style={{ fontWeight: 700 }}>{log.total_sent}</Td>
                            <Td style={{ fontWeight: 700, color: log.total_failed ? T.red : T.text2 }}>{log.total_failed}</Td>
                            <Td>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: meta.bg, color: meta.color }}>{meta.label}</span>
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

      {/* ── Preview Modal ─────────────────────────────────────────────────── */}
      {showPreview && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,15,28,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.surface, borderRadius: 20, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", animation: "fadeUp 0.2s ease" }}>
            <div style={{ background: T.nav, borderRadius: "20px 20px 0 0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Message Preview</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Variables shown with sample values</div>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              {/* Rendered email-style preview */}
              <div style={{ background: "#F4F4F5", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <div style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", padding: "28px 22px", textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Feature Salon</div>
                  <div dir={msgIsRTL ? "rtl" : "ltr"} style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>
                    {previewSubject || <em style={{ opacity: 0.6 }}>(subject)</em>}
                  </div>
                </div>
                <div dir={msgIsRTL ? "rtl" : "ltr"} style={{ padding: 22, fontSize: 13.5, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#fff" }}>
                  {previewMsg || <em style={{ color: T.text3 }}>(message body)</em>}
                </div>
              </div>
              {/* Variable legend */}
              <div style={{ marginTop: 14, padding: "12px 14px", background: T.indigoSoft, borderRadius: 10, border: `1px solid #C7D2FE` }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: T.indigo, marginBottom: 8 }}>Variable substitution (sample values used above)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {MSG_VARS.map(v => (
                    <span key={v.tag} style={{ fontSize: 11.5, color: T.text2, fontFamily: "monospace" }}>
                      <strong>{v.tag}</strong> → &ldquo;{v.sample}&rdquo;
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: T.text3 }}>
                Channels: <strong>{pickedChannels.join(", ") || "none selected"}</strong> · Audience: <strong>~{targetAudience}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ────────────────────────────────────────────── */}
      {showConfirm && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 1001, background: "rgba(10,15,28,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.surface, borderRadius: 18, width: "100%", maxWidth: 460, boxShadow: "0 24px 80px rgba(0,0,0,0.2)", padding: 28, animation: "fadeUp 0.2s ease" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>{tab === "all" ? "⚠" : "📣"}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 8, textAlign: "center" }}>
              {tab === "all" ? "Send to ALL users?" : "Confirm broadcast?"}
            </div>
            <div style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.65, marginBottom: 20, textAlign: "center" }}>
              Sending to <strong>~{targetAudience}</strong> recipient{targetAudience !== 1 ? "s" : ""} via{" "}
              <strong>{pickedChannels.join(", ")}</strong>.{" "}
              {tab === "all" && <span style={{ color: T.red, fontWeight: 600 }}>Marketing consent ignored. </span>}
              This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text2, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={handleSend} style={{ flex: 1, height: 44, borderRadius: 10, border: "none", background: tab === "all" ? T.red : T.indigo, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Yes, Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
