"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BOTTOM_NAV = [
  { label: "Home",     path: "/dashboard",          emoji: "🏠" },
  { label: "Bookings", path: "/dashboard/bookings",  emoji: "📅" },
  { label: "Clients",  path: "/dashboard/clients",   emoji: "👤" },
  { label: "Staff",    path: "/dashboard/staff",     emoji: "✂️" },
  { label: "Settings", path: "/dashboard/settings",  emoji: "⚙️" },
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
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 0 -1px 0 rgba(0,0,0,0.07), 0 -8px 24px rgba(0,0,0,0.05);
        }
        .mnav-item {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          padding: 8px 4px 5px;
          transition: all 0.15s ease;
          min-width: 0;
          -webkit-tap-highlight-color: transparent;
          outline: none;
        }
        .mnav-item:active { transform: scale(0.9); }
        .mnav-dot {
          position: absolute;
          top: 5px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #6366F1;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .mnav-item.active .mnav-dot { opacity: 1; }
        .mnav-emoji {
          font-size: 20px;
          line-height: 1;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .mnav-item.active .mnav-emoji { transform: scale(1.18); }
        .mnav-label {
          font-size: 9.5px;
          letter-spacing: 0.1px;
          white-space: nowrap;
          transition: all 0.15s;
          font-weight: 500;
        }
        .mnav-item.active .mnav-label {
          font-weight: 700;
        }
      `}</style>
      <nav
        className="mobile-nav-bar"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 62,
          display: "flex", alignItems: "stretch",
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
              style={{
                color: active ? "#6366F1" : "#94A3B8",
              }}
            >
              <span className="mnav-dot" />
              <span className="mnav-emoji">{item.emoji}</span>
              <span className="mnav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
