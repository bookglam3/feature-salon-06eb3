interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: "indigo" | "green" | "amber" | "red" | "slate";
  badge?: string;
  sub?: string;
}

const colorMap = {
  indigo: { accent: "var(--indigo)",  light: "var(--indigo-light)", text: "var(--indigo)",   grad: "linear-gradient(90deg,#6366F1 0%,#818CF8 100%)" },
  green:  { accent: "var(--green)",   light: "var(--green-light)",  text: "var(--green)",    grad: "linear-gradient(90deg,#10B981 0%,#34D399 100%)" },
  amber:  { accent: "var(--amber)",   light: "var(--amber-light)",  text: "var(--amber)",    grad: "linear-gradient(90deg,#F59E0B 0%,#FCD34D 100%)" },
  red:    { accent: "var(--red)",     light: "var(--red-light)",    text: "var(--red)",      grad: "linear-gradient(90deg,#EF4444 0%,#F87171 100%)" },
  slate:  { accent: "var(--slate-500)", light: "var(--slate-100)", text: "var(--slate-600)", grad: "linear-gradient(90deg,#64748B 0%,#94A3B8 100%)" },
};

export default function StatCard({ label, value, icon, color, badge, sub }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      style={{
        background: "#fff", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", padding: "18px 16px",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "all 0.16s", position: "relative", overflow: "hidden",
        cursor: "default",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c.grad, borderRadius: "var(--r-lg) var(--r-lg) 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.6px", textTransform: "uppercase" }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: c.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
      </div>

      {badge ? (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--amber-light)", color: "var(--amber-dark)", fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 99, border: "1px solid var(--amber-pale)", alignSelf: "flex-start" }}>
          ✦ {badge}
        </div>
      ) : (
        <div style={{ fontSize: 30, fontWeight: 800, color: c.text, letterSpacing: "-1.2px", lineHeight: 1 }}>{value}</div>
      )}

      {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: -4 }}>{sub}</div>}
    </div>
  );
}
