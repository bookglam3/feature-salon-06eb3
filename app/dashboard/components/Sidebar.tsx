"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    group: "Main",
    items: [
      { label: "Dashboard",    path: "/dashboard",              emoji: "◻" },
      { label: "Calendar",     path: "/dashboard/calendar",     emoji: "🗓️" },
      { label: "Bookings",     path: "/dashboard/bookings",     emoji: "📅" },
      { label: "Clients",      path: "/dashboard/clients",      emoji: "👤" },
      { label: "Staff",        path: "/dashboard/staff",        emoji: "✂️" },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Payments",     path: "/dashboard/payments",     emoji: "💳" },
      { label: "Reports",      path: "/dashboard/reports",      emoji: "📊" },
      { label: "Gift Cards",   path: "/dashboard/gift-cards",   emoji: "🎁" },
    ],
  },
  {
    group: "Engagement",
    items: [
      { label: "Reviews",      path: "/dashboard/reviews",      emoji: "⭐" },
      { label: "Client Portal", path: "/dashboard/client-portal", emoji: "🔐" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Settings",     path: "/dashboard/settings",     emoji: "⚙️" },
    ],
  },
];

interface SidebarProps {
  salonName?: string;
  onClose?: () => void;
  onLogout: () => void;
}

export default function Sidebar({ salonName, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  return (
    <aside style={{
      width: "var(--sidebar-w)", background: "#fff",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg,var(--indigo) 0%,var(--indigo-dark) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: "#fff", fontWeight: 800, letterSpacing: -0.5,
            boxShadow: "var(--shadow-indigo)",
          }}>f</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.6px" }}>feature</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: "var(--slate-100)", border: "none", cursor: "pointer", width: 26, height: 26, borderRadius: "50%", fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >✕</button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {NAV.map(group => (
          <div key={group.group}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: "1.2px", textTransform: "uppercase", padding: "12px 10px 4px" }}>
              {group.group}
            </div>
            {group.items.map(item => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: "var(--r-sm)",
                    fontSize: 13.5, fontWeight: active ? 600 : 500,
                    color: active ? "var(--indigo)" : "var(--text-2)",
                    background: active ? "var(--indigo-light)" : "transparent",
                    textDecoration: "none", marginBottom: 1,
                    transition: "all 0.12s",
                    borderLeft: active ? "2px solid var(--indigo)" : "2px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--slate-50)"; e.currentTarget.style.color = "var(--text-1)"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; } }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: "var(--r-sm)",
                    background: active ? "var(--indigo-pale)" : "var(--slate-100)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, flexShrink: 0,
                  }}>{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.2px" }}>
          {salonName || "Your Salon"}
        </div>
        <button
          onClick={onLogout}
          style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500, transition: "color 0.12s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
        >Sign out →</button>
      </div>
    </aside>
  );
}
