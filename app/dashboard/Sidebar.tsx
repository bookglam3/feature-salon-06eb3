"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────────
// SVG Icons — thin stroke (1.5px), 20×20 viewBox
// ─────────────────────────────────────────────────────────────────
const S = 1.5;

const Icons: Record<string, (props: { color?: string }) => React.JSX.Element> = {
  Dashboard:      ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke={color} strokeWidth={S}/><rect x="12" y="2" width="6" height="6" rx="1.5" stroke={color} strokeWidth={S}/><rect x="2" y="12" width="6" height="6" rx="1.5" stroke={color} strokeWidth={S}/><rect x="12" y="12" width="6" height="6" rx="1.5" stroke={color} strokeWidth={S}/></svg>,
  Calendar:       ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke={color} strokeWidth={S}/><path d="M7 2v3M13 2v3M2.5 8h15" stroke={color} strokeWidth={S} strokeLinecap="round"/><circle cx="7" cy="12" r="1" fill={color}/><circle cx="10" cy="12" r="1" fill={color}/><circle cx="13" cy="12" r="1" fill={color}/></svg>,
  Bookings:       ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke={color} strokeWidth={S}/><path d="M7 7h6M7 10h6M7 13h4" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Waitlist:       ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth={S}/><path d="M10 6v4l2.5 2.5" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Clients:        ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke={color} strokeWidth={S}/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Staff:          ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7.5" cy="7" r="3" stroke={color} strokeWidth={S}/><path d="M1.5 17c0-2.761 2.686-5 6-5" stroke={color} strokeWidth={S} strokeLinecap="round"/><circle cx="14" cy="7" r="3" stroke={color} strokeWidth={S}/><path d="M20 17c0-2.761-2.686-5-6-5" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Payments:       ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2" stroke={color} strokeWidth={S}/><path d="M2 9h16" stroke={color} strokeWidth={S}/><path d="M5 13h3M14 13h1" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Tips:           ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v1M10 17v1M4.22 4.22l.7.7M15.08 15.08l.7.7M2 10h1M17 10h1M4.22 15.78l.7-.7M15.08 4.92l.7-.7" stroke={color} strokeWidth={S} strokeLinecap="round"/><circle cx="10" cy="10" r="3.5" stroke={color} strokeWidth={S}/></svg>,
  Invoices:       ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth={S}/><path d="M13 2v4h4M7 9h6M7 12h4" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Reports:        ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17V11M7.5 17V7M12 17V10M16.5 17V4" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  "Gift Cards":   ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="8" width="16" height="10" rx="1.5" stroke={color} strokeWidth={S}/><path d="M2 11h16M10 8v10" stroke={color} strokeWidth={S}/><path d="M10 8C10 8 8 5.5 6.5 5.5a1.5 1.5 0 000 3H10M10 8c0 0 2-2.5 3.5-2.5a1.5 1.5 0 010 3H10" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Reviews:        ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.121 4.343L17 7.28l-3.5 3.395.826 4.782L10 13l-4.326 2.457.826-4.782L3 7.28l4.879-.937L10 2z" stroke={color} strokeWidth={S} strokeLinejoin="round"/></svg>,
  Loyalty:        ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17S3 13 3 7.5A4.5 4.5 0 0110 4.5 4.5 4.5 0 0117 7.5C17 13 10 17 10 17z" stroke={color} strokeWidth={S} strokeLinejoin="round"/></svg>,
  Referrals:      ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="4" cy="10" r="2.5" stroke={color} strokeWidth={S}/><circle cx="16" cy="5" r="2.5" stroke={color} strokeWidth={S}/><circle cx="16" cy="15" r="2.5" stroke={color} strokeWidth={S}/><path d="M6.5 10l7-5M6.5 10l7 5" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Broadcast:      ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7.5h5l3-4v12l-3-4H3V7.5z" stroke={color} strokeWidth={S} strokeLinejoin="round"/><path d="M14 6.5a4 4 0 010 7M16.5 4a7 7 0 010 12" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Automations:    ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M11 2L4 11h6l-1 7 7-9h-6l1-7z" stroke={color} strokeWidth={S} strokeLinejoin="round"/></svg>,
  "Client Portal":({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke={color} strokeWidth={S}/><path d="M2 10h16M10 2a12.5 12.5 0 000 16M10 2a12.5 12.5 0 010 16" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Gallery:        ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="2" stroke={color} strokeWidth={S}/><circle cx="7" cy="7" r="1.5" stroke={color} strokeWidth={S}/><path d="M2 14l4-4 3 3 3-3 4 4" stroke={color} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  "Closed Dates": ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="3.5" width="15" height="14" rx="2" stroke={color} strokeWidth={S}/><path d="M7 2v3M13 2v3M2.5 8h15M8 12l4 4M12 12l-4 4" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
  Settings:       ({ color = "#fff" }) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth={S}/><path d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.56 4.44l-1.06 1.06M5.5 14.5l-1.06 1.06M15.56 15.56l-1.06-1.06M5.5 5.5L4.44 4.44" stroke={color} strokeWidth={S} strokeLinecap="round"/></svg>,
};

// ─────────────────────────────────────────────────────────────────
// Section color config
// ─────────────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, { grad: string; glow: string; dimGrad: string; border: string }> = {
  MAIN:       { grad: "linear-gradient(135deg,#7C3AED,#A78BFA)", glow: "rgba(124,58,237,0.5)",  dimGrad: "rgba(124,58,237,0.18)", border: "rgba(124,58,237,0.8)" },
  FINANCE:    { grad: "linear-gradient(135deg,#059669,#34D399)", glow: "rgba(5,150,105,0.5)",   dimGrad: "rgba(5,150,105,0.18)", border: "rgba(5,150,105,0.8)" },
  ENGAGEMENT: { grad: "linear-gradient(135deg,#2563EB,#60A5FA)", glow: "rgba(37,99,235,0.5)",   dimGrad: "rgba(37,99,235,0.18)", border: "rgba(37,99,235,0.8)" },
  CONTENT:    { grad: "linear-gradient(135deg,#DB2777,#F472B6)", glow: "rgba(219,39,119,0.5)",  dimGrad: "rgba(219,39,119,0.18)", border: "rgba(219,39,119,0.8)" },
  SYSTEM:     { grad: "linear-gradient(135deg,#475569,#94A3B8)", glow: "rgba(71,85,105,0.45)",  dimGrad: "rgba(71,85,105,0.18)", border: "rgba(71,85,105,0.7)" },
};

// ─────────────────────────────────────────────────────────────────
// Nav groups
// ─────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { group: "MAIN", items: [
    { label: "Dashboard",      path: "/dashboard" },
    { label: "Calendar",       path: "/dashboard/calendar" },
    { label: "Bookings",       path: "/dashboard/bookings" },
    { label: "Waitlist",       path: "/dashboard/waitlist" },
    { label: "Clients",        path: "/dashboard/clients" },
    { label: "Staff",          path: "/dashboard/staff" },
  ]},
  { group: "FINANCE", items: [
    { label: "Payments",       path: "/dashboard/payments" },
    { label: "Tips",           path: "/dashboard/tips" },
    { label: "Invoices",       path: "/dashboard/invoices" },
    { label: "Reports",        path: "/dashboard/reports" },
    { label: "Gift Cards",     path: "/dashboard/gift-cards" },
  ]},
  { group: "ENGAGEMENT", items: [
    { label: "Reviews",        path: "/dashboard/reviews" },
    { label: "Loyalty",        path: "/dashboard/loyalty" },
    { label: "Referrals",      path: "/dashboard/referrals" },
    { label: "Broadcast",      path: "/dashboard/broadcast" },
    { label: "Automations",    path: "/dashboard/automations" },
    { label: "Client Portal",  path: "/dashboard/client-portal" },
  ]},
  { group: "CONTENT", items: [
    { label: "Gallery",        path: "/dashboard/gallery" },
  ]},
  { group: "SYSTEM", items: [
    { label: "Closed Dates",   path: "/dashboard/closed-dates" },
    { label: "Settings",       path: "/dashboard/settings" },
  ]},
];

const MOBILE_NAV = [
  { label: "Dashboard",  path: "/dashboard",           group: "MAIN" },
  { label: "Calendar",   path: "/dashboard/calendar",  group: "MAIN" },
  { label: "Bookings",   path: "/dashboard/bookings",  group: "MAIN" },
  { label: "Clients",    path: "/dashboard/clients",   group: "MAIN" },
  { label: "Staff",      path: "/dashboard/staff",     group: "MAIN" },
  { label: "Settings",   path: "/dashboard/settings",  group: "SYSTEM" },
];

// ─────────────────────────────────────────────────────────────────
// Icon box
// ─────────────────────────────────────────────────────────────────
function IconBox({ label, group, active }: { label: string; group: string; active: boolean }) {
  const c = SECTION_COLORS[group];
  const Ico = Icons[label];
  const style: CSSProperties = {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: active ? c.grad : c.dimGrad,
    border: `1px solid ${active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.07)"}`,
    boxShadow: active ? `0 0 14px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
    transform: active ? "scale(1.05)" : "scale(1)",
    transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
  };
  return <div style={style}>{Ico ? <Ico color={active ? "#fff" : "rgba(255,255,255,0.55)"} /> : null}</div>;
}

// ─────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────
export default function DashboardSidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  // ── Mobile ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
        background: "rgba(15,11,45,0.96)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.09)",
        zIndex: 200, display: "flex", alignItems: "center",
        overflowX: "auto", overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
      }}>
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.path);
          const c = SECTION_COLORS[item.group];
          return (
            <button key={item.label} type="button" onClick={() => router.push(item.path)} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 3, padding: "0 10px", border: "none",
              backgroundColor: "transparent", cursor: "pointer",
              minWidth: 56, flexShrink: 0, flex: 1,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? c.grad : "rgba(255,255,255,0.05)",
                boxShadow: active ? `0 0 12px ${c.glow}` : "none",
                transition: "all 0.2s",
              }}>
                {Icons[item.label]?.({ color: active ? "#fff" : "rgba(255,255,255,0.38)" })}
              </div>
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 400,
                color: active ? "#fff" : "rgba(255,255,255,0.38)",
                whiteSpace: "nowrap", letterSpacing: "0.3px",
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // ── Desktop ─────────────────────────────────────────────────
  return (
    <aside style={{
      width: 248, minWidth: 248, height: "100vh",
      background: "linear-gradient(180deg,#0F0B2D 0%,#1a1040 45%,#0F172A 100%)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0,
      overflowY: "auto", overflowX: "hidden",
    }}>

      {/* Logo */}
      <div style={{
        padding: "24px 20px 18px", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          fontFamily: "Georgia, serif", fontSize: 22,
          color: "#fff", letterSpacing: "-0.5px",
          textShadow: "0 0 24px rgba(167,139,250,0.55)",
        }}>
          feature
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2, letterSpacing: "0.6px", textTransform: "uppercase" }}>
          Salon Management
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 10px 16px", display: "flex", flexDirection: "column" }}>
        {NAV_GROUPS.map((group, gi) => {
          const c = SECTION_COLORS[group.group];
          return (
            <div key={group.group} style={{ marginTop: gi > 0 ? 12 : 0 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "1.2px",
                color: "rgba(255,255,255,0.18)", padding: "2px 10px 7px",
                textTransform: "uppercase",
              }}>
                {group.group}
              </div>

              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => router.push(item.path)}
                    style={{
                      width: "100%", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 11,
                      padding: "5px 8px", borderRadius: 12, marginBottom: 1,
                      background: active ? "rgba(255,255,255,0.07)" : "transparent",
                      borderLeft: `2px solid ${active ? c.border : "transparent"}`,
                      boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <IconBox label={item.label} group={group.group} active={active} />
                    <span style={{
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      color: active ? "#fff" : "rgba(255,255,255,0.48)",
                      letterSpacing: "0.1px", transition: "color 0.15s",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1,
                    }}>
                      {item.label}
                    </span>
                    {active && (
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: c.grad, boxShadow: `0 0 7px ${c.glow}`,
                        flexShrink: 0,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer glass card */}
      <div style={{
        margin: "0 10px 14px",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, padding: "11px 14px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 4, letterSpacing: "0.5px" }}>
          FEATURE SALON
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.5 }}>
          v2.0 · UK Salon Platform
        </div>
      </div>
    </aside>
  );
}