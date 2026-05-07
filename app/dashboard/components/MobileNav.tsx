"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BOTTOM_NAV = [
  { label: "Home",     path: "/dashboard",          emoji: "◻" },
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
      `}</style>
      <nav
        className="mobile-nav-bar"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 64, background: "#fff",
          borderTop: "1px solid var(--border)",
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
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                textDecoration: "none",
                color: active ? "var(--indigo)" : "var(--text-3)",
                borderTop: active ? "2px solid var(--indigo)" : "2px solid transparent",
                transition: "all 0.12s",
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.emoji}</span>
              <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 400, letterSpacing: "0.2px", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
