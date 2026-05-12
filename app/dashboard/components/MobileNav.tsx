"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BOTTOM_NAV = [
  { label: "Home",     path: "/dashboard",          icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#6366F1" : "none"} stroke={active ? "#6366F1" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )},
  { label: "Bookings", path: "/dashboard/bookings",  icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#6366F1" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { label: "Clients",  path: "/dashboard/clients",   icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#6366F1" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { label: "Staff",    path: "/dashboard/staff",     icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#6366F1" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )},
  { label: "Settings", path: "/dashboard/settings",  icon: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#6366F1" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )},
];

export default function MobileNav() {
  const pathname = usePathname();
  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  return (
    <>
      <style>{`
        @media (min-width: 768px) { .mobile-nav-bar { display: none !important; } }
        .mobile-nav-bar {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(24px) saturate(200%);
          -webkit-backdrop-filter: blur(24px) saturate(200%);
          box-shadow: 0 -1px 0 rgba(0,0,0,0.06), 0 -8px 32px rgba(15,23,42,0.06);
          border-top: 1px solid rgba(226,232,240,0.8);
        }
        .mnav-item {
          position: relative; flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 4px; text-decoration: none;
          padding: 8px 4px 6px;
          transition: all 0.18s ease;
          min-width: 0;
          -webkit-tap-highlight-color: transparent; outline: none;
        }
        .mnav-item:active { transform: scale(0.88); }
        .mnav-icon-wrap {
          width: 36px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .mnav-item.active .mnav-icon-wrap {
          background: rgba(99,102,241,0.1);
          transform: translateY(-2px) scale(1.05);
        }
        .mnav-label {
          font-size: 9.5px; letter-spacing: 0.1px;
          white-space: nowrap; font-weight: 500;
          transition: all 0.15s;
        }
        .mnav-item.active .mnav-label {
          font-weight: 800; color: #6366F1;
        }
        .mnav-active-dot {
          position: absolute; bottom: 2px;
          width: 4px; height: 4px; border-radius: 50%;
          background: #6366F1; opacity: 0;
          transition: opacity 0.2s;
        }
        .mnav-item.active .mnav-active-dot { opacity: 1; }
      `}</style>
      <nav
        className="mobile-nav-bar"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 62, display: "flex", alignItems: "stretch",
          zIndex: 100,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {BOTTOM_NAV.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`mnav-item${active ? " active" : ""}`}
              style={{ color: active ? "#6366F1" : "#94A3B8" }}
            >
              <span className="mnav-icon-wrap">
                {item.icon(active)}
              </span>
              <span className="mnav-label">{item.label}</span>
              <span className="mnav-active-dot" />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
