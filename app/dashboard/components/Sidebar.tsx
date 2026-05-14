"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    group: "Main",
    items: [
      { label: "Dashboard",    path: "/dashboard",              emoji: "◻",   gradient: "linear-gradient(135deg,#7C3AED,#6D28D9)" },
      { label: "Calendar",     path: "/dashboard/calendar",     emoji: "🗓️",  gradient: "linear-gradient(135deg,#3B82F6,#6366F1)" },
      { label: "Bookings",     path: "/dashboard/bookings",     emoji: "📅",  gradient: "linear-gradient(135deg,#6366F1,#4338CA)" },
      { label: "Waitlist",     path: "/dashboard/waitlist",     emoji: "⏳",  gradient: "linear-gradient(135deg,#F59E0B,#EF4444)" },
      { label: "Clients",      path: "/dashboard/clients",      emoji: "👤",  gradient: "linear-gradient(135deg,#10B981,#059669)" },
      { label: "Staff",        path: "/dashboard/staff",        emoji: "✂️",  gradient: "linear-gradient(135deg,#8B5CF6,#6366F1)" },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Payments",     path: "/dashboard/payments",     emoji: "💳",  gradient: "linear-gradient(135deg,#10B981,#0EA5E9)" },
      { label: "Tips",         path: "/dashboard/tips",         emoji: "💸",  gradient: "linear-gradient(135deg,#F59E0B,#10B981)" },
      { label: "Invoices",     path: "/dashboard/invoices",     emoji: "🧾",  gradient: "linear-gradient(135deg,#475569,#334155)" },
      { label: "Reports",      path: "/dashboard/reports",      emoji: "📊",  gradient: "linear-gradient(135deg,#6366F1,#10B981)" },
      { label: "Gift Cards",   path: "/dashboard/gift-cards",   emoji: "🎁",  gradient: "linear-gradient(135deg,#EF4444,#F59E0B)" },
    ],
  },
  {
    group: "Engagement",
    items: [
      { label: "Reviews",      path: "/dashboard/reviews",      emoji: "⭐",  gradient: "linear-gradient(135deg,#F59E0B,#EF4444)" },
      { label: "Loyalty",      path: "/dashboard/loyalty",      emoji: "🏆",  gradient: "linear-gradient(135deg,#F59E0B,#F97316)" },
      { label: "Referrals",    path: "/dashboard/referrals",    emoji: "🔗",  gradient: "linear-gradient(135deg,#3B82F6,#6366F1)" },
      { label: "Broadcast",    path: "/dashboard/broadcast",    emoji: "📢",  gradient: "linear-gradient(135deg,#8B5CF6,#EC4899)" },
      { label: "Automations",  path: "/dashboard/automations",  emoji: "🤖",  gradient: "linear-gradient(135deg,#0EA5E9,#6366F1)" },
      { label: "Client Portal",path: "/dashboard/client-portal",emoji: "🔐",  gradient: "linear-gradient(135deg,#475569,#6366F1)" },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Gallery",      path: "/dashboard/gallery",      emoji: "📸",  gradient: "linear-gradient(135deg,#EC4899,#8B5CF6)" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Closed Dates", path: "/dashboard/closed-dates", emoji: "🚫",  gradient: "linear-gradient(135deg,#EF4444,#DC2626)" },
      { label: "Partners",     path: "/dashboard/partners",     emoji: "🤝",  gradient: "linear-gradient(135deg,#10B981,#6366F1)" },
      { label: "Settings",     path: "/dashboard/settings",     emoji: "⚙️",  gradient: "linear-gradient(135deg,#64748B,#475569)" },
    ],
  },
];

interface SidebarProps {
  salonName?: string;
  onClose?: () => void;
  onLogout: () => void;
  onMenuClick?: () => void;
}

export default function Sidebar({ salonName, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
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
        .sb-wrap {
          width: 100%;
          max-width: var(--sidebar-w);
          background: linear-gradient(180deg,#0F0B2D 0%,#130F38 55%,#0D0D1A 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          height: 100%; overflow: hidden;
        }
        .sb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 10px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.45);
          background: transparent;
          text-decoration: none; margin-bottom: 1px;
          transition: background 0.15s, color 0.15s, transform 0.12s;
          position: relative; border-left: 2px solid transparent;
        }
        .sb-link:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75);
          transform: translateX(1px);
        }
        .sb-link.active {
          background: rgba(139,92,246,0.12);
          color: #F1F5F9;
          font-weight: 700;
          border-left-color: #8B5CF6;
          box-shadow: inset 0 0 0 1px rgba(139,92,246,0.08);
        }
        .sb-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0;
          background: rgba(255,255,255,0.05);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .sb-link.active .sb-icon {
          box-shadow: 0 0 10px rgba(139,92,246,0.4);
        }
        .sb-link:hover .sb-icon { transform: scale(1.1); }
        .sb-group-label {
          font-size: 9px; font-weight: 800;
          color: rgba(255,255,255,0.2); letter-spacing: 1.8px;
          text-transform: uppercase; padding: 14px 10px 5px;
          display: flex; align-items: center; gap: 8px;
        }
        .sb-group-label::after {
          content: ""; flex: 1; height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .sb-active-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #8B5CF6; flex-shrink: 0;
          box-shadow: 0 0 8px rgba(139,92,246,0.7);
        }
        @keyframes sbSlideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sb-nav-scroll { animation: sbSlideIn 0.22s ease both; }
        .sb-footer-btn {
          width: 100%; padding: 7px 12px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4);
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.15s; font-family: var(--font);
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .sb-footer-btn:hover {
          background: rgba(239,68,68,0.12);
          color: #FCA5A5;
          border-color: rgba(239,68,68,0.25);
        }
      `}</style>

      <aside className="sb-wrap">

        {/* ── Logo ── */}
        <div style={{
          padding: "18px 16px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Gradient logo mark */}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg,#7C3AED 0%,#6D28D9 50%,#4C1D95 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, color: "#fff", fontWeight: 900, letterSpacing: -0.5,
              boxShadow: "0 4px 16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}>f</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.6px", lineHeight: 1 }}>feature</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "1.8px", textTransform: "uppercase", marginTop: 2 }}>SALON OS</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
              width: 28, height: 28, borderRadius: "50%",
              fontSize: 12, color: "rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
            >✕</button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="sb-nav-scroll" style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "4px 8px",
          maxHeight: "calc(100vh - 140px)",
          scrollbarWidth: "none",
        }}>
          {NAV.map(group => (
            <div key={group.group}>
              <div className="sb-group-label">{group.group}</div>
              {group.items.map(item => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={`sb-link${active ? " active" : ""}`}
                  >
                    <span className="sb-icon" style={active ? {
                      background: item.gradient,
                    } : {}}>
                      {item.emoji}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && <span className="sb-active-dot" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            {/* Salon avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,#7C3AED,#4C1D95)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
              boxShadow: "0 2px 10px rgba(124,58,237,0.4)",
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
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.6)" }} />
                Active
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="sb-footer-btn">
            <span style={{ fontSize: 13 }}>→</span> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
