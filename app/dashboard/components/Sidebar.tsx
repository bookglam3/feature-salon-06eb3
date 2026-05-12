"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    group: "Main",
    items: [
      { label: "Dashboard",    path: "/dashboard",              emoji: "◻",  gradient: "linear-gradient(135deg,#6366F1,#8B5CF6)" },
      { label: "Calendar",     path: "/dashboard/calendar",     emoji: "🗓️", gradient: "linear-gradient(135deg,#3B82F6,#6366F1)" },
      { label: "Bookings",     path: "/dashboard/bookings",     emoji: "📅", gradient: "linear-gradient(135deg,#6366F1,#4338CA)" },
      { label: "Waitlist",     path: "/dashboard/waitlist",     emoji: "⏳", gradient: "linear-gradient(135deg,#F59E0B,#EF4444)" },
      { label: "Clients",      path: "/dashboard/clients",      emoji: "👤", gradient: "linear-gradient(135deg,#10B981,#059669)" },
      { label: "Staff",        path: "/dashboard/staff",        emoji: "✂️", gradient: "linear-gradient(135deg,#8B5CF6,#6366F1)" },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Payments",     path: "/dashboard/payments",     emoji: "💳", gradient: "linear-gradient(135deg,#10B981,#0EA5E9)" },
      { label: "Tips",         path: "/dashboard/tips",         emoji: "💸", gradient: "linear-gradient(135deg,#F59E0B,#10B981)" },
      { label: "Invoices",     path: "/dashboard/invoices",     emoji: "🧾", gradient: "linear-gradient(135deg,#475569,#334155)" },
      { label: "Reports",      path: "/dashboard/reports",      emoji: "📊", gradient: "linear-gradient(135deg,#6366F1,#10B981)" },
      { label: "Gift Cards",   path: "/dashboard/gift-cards",   emoji: "🎁", gradient: "linear-gradient(135deg,#EF4444,#F59E0B)" },
    ],
  },
  {
    group: "Engagement",
    items: [
      { label: "Reviews",      path: "/dashboard/reviews",      emoji: "⭐", gradient: "linear-gradient(135deg,#F59E0B,#EF4444)" },
      { label: "Loyalty",      path: "/dashboard/loyalty",      emoji: "🏆", gradient: "linear-gradient(135deg,#F59E0B,#F97316)" },
      { label: "Referrals",    path: "/dashboard/referrals",    emoji: "🔗", gradient: "linear-gradient(135deg,#3B82F6,#6366F1)" },
      { label: "Broadcast",    path: "/dashboard/broadcast",    emoji: "📢", gradient: "linear-gradient(135deg,#8B5CF6,#EC4899)" },
      { label: "Automations",  path: "/dashboard/automations",  emoji: "🤖", gradient: "linear-gradient(135deg,#0EA5E9,#6366F1)" },
      { label: "Client Portal", path: "/dashboard/client-portal", emoji: "🔐", gradient: "linear-gradient(135deg,#475569,#6366F1)" },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Gallery",      path: "/dashboard/gallery",      emoji: "📸", gradient: "linear-gradient(135deg,#EC4899,#8B5CF6)" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Closed Dates", path: "/dashboard/closed-dates", emoji: "🚫", gradient: "linear-gradient(135deg,#EF4444,#DC2626)" },
      { label: "Partners",     path: "/dashboard/partners",     emoji: "🤝", gradient: "linear-gradient(135deg,#10B981,#6366F1)" },
      { label: "Settings",     path: "/dashboard/settings",     emoji: "⚙️", gradient: "linear-gradient(135deg,#64748B,#475569)" },
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

  // Derive initials for salon avatar
  const initials = (salonName || "S")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <style>{`
        .sb-link {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 10px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500;
          color: var(--text-2);
          background: transparent;
          text-decoration: none; margin-bottom: 1px;
          transition: background 0.15s, color 0.15s, transform 0.12s;
          position: relative;
        }
        .sb-link:hover {
          background: var(--slate-50);
          color: var(--text-1);
          transform: translateX(2px);
        }
        .sb-link.active {
          background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
          color: var(--indigo);
          font-weight: 700;
        }
        .sb-link.active::before {
          content: "";
          position: absolute; left: -8px; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: var(--indigo);
          border-radius: 0 3px 3px 0;
        }
        .sb-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; flex-shrink: 0;
          background: var(--slate-100);
          transition: transform 0.15s;
        }
        .sb-link.active .sb-icon {
          background: var(--indigo);
          filter: drop-shadow(0 2px 6px rgba(99,102,241,0.35));
        }
        .sb-link:hover .sb-icon { transform: scale(1.08); }
        .sb-group-label {
          font-size: 9.5px; font-weight: 800;
          color: var(--text-3); letter-spacing: 1.5px;
          text-transform: uppercase; padding: 14px 10px 5px;
          display: flex; align-items: center; gap: 6px;
        }
        .sb-group-label::after {
          content: ""; flex: 1; height: 1px;
          background: var(--border); opacity: 0.6;
        }
        @keyframes sbSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sb-nav-scroll { animation: sbSlideIn 0.22s ease both; }
      `}</style>

      <aside style={{
        width: "100%",
        maxWidth: "var(--sidebar-w)",
        background: "#fff",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        height: "100%", overflow: "hidden",
      }}>

        {/* ── Logo ── */}
        <div style={{
          padding: "16px 18px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Gradient logo mark */}
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#4338CA 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#fff", fontWeight: 900, letterSpacing: -0.5,
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}>f</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.6px", lineHeight: 1 }}>feature</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 1 }}>SALON OS</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background: "var(--slate-100)", border: "none", cursor: "pointer",
              width: 28, height: 28, borderRadius: "50%",
              fontSize: 13, color: "var(--text-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--slate-200)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--slate-100)"; }}
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
                    {active && (
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "var(--indigo)",
                        flexShrink: 0,
                        boxShadow: "0 0 6px rgba(99,102,241,0.6)",
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--border)",
          background: "#FAFBFF",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            {/* Salon avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,#6366F1,#4338CA)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 700, color: "var(--text-1)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                letterSpacing: "-0.2px",
              }}>{salonName || "Your Salon"}</div>
              <div style={{
                fontSize: 10, color: "var(--green)", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4, marginTop: 1,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                Active
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%", padding: "7px 12px", borderRadius: 8,
              border: "1px solid var(--border)",
              background: "#fff", color: "var(--text-2)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.12s", fontFamily: "var(--font)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--red-light)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red-pale)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <span style={{ fontSize: 13 }}>→</span> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
