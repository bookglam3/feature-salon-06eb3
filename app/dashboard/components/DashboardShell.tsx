"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { ToastProvider } from "./Toast";

interface DashboardShellProps {
  children: React.ReactNode;
  salonName?: string;
  topbar?: React.ReactNode;
}

export default function DashboardShell({ children, salonName, topbar }: DashboardShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [subPlan, setSubPlan] = useState<string | null>(null);
  const [resolvedSalonName, setResolvedSalonName] = useState(salonName || "");

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    document.addEventListener("open-sidebar", handler);
    return () => document.removeEventListener("open-sidebar", handler);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: salon } = await supabase.from("salons")
        .select("subscription_status,subscription_plan,name")
        .eq("owner_id", user.id)
        .single();
      if (salon) {
        setSubStatus(salon.subscription_status);
        setSubPlan(salon.subscription_plan);
        if (!salonName && salon.name) setResolvedSalonName(salon.name);
      }
    })();
  }, [salonName]);

  return (
    <ToastProvider>
      <style>{`
        :root { --sidebar-w: 256px; }
        .ds-layout {
          display: flex; min-height: 100vh;
          background: #09090F;
        }

        /* ── Sidebar wrapper ── */
        .ds-sidebar-wrap {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 100vw; max-width: 100vw; z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.26s cubic-bezier(0.4,0,0.2,1);
          will-change: transform;
        }
        .ds-sidebar-wrap.open { transform: translateX(0); }

        /* ── Overlay ── */
        .ds-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 49;
        }
        .ds-overlay.open { display: block; animation: fadeOverlay 0.2s ease; }
        @keyframes fadeOverlay { from { opacity:0; } to { opacity:1; } }

        /* ── Main ── */
        .ds-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
        .ds-content {
          flex: 1; overflow-y: auto; background: #09090F;
          padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
          -webkit-overflow-scrolling: touch;
        }

        /* ── Desktop ── */
        @media (min-width: 768px) {
          .ds-sidebar-wrap {
            width: var(--sidebar-w);
            position: sticky; top: 0; height: 100vh;
            transform: none !important; flex-shrink: 0;
          }
          .ds-overlay { display: none !important; }
          .ds-content { padding-bottom: 0; }
        }

        /* ── Premium dark topbar ── */
        .ds-topbar {
          background: rgba(10,9,20,0.96);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0 20px; height: 58px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 30;
          gap: 12px;
        }
        .ds-topbar-search {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 7px 13px;
          flex: 1; max-width: 260px;
          transition: all 0.15s;
        }
        .ds-topbar-search:focus-within {
          border-color: #8B5CF6;
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
        }
        .ds-topbar-search input {
          background: none; border: none; outline: none;
          font-size: 13px; color: #F1F5F9;
          font-family: var(--font); width: 100%;
        }
        .ds-topbar-search input::placeholder { color: rgba(255,255,255,0.25); }
        @media (max-width: 480px) { .ds-topbar-search { display: none; } }

        .ds-notif-btn {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative; transition: all 0.15s;
          flex-shrink: 0;
        }
        .ds-notif-btn:hover {
          border-color: rgba(139,92,246,0.4);
          background: rgba(139,92,246,0.12);
        }
        .ds-notif-dot {
          position: absolute; top: 7px; right: 7px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #EF4444; border: 1.5px solid #09090F;
          box-shadow: 0 0 6px rgba(239,68,68,0.6);
        }
        .ds-avatar-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px 4px 5px;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          background: rgba(255,255,255,0.05); cursor: pointer;
          transition: all 0.15s; flex-shrink: 0;
        }
        .ds-avatar-chip:hover {
          border-color: rgba(139,92,246,0.35);
          background: rgba(139,92,246,0.08);
        }
        .ds-plan-badge {
          font-size: 9.5px; font-weight: 800; letter-spacing: 0.8px;
          text-transform: uppercase; padding: 3px 9px;
          border-radius: 99px; white-space: nowrap;
          background: rgba(139,92,246,0.15);
          color: #A78BFA;
          border: 1px solid rgba(139,92,246,0.25);
        }

        .hbtn { display: flex; }
        @media(min-width:768px){ .hbtn { display: none !important; } }
      `}</style>

      <div className="ds-layout">
        {/* Overlay */}
        <div className={`ds-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <div className={`ds-sidebar-wrap ${sidebarOpen ? "open" : ""}`}>
          <Sidebar
            salonName={resolvedSalonName || salonName}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>

        {/* Main area */}
        <div className="ds-main">
          {topbar ? topbar : (
            <PremiumTopBar
              onMenuClick={() => setSidebarOpen(true)}
              salonName={resolvedSalonName || salonName || ""}
              plan={subPlan}
            />
          )}

          {/* Subscription warning */}
          {(subStatus === "past_due" || subStatus === "cancelled") && (
            <div style={{
              background: subStatus === "cancelled"
                ? "rgba(239,68,68,0.1)"
                : "rgba(245,158,11,0.1)",
              borderBottom: `1px solid ${subStatus === "cancelled" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
              padding: "10px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: subStatus === "cancelled" ? "#FCA5A5" : "#FCD34D" }}>
                {subStatus === "cancelled"
                  ? "❌ Your subscription is cancelled — renew to keep accepting bookings."
                  : "⚠️ Payment failed — update billing to avoid interruption."}
              </span>
              <a href="/subscribe" style={{
                fontSize: 12, fontWeight: 700, color: "#fff",
                background: subStatus === "cancelled"
                  ? "linear-gradient(135deg,#DC2626,#991B1B)"
                  : "linear-gradient(135deg,#D97706,#92400E)",
                padding: "6px 16px", borderRadius: 8, textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: subStatus === "cancelled"
                  ? "0 4px 12px rgba(239,68,68,0.3)"
                  : "0 4px 12px rgba(245,158,11,0.3)",
              }}>Renew Now →</a>
            </div>
          )}

          <div className="ds-content fade-in">
            {children}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </ToastProvider>
  );
}

/* ── Premium Dark Topbar ── */
function PremiumTopBar({ onMenuClick, salonName, plan }: {
  onMenuClick: () => void;
  salonName: string;
  plan: string | null;
}) {
  const pathname = usePathname();
  const [searchVal, setSearchVal] = useState("");

  const pageTitle = (() => {
    const seg = pathname?.split("/").filter(Boolean).at(-1) || "dashboard";
    return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
  })();

  const initials = salonName
    ? salonName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "S";

  const planLabel = plan || "Starter";

  return (
    <header className="ds-topbar">
      {/* Left: hamburger + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <HamburgerBtn onClick={onMenuClick} />
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.4px", lineHeight: 1 }}>
          {pageTitle}
        </div>
      </div>

      {/* Center: Search */}
      <div className="ds-topbar-search">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.75" stroke="rgba(255,255,255,0.25)" strokeWidth="1.75"/>
          <path d="M13 13L17 17" stroke="rgba(255,255,255,0.25)" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
        <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Search anything…" />
        {searchVal && (
          <button onClick={() => setSearchVal("")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Right: plan + notif + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div className="ds-plan-badge">{planLabel}</div>

        {/* Notification bell */}
        <button className="ds-notif-btn" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="ds-notif-dot" />
        </button>

        {/* Avatar chip */}
        <div className="ds-avatar-chip" onClick={onMenuClick}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0,
            boxShadow: "0 2px 8px rgba(124,58,237,0.4)",
          }}>{initials}</div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#F1F5F9", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {salonName || "Salon"}
          </span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M3 4.5l3 3 3-3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </header>
  );
}

/* ── Hamburger Button ── */
export function HamburgerBtn({ onClick }: { onClick?: () => void }) {
  const handleClick = () => {
    if (onClick) { onClick(); return; }
    document.dispatchEvent(new CustomEvent("open-sidebar"));
  };
  return (
    <button
      className="hbtn"
      onClick={handleClick}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer", padding: 7, borderRadius: 9,
        display: "flex", flexDirection: "column", gap: 4,
        transition: "all 0.15s", alignItems: "center",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <span style={{ display: "block", width: 16, height: 1.5, background: "rgba(255,255,255,0.6)", borderRadius: 2 }} />
      <span style={{ display: "block", width: 12, height: 1.5, background: "rgba(255,255,255,0.6)", borderRadius: 2 }} />
      <span style={{ display: "block", width: 16, height: 1.5, background: "rgba(255,255,255,0.6)", borderRadius: 2 }} />
    </button>
  );
}
