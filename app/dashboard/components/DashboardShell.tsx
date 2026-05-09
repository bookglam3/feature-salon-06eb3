"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    document.addEventListener("open-sidebar", handler);
    return () => document.removeEventListener("open-sidebar", handler);
  }, []);

  return (
    <ToastProvider>
      <style>{`
        :root { --sidebar-w: 240px; }
        .ds-layout { display: flex; min-height: 100vh; background: var(--bg); }
        .ds-sidebar-wrap {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: var(--sidebar-w); z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.24s cubic-bezier(0.4,0,0.2,1);
          will-change: transform;
        }
        .ds-sidebar-wrap.open { transform: translateX(0); }
        .ds-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(15,23,42,0.4); backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 49;
          animation: fadeOverlay 0.2s ease;
        }
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
        .ds-overlay.open { display: block; }
        .ds-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
        .ds-content { flex: 1; overflow-y: auto; padding-bottom: 70px; }

        @media (min-width: 768px) {
          .ds-sidebar-wrap {
            position: sticky; top: 0; height: 100vh;
            transform: none !important; flex-shrink: 0;
          }
          .ds-overlay { display: none !important; }
          .ds-content { padding-bottom: 0; }
        }
      `}</style>

      <div className="ds-layout">
        {/* Sidebar overlay */}
        <div className={`ds-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <div className={`ds-sidebar-wrap ${sidebarOpen ? "open" : ""}`}>
          <Sidebar salonName={salonName} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* Main area */}
        <div className="ds-main">
          {/* Topbar slot — passed from page or default */}
          <div onClick={() => setSidebarOpen(true)} id="sidebar-trigger" style={{display:'none'}} />
          {topbar ? topbar : (
            <DefaultTopBar onMenuClick={() => setSidebarOpen(true)} />
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

/* ── Default topbar (pages can override with their own) ── */
function DefaultTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  return (
    <header style={{
      background: "#fff", borderBottom: "1px solid var(--border)",
      padding: "0 20px", height: 58,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HamburgerBtn onClick={onMenuClick} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.25px" }}>{greeting()} 👋</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 400 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </div>
    </header>
  );
}

export function HamburgerBtn({ onClick }: { onClick?: () => void }) {
  const handleClick = () => {
    if (onClick) { onClick(); return; }
    // Fallback: trigger sidebar via custom event
    document.dispatchEvent(new CustomEvent("open-sidebar"));
  };
  return (
    <>
      <style>{`@media(min-width:768px){.hbtn{display:none!important}}`}</style>
      <button
        className="hbtn"
        onClick={handleClick}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: "var(--r-sm)", display: "flex", flexDirection: "column", gap: 4.5, transition: "background 0.12s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--slate-100)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
      >
        <span style={{ display: "block", width: 18, height: 1.5, background: "var(--text-1)", borderRadius: 2 }} />
        <span style={{ display: "block", width: 18, height: 1.5, background: "var(--text-1)", borderRadius: 2 }} />
        <span style={{ display: "block", width: 18, height: 1.5, background: "var(--text-1)", borderRadius: 2 }} />
      </button>
    </>
  );
}

