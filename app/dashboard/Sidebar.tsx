"use client";
import { useRouter, usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: "⊞" },
  { label: "Bookings", path: "/dashboard/bookings", icon: "📅" },
  { label: "Clients", path: "/dashboard/clients", icon: "👤" },
  { label: "Staff", path: "/dashboard/staff", icon: "👥" },
  { label: "Payments", path: "/dashboard/payments", icon: "💳" },
  { label: "Reports", path: "/dashboard/reports", icon: "📊" },
  { label: "Settings", path: "/dashboard/settings", icon: "⚙️" },
];

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <aside
        className="hidden md:flex"
        style={{
          width: "220px",
          minWidth: "220px",
          height: "100vh",
          backgroundColor: "#ffffff",
          borderRight: "0.5px solid #E8EAF0",
          padding: "24px 0",
          flexDirection: "column",
          position: "sticky",
          top: 0,
        }}
      >
        <div style={{ padding: "0 24px", marginBottom: "28px" }}>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: "22px",
            color: "#0F172A",
            letterSpacing: "-0.5px",
          }}>
            feature
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "0 8px", flex: 1 }}>
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => router.push(item.path)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 18px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: active ? "#EEF2FF" : "transparent",
                  color: active ? "#4F6EF7" : "#475569",
                  fontSize: "14px",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  borderLeft: active ? "3px solid #4F6EF7" : "3px solid transparent",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <nav
        className="flex md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          backgroundColor: "#ffffff",
          borderTop: "0.5px solid #E8EAF0",
          zIndex: 100,
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "stretch", height: "100%", minWidth: "max-content", padding: "0 4px" }}>
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => router.push(item.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "3px",
                  padding: "0 14px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  borderTop: active ? "2px solid #4F6EF7" : "2px solid transparent",
                  color: active ? "#4F6EF7" : "#94A3B8",
                  minWidth: "60px",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: "10px", fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}