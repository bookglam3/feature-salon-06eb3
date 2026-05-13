"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────
// Nav structure — grouped by section
// ─────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    group: "MAIN",
    items: [
      { label: "Dashboard",    path: "/dashboard",               icon: "⊞" },
      { label: "Calendar",     path: "/dashboard/calendar",      icon: "📅" },
      { label: "Bookings",     path: "/dashboard/bookings",      icon: "📋" },
      { label: "Waitlist",     path: "/dashboard/waitlist",      icon: "⏳" },
      { label: "Clients",      path: "/dashboard/clients",       icon: "👤" },
      { label: "Staff",        path: "/dashboard/staff",         icon: "👥" },
    ],
  },
  {
    group: "FINANCE",
    items: [
      { label: "Payments",     path: "/dashboard/payments",      icon: "💳" },
      { label: "Tips",         path: "/dashboard/tips",          icon: "💰" },
      { label: "Invoices",     path: "/dashboard/invoices",      icon: "🧾" },
      { label: "Reports",      path: "/dashboard/reports",       icon: "📊" },
      { label: "Gift Cards",   path: "/dashboard/gift-cards",    icon: "🎁" },
    ],
  },
  {
    group: "ENGAGEMENT",
    items: [
      { label: "Reviews",      path: "/dashboard/reviews",       icon: "⭐" },
      { label: "Loyalty",      path: "/dashboard/loyalty",       icon: "🏆" },
      { label: "Referrals",    path: "/dashboard/referrals",     icon: "🔗" },
      { label: "Broadcast",    path: "/dashboard/broadcast",     icon: "📢" },
      { label: "Automations",  path: "/dashboard/automations",   icon: "⚡" },
      { label: "Client Portal",path: "/dashboard/client-portal", icon: "🌐" },
    ],
  },
  {
    group: "CONTENT",
    items: [
      { label: "Gallery",      path: "/dashboard/gallery",       icon: "🖼️" },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Closed Dates", path: "/dashboard/closed-dates",  icon: "🚫" },
      { label: "Settings",     path: "/dashboard/settings",      icon: "⚙️" },
    ],
  },
];

// Flat list for mobile bottom nav — top 5 MAIN + Settings
const MOBILE_NAV = [
  { label: "Home",      path: "/dashboard",           icon: "⊞" },
  { label: "Calendar",  path: "/dashboard/calendar",  icon: "📅" },
  { label: "Bookings",  path: "/dashboard/bookings",  icon: "📋" },
  { label: "Clients",   path: "/dashboard/clients",   icon: "👤" },
  { label: "Staff",     path: "/dashboard/staff",     icon: "👥" },
  { label: "Settings",  path: "/dashboard/settings",  icon: "⚙️" },
];

const ACCENT = "#4F6EF7";
const ACCENT_BG = "#EEF2FF";

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

  // ── Mobile: horizontal bottom nav ──────────────────────────
  if (isMobile) {
    return (
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 64, backgroundColor: "#ffffff",
        borderTop: "0.5px solid #E8EAF0", zIndex: 100,
        overflowX: "auto", overflowY: "hidden",
        display: "flex", alignItems: "stretch",
        WebkitOverflowScrolling: "touch",
      }}>
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.path)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "0 14px", border: "none",
                backgroundColor: "transparent", cursor: "pointer",
                borderTop: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                color: active ? ACCENT : "#94A3B8",
                minWidth: 56, flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // ── Desktop: grouped sidebar ────────────────────────────────
  return (
    <aside style={{
      width: 240, minWidth: 240,
      height: "100vh", backgroundColor: "#ffffff",
      borderRight: "0.5px solid #E8EAF0",
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0,
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "0.5px solid #F1F5F9", flexShrink: 0 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#0F172A", letterSpacing: "-0.5px" }}>
          feature
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: "12px 8px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.group} style={{ marginTop: gi > 0 ? 12 : 0 }}>
            {/* Group header */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
              color: "#CBD5E1", padding: "4px 12px 6px",
              textTransform: "uppercase",
            }}>
              {group.group}
            </div>

            {/* Group items */}
            {group.items.map((item) => {
              const active = pathname === item.path ||
                (item.path !== "/dashboard" && pathname.startsWith(item.path));
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.path)}
                  title={item.label}
                  style={{
                    width: "100%", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", border: "none",
                    borderRadius: 8, cursor: "pointer",
                    backgroundColor: active ? ACCENT_BG : "transparent",
                    color: active ? ACCENT : "#475569",
                    fontSize: 13.5, fontWeight: active ? 600 : 500,
                    borderLeft: active ? `3px solid ${ACCENT}` : "3px solid transparent",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC";
                      (e.currentTarget as HTMLButtonElement).style.color = "#1E293B";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                    }
                  }}
                >
                  <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

