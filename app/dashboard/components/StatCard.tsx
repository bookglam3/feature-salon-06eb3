"use client";
import { useEffect, useRef } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: "indigo" | "green" | "amber" | "red" | "slate";
  badge?: string;
  sub?: string;
  trend?: number;   // e.g. +12 or -3 (percent)
  prefix?: string;  // e.g. "£"
}

const colorMap = {
  indigo: {
    accent: "#6366F1", light: "#EEF2FF", text: "#6366F1",
    grad: "linear-gradient(135deg,#6366F1,#8B5CF6)",
    glow: "rgba(99,102,241,0.2)", bar: "#818CF8",
  },
  green: {
    accent: "#10B981", light: "#ECFDF5", text: "#059669",
    grad: "linear-gradient(135deg,#10B981,#34D399)",
    glow: "rgba(16,185,129,0.18)", bar: "#34D399",
  },
  amber: {
    accent: "#F59E0B", light: "#FFFBEB", text: "#B45309",
    grad: "linear-gradient(135deg,#F59E0B,#FCD34D)",
    glow: "rgba(245,158,11,0.18)", bar: "#FCD34D",
  },
  red: {
    accent: "#EF4444", light: "#FEF2F2", text: "#DC2626",
    grad: "linear-gradient(135deg,#EF4444,#F87171)",
    glow: "rgba(239,68,68,0.18)", bar: "#F87171",
  },
  slate: {
    accent: "#64748B", light: "#F1F5F9", text: "#475569",
    grad: "linear-gradient(135deg,#64748B,#94A3B8)",
    glow: "rgba(100,116,139,0.15)", bar: "#94A3B8",
  },
};

// Animated number counter
function AnimCounter({ target, prefix }: { target: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    const tick = (now: number) => {
      const pct = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3); // ease-out-cubic
      const val = Math.round(ease * target);
      if (ref.current) ref.current.textContent = (prefix || "") + val.toLocaleString();
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, prefix]);
  return <span ref={ref}>{(prefix || "") + "0"}</span>;
}

export default function StatCard({ label, value, icon, color, badge, sub, trend, prefix }: StatCardProps) {
  const c = colorMap[color];
  const numVal = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  const isNumeric = !isNaN(numVal) && !badge;
  const trendUp = (trend ?? 0) >= 0;

  return (
    <div
      style={{
        background: "#fff", border: "1.5px solid #F1F5F9",
        borderRadius: 20, padding: "20px 18px",
        display: "flex", flexDirection: "column", gap: 14,
        transition: "all 0.2s ease", position: "relative", overflow: "hidden",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 12px 36px ${c.glow}`;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = c.accent + "44";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = "#F1F5F9";
      }}
    >
      {/* Gradient top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: c.grad, borderRadius: "20px 20px 0 0",
      }} />

      {/* Decorative circle */}
      <div style={{
        position: "absolute", bottom: -16, right: -16,
        width: 80, height: 80, borderRadius: "50%",
        background: c.glow, pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          fontSize: 10.5, fontWeight: 800, color: "var(--text-3)",
          letterSpacing: "0.8px", textTransform: "uppercase",
        }}>{label}</div>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: c.grad, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 17, flexShrink: 0,
          boxShadow: `0 4px 12px ${c.glow}`,
        }}>{icon}</div>
      </div>

      {/* Value */}
      {badge ? (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "var(--amber-light)", color: "var(--amber-dark)",
          fontSize: 11.5, fontWeight: 700, padding: "4px 10px",
          borderRadius: 99, border: "1px solid var(--amber-pale)",
          alignSelf: "flex-start",
        }}>
          ✦ {badge}
        </div>
      ) : isNumeric ? (
        <div className="count-animate" style={{
          fontSize: 32, fontWeight: 900, color: "var(--text-1)",
          letterSpacing: "-1.5px", lineHeight: 1,
        }}>
          <AnimCounter target={numVal} prefix={prefix} />
        </div>
      ) : (
        <div style={{
          fontSize: 28, fontWeight: 900, color: "var(--text-1)",
          letterSpacing: "-1px", lineHeight: 1,
        }}>{value}</div>
      )}

      {/* Sub + trend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {sub && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500, flex: 1 }}>{sub}</div>
        )}
        {trend !== undefined && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
            background: trendUp ? "#ECFDF5" : "#FEF2F2",
            color: trendUp ? "#059669" : "#DC2626",
            flexShrink: 0,
          }}>
            <span>{trendUp ? "↑" : "↓"}</span>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}
