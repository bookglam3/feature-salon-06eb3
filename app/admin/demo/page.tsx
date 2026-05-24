"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DemoSalon {
  id: string; name: string; slug: string;
  owner_email: string; plan: string;
  subscription_status: string; subscription_plan: string;
  trial_ends_at: string | null; created_at: string;
  last_city: string | null; last_country: string | null;
  last_device: string | null; last_login_at: string | null;
}

const PLAN_PRICE: Record<string, number> = { starter: 29, pro: 59, premium: 99 };
const PLAN_COLOR: Record<string, string> = {
  starter: "#6366F1", pro: "#10B981", premium: "#F59E0B",
};
const STATUS_META: Record<string, { color: string; bg: string }> = {
  active:    { color: "#10B981", bg: "rgba(16,185,129,0.1)"  },
  trialing:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  trial:     { color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  cancelled: { color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  past_due:  { color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
};

function timeAgo(d: string | null) {
  if (!d) return "Never";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      background: m.bg, color: m.color, border: `1px solid ${m.color}40`,
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DemoDashboard() {
  const router = useRouter();
  const [salons, setSalons] = useState<DemoSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "salons">("overview");

  useEffect(() => {
    fetch("/api/admin/salons")
      .then(r => r.json())
      .then(d => { setSalons(d.salons ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const active    = salons.filter(s => s.subscription_status === "active");
  const trialing  = salons.filter(s => ["trial","trialing"].includes(s.subscription_status));
  const cancelled = salons.filter(s => s.subscription_status === "cancelled");
  const mrr       = active.reduce((sum, s) => sum + (PLAN_PRICE[s.subscription_plan ?? s.plan] ?? 0), 0);

  const FAKE_BOOKINGS = 312;
  const planDistrib = ["starter","pro","premium"].map(p => ({
    plan: p,
    count: salons.filter(s => s.plan === p).length,
  }));

  return (
    <div style={{
      minHeight: "100vh", background: "#07070F",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
    }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      {/* Demo banner */}
      <div style={{
        background: "linear-gradient(90deg,#7C3AED,#4F46E5)",
        padding: "9px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.7 }}>
            Demo Mode
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            · Sample data only — no real client information
          </span>
        </div>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.1)", padding: "3px 12px", borderRadius: 99,
        }}>
          Session expires in 24 hours
        </span>
      </div>

      {/* Header */}
      <header style={{
        background: "#0D0D1A", borderBottom: "1px solid rgba(99,102,241,0.15)",
        padding: "0 28px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, background: "#4F46E5", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
          }}>F</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.3px" }}>Feature Salon</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Admin Platform</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#A5B4FC" }}>Demo Guest</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Read-only access</div>
          </div>
          <button onClick={handleLogout} style={{
            padding: "7px 16px", background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5",
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: "#0D0D1A", padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {(["overview","salons"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "14px 20px", background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              color: tab === t ? "#A5B4FC" : "rgba(255,255,255,0.3)",
              borderBottom: tab === t ? "2px solid #6366F1" : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <main style={{ padding: "28px", maxWidth: 1100, margin: "0 auto" }}>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, border: "3px solid rgba(99,102,241,0.2)",
              borderTopColor: "#6366F1", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto",
            }} />
          </div>
        ) : tab === "overview" ? (

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* KPI grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {[
                { label: "Monthly Revenue",  value: `£${mrr}`,             sub: `ARR £${mrr * 12}`,            accent: "#6366F1", icon: "£" },
                { label: "Active Salons",    value: active.length,          sub: "Currently paying",            accent: "#10B981", icon: "✓" },
                { label: "On Trial",         value: trialing.length,        sub: "Free trial period",           accent: "#F59E0B", icon: "⏱" },
                { label: "Total Bookings",   value: FAKE_BOOKINGS,          sub: "Across all salons",           accent: "#06B6D4", icon: "✦" },
              ].map(k => (
                <div key={k.label} style={{
                  background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: 20,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: k.accent + "1A", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: k.accent, marginBottom: 12,
                  }}>{k.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-1px", marginBottom: 2 }}>{k.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1", marginBottom: 2 }}>{k.label}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.25)" }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Plan distribution */}
              <div style={{
                background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: 24,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Plan Distribution</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Salons per pricing tier</div>
                {planDistrib.map(p => {
                  const pct = salons.length > 0 ? (p.count / salons.length) * 100 : 0;
                  return (
                    <div key={p.plan} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#CBD5E1", fontWeight: 500, textTransform: "capitalize" }}>{p.plan}</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{p.count} · {Math.round(pct)}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                        <div style={{
                          height: "100%", width: `${pct}%`, borderRadius: 3,
                          background: PLAN_COLOR[p.plan],
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weekly bookings (fake sparkline) */}
              <div style={{
                background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: 24,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Weekly Bookings</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Last 8 weeks</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                  {[42,58,51,74,66,83,79,94].map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: "100%", height: `${(v / 94) * 68}px`,
                        background: i === 7 ? "#6366F1" : "rgba(99,102,241,0.3)",
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.6s ease",
                      }} />
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                        {["W1","W2","W3","W4","W5","W6","W7","W8"][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recent signups */}
            <div style={{
              background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Recent Signups</div>
              {salons.slice(0, 4).map(s => (
                <div key={s.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: "rgba(99,102,241,0.15)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: "#A5B4FC",
                    }}>{s.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.owner_email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusBadge status={s.subscription_status} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                      {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        ) : (

          /* Salons tab */
          <div style={{
            background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>All Salons</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                {salons.length} salons · read-only demo view
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Salon","Owner","Plan","Status","Last Login","Location","Joined"].map(h => (
                      <th key={h} style={{
                        padding: "12px 20px", textAlign: "left",
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)", borderBottom: "1px solid rgba(255,255,255,0.06)",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salons.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "rgba(99,102,241,0.15)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 800, color: "#A5B4FC",
                          }}>{s.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>{s.owner_email}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                          background: (PLAN_COLOR[s.plan] ?? "#6366F1") + "1A",
                          color: PLAN_COLOR[s.plan] ?? "#6366F1",
                          border: `1px solid ${(PLAN_COLOR[s.plan] ?? "#6366F1")}40`,
                          textTransform: "capitalize",
                        }}>{s.plan}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}><StatusBadge status={s.subscription_status} /></td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        {timeAgo(s.last_login_at)}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                        {s.last_city ? `${s.last_city}, ${s.last_country}` : "—"}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                        {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        )}

        {/* Footer note */}
        <div style={{
          marginTop: 32, padding: "14px 20px",
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 12, textAlign: "center",
        }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
            This is a <strong style={{ color: "#A5B4FC" }}>demo environment</strong> — all data is sample only.
            Real platform data is not accessible from this account.
          </p>
        </div>

      </main>
    </div>
  );
}
