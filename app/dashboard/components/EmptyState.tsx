"use client";
import { ReactNode } from "react";
import { CalendarDays } from "lucide-react";

interface EmptyStateProps {
  icon?: string;
  lucideIcon?: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, lucideIcon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      padding: "64px 24px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0,
      position: "relative",
    }}>
      {/* Ambient glow behind icon */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%,-70%)",
        width: 180, height: 180,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(201,162,75,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Icon box */}
      <div style={{
        width: 68, height: 68, borderRadius: 20,
        background: "linear-gradient(145deg,#1A1830,#130F2A)",
        border: "1px solid rgba(201,162,75,0.2)",
        boxShadow: "0 0 24px rgba(201,162,75,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20, position: "relative",
        color: "#E7C878",
      }}>
        {lucideIcon ? lucideIcon : (
          icon ? (
            <span style={{ fontSize: 28 }}>{icon}</span>
          ) : (
            <CalendarDays size={28} strokeWidth={1.5} />
          )
        )}
        {/* Corner glow dot */}
        <div style={{
          position: "absolute", top: -3, right: -3,
          width: 10, height: 10, borderRadius: "50%",
          background: "rgba(201,162,75,0.6)",
          boxShadow: "0 0 8px rgba(201,162,75,0.8)",
        }} />
      </div>

      <div style={{
        fontSize: 15.5, fontWeight: 800, color: "#F1F5F9",
        marginBottom: 8, letterSpacing: "-0.4px",
      }}>{title}</div>

      <div style={{
        fontSize: 13, color: "rgba(255,255,255,0.35)",
        maxWidth: 260, lineHeight: 1.65, fontWeight: 400,
      }}>{description}</div>

      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 24,
            padding: "10px 24px",
            background: "linear-gradient(135deg,#C9A24B,#0E1320)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 18px rgba(201,162,75,0.4)",
            transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
            letterSpacing: "-0.1px",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(201,162,75,0.55)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(201,162,75,0.4)";
          }}
        >{action.label}</button>
      )}
    </div>
  );
}
