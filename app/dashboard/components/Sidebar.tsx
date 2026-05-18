"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { NAV_ICON_MAP, LogOutIcon } from "./DashboardIcons";
import type { LucideProps } from "lucide-react";

const SUPER_ADMIN_EMAIL = "adilgill2008@gmail.com";

// ─────────────────────────────────────────────────────────────────
// Section color themes per nav group
// ─────────────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, {
  grad: string;
  dimBg: string;
  glow: string;
  border: string;
  labelColor: string;
}> = {
  Main:       { grad: "linear-gradient(135deg,#7C3AED,#6D28D9)",  dimBg: "rgba(124,58,237,0.14)",  glow: "rgba(124,58,237,0.5)",  border: "#8B5CF6", labelColor: "rgba(167,139,250,0.6)" },
  Finance:    { grad: "linear-gradient(135deg,#059669,#10B981)",  dimBg: "rgba(5,150,105,0.14)",   glow: "rgba(5,150,105,0.5)",   border: "#34D399", labelColor: "rgba(52,211,153,0.6)" },
  Engagement: { grad: "linear-gradient(135deg,#2563EB,#6366F1)",  dimBg: "rgba(37,99,235,0.14)",   glow: "rgba(37,99,235,0.5)",   border: "#60A5FA", labelColor: "rgba(96,165,250,0.6)" },
  Content:    { grad: "linear-gradient(135deg,#DB2777,#EC4899)",  dimBg: "rgba(219,39,119,0.14)",  glow: "rgba(219,39,119,0.5)",  border: "#F472B6", labelColor: "rgba(244,114,182,0.6)" },
  System:     { grad: "linear-gradient(135deg,#475569,#64748B)",  dimBg: "rgba(71,85,105,0.14)",   glow: "rgba(71,85,105,0.4)",   border: "#94A3B8", labelColor: "rgba(148,163,184,0.5)" },
};

// ─────────────────────────────────────────────────────────────────
// Nav structure
// ─────────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "Main",
    items: [
      { label: "Dashboard",    path: "/dashboard" },
      { label: "Calendar",     path: "/dashboard/calendar" },
      { label: "Bookings",     path: "/dashboard/bookings" },
      { label: "Waitlist",     path: "/dashboard/waitlist" },
      { label: "Clients",      path: "/dashboard/clients" },
      { label: "Staff",        path: "/dashboard/staff" },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Payments",     path: "/dashboard/payments" },
      { label: "Earnings",     path: "/dashboard/earnings" },
      { label: "Tips",         path: "/dashboard/tips" },
      { label: "Invoices",     path: "/dashboard/invoices" },
      { label: "Reports",      path: "/dashboard/reports" },
      { label: "Gift Cards",   path: "/dashboard/gift-cards" },
    ],
  },
  {
    group: "Engagement",
    items: [
      { label: "Reviews",      path: "/dashboard/reviews" },
      { label: "Loyalty",      path: "/dashboard/loyalty" },
      { label: "Referrals",    path: "/dashboard/referrals" },
      { label: "Broadcast",    path: "/dashboard/broadcast" },
      { label: "Automations",  path: "/dashboard/automations" },
      { label: "Client Portal",path: "/dashboard/client-portal" },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Gallery",      path: "/dashboard/gallery" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Closed Dates", path: "/dashboard/closed-dates" },
      { label: "Partners",     path: "/dashboard/partners" },
      { label: "Settings",     path: "/dashboard/settings" },
    ],
  },
];

interface SidebarProps {
  salonName?: string;
  onClose?: () => void;
  onLogout: () => void;
  onMenuClick?: () => void;
}

type IconComp = React.FC<{ size?: number; className?: string; strokeWidth?: number }>;

export default function Sidebar({ salonName, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email ?? null);
    });
  }, []);

  const isAdmin = userEmail === SUPER_ADMIN_EMAIL;

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  const initials = (salonName || "S")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');

        .sb-wrap {
          width: 100%;
          max-width: var(--sidebar-w);
          background: linear-gradient(180deg,#0A0818 0%,#100F28 40%,#0D0C1E 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
          height: 100%; overflow: hidden;
          position: relative;
        }
        /* Ambient glow behind sidebar */
        .sb-wrap::before {
          content: "";
          position: absolute;
          top: 60px; left: -40px;
          width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }
        /* Glass nav link base */
        .sb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 5px 8px; border-radius: 11px;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.4);
          background: transparent;
          text-decoration: none; margin-bottom: 1px;
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          border: 1px solid transparent;
        }
        .sb-link:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.78);
          transform: translateX(2px);
          border-color: rgba(255,255,255,0.06);
        }
        .sb-link.active {
          background: rgba(139,92,246,0.1);
          color: #F1F5F9;
          font-weight: 700;
          border-color: rgba(139,92,246,0.12);
        }
        /* Icon box inside link */
        .sb-icon-box {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
        }
        .sb-link:hover .sb-icon-box {
          transform: scale(1.1);
        }
        /* Active dot */
        .sb-active-dot {
          width: 4px; height: 4px; border-radius: 50%;
          flex-shrink: 0; margin-left: auto;
          animation: sbDotPulse 2.4s ease-in-out infinite;
        }
        @keyframes sbDotPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.3); }
        }
        /* Group label */
        .sb-group-label {
          font-size: 9px; font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          padding: 14px 10px 5px;
          display: flex; align-items: center; gap: 8px;
        }
        .sb-group-label::after {
          content: ""; flex: 1; height: 1px;
          background: rgba(255,255,255,0.05);
        }
        /* Scroll area */
        .sb-nav-scroll {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 2px 8px;
          scrollbar-width: none;
          animation: sbSlideIn 0.24s cubic-bezier(0.4,0,0.2,1) both;
        }
        .sb-nav-scroll::-webkit-scrollbar { display: none; }
        @keyframes sbSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        /* Footer signout button */
        .sb-signout-btn {
          width: 100%; padding: 8px 12px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.38);
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.18s;
          font-family: var(--font);
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .sb-signout-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #FCA5A5;
          border-color: rgba(239,68,68,0.2);
        }
      `}</style>

      <aside className="sb-wrap">

        {/* ── Logo ── */}
        <div style={{
          padding: "18px 16px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* App logo mark — new brand SVG */}
            <div style={{
              width: 36, height: 36, borderRadius: 11, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 18px rgba(124,58,237,0.55)",
              flexShrink: 0, overflow: "hidden",
            }}>
              <Image
                src="/brand/logo-app-icon.svg"
                alt="Feature Salon"
                width={36}
                height={36}
                style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 11 }}
                priority
              />
              {/* Pulse ring */}
              <div style={{
                position: "absolute", inset: -3, borderRadius: 14,
                border: "1px solid rgba(139,92,246,0.45)",
                animation: "logoPulse 3s ease-in-out infinite",
                pointerEvents: "none",
              }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontFamily: "var(--font-inter, 'Inter', sans-serif)", fontWeight: 600, color: "#F1F5F9", letterSpacing: "-0.5px", lineHeight: 1 }}>feature</div>
              <div style={{ fontSize: 8.5, fontWeight: 600, color: "rgba(167,139,250,0.5)", letterSpacing: "2.5px", textTransform: "uppercase", marginTop: 3 }}>SALON OS</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer", width: 28, height: 28, borderRadius: 8,
              fontSize: 12, color: "rgba(255,255,255,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >✕</button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="sb-nav-scroll">
          {NAV.map(group => {
            const s = SECTION_COLORS[group.group] || SECTION_COLORS.System;
            return (
              <div key={group.group}>
                <div className="sb-group-label" style={{ color: s.labelColor }}>
                  {group.group}
                </div>
                {group.items
                  .filter(item => item.label !== "Partners" || isAdmin)
                  .map(item => {
                  const active = isActive(item.path);
                  const Icon = NAV_ICON_MAP[item.label] as IconComp | undefined;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={onClose}
                      className={`sb-link${active ? " active" : ""}`}
                      style={{
                        borderLeftColor: active ? s.border : "transparent",
                        borderLeft: `2px solid ${active ? s.border : "transparent"}`,
                      }}
                    >
                      {/* Icon box */}
                      <div
                        className="sb-icon-box"
                        style={{
                          background: active ? s.grad : s.dimBg,
                          boxShadow: active ? `0 0 12px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` : "none",
                          border: `1px solid ${active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)"}`,
                          color: active ? "#fff" : "rgba(255,255,255,0.45)",
                        }}
                      >
                        {Icon && (
                          <Icon
                            size={15}
                            strokeWidth={active ? 2 : 1.6}
                          />
                        )}
                      </div>

                      {/* Label */}
                      <span style={{ flex: 1, fontSize: 13, letterSpacing: "-0.1px" }}>{item.label}</span>

                      {/* Active indicator dot */}
                      {active && (
                        <div
                          className="sb-active-dot"
                          style={{
                            background: s.border,
                            boxShadow: `0 0 6px ${s.glow}`,
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
        }}>
          {/* Salon info card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            padding: "9px 10px", borderRadius: 11,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,#7C3AED,#4C1D95)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
              boxShadow: "0 2px 10px rgba(124,58,237,0.45)",
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 700, color: "#F1F5F9",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                letterSpacing: "-0.2px",
              }}>{salonName || "Your Salon"}</div>
              <div style={{
                fontSize: 10, color: "#10B981", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4, marginTop: 1,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#10B981", display: "inline-block",
                  boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                  animation: "logoPulse 2s ease-in-out infinite",
                }} />
                Active
              </div>
            </div>
          </div>

          <button onClick={onLogout} className="sb-signout-btn">
            <LogOutIcon size={13} strokeWidth={2} />
            Sign out
          </button>
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes logoPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50%       { opacity: 1;   transform: scale(1.06); }
          }
        `}</style>
      </aside>
    </>
  );
}
