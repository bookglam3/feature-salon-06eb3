"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_MS = 60_000;

// Decorative avatar placeholders — illustrative only
const BIZ_AVATARS  = [
  { bg: "#6366F1", label: "S" },
  { bg: "#EC4899", label: "A" },
  { bg: "#F59E0B", label: "M" },
  { bg: "#10B981", label: "J" },
  { bg: "#3B82F6", label: "R" },
];
const APPT_AVATARS = [
  { bg: "#8B5CF6", label: "L" },
  { bg: "#F97316", label: "K" },
  { bg: "#14B8A6", label: "D" },
  { bg: "#EF4444", label: "P" },
  { bg: "#C9A24B", label: "N" },
];

interface StatData { businesses: number; appointments: number }

function useAnimated(target: number, initial: number): number {
  const [displayed, setDisplayed] = useState(initial);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current);
    if (displayed === target) return;
    const step  = target > displayed ? 1 : -1;
    const steps = Math.abs(target - displayed);
    const delay = Math.max(16, Math.min(80, 1200 / steps));
    animRef.current = setInterval(() => {
      setDisplayed(prev => {
        const next = prev + step;
        if (next === target && animRef.current) { clearInterval(animRef.current); animRef.current = null; }
        return next;
      });
    }, delay);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return displayed;
}

function AvatarStack({ avatars }: { avatars: typeof BIZ_AVATARS }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {avatars.map((av, i) => (
        <div key={i} style={{
          width: 34, height: 34, borderRadius: "50%",
          background: av.bg, border: "2.5px solid #0E1320",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff",
          marginLeft: i === 0 ? 0 : -9,
          position: "relative", zIndex: avatars.length - i, flexShrink: 0,
        }}>
          {av.label}
        </div>
      ))}
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "rgba(255,255,255,0.10)", border: "2.5px solid #0E1320",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)",
        marginLeft: -9, flexShrink: 0,
      }}>+</div>
    </div>
  );
}

function LiveDot() {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 9, height: 9, flexShrink: 0 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "#4ade80", opacity: 0.55,
        animation: "lc-ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      <span style={{
        position: "relative", display: "block",
        width: 9, height: 9, borderRadius: "50%", background: "#22c55e",
      }} />
    </span>
  );
}

export default function LiveCounter() {
  const [data, setData] = useState<StatData>({ businesses: 147, appointments: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/count", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch { /* leave current */ }
    }
    fetchStats();
    const poll = setInterval(fetchStats, REFRESH_MS);
    return () => clearInterval(poll);
  }, []);

  const bizCount  = useAnimated(data.businesses,   147);
  const apptCount = useAnimated(data.appointments,   0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20, flexWrap: "wrap" }}>

      {/* Businesses counter */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <AvatarStack avatars={BIZ_AVATARS} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>
              {bizCount}+
            </span>
            <LiveDot />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 3, lineHeight: 1 }}>
            businesses using Feature
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />

      {/* Appointments counter */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <AvatarStack avatars={APPT_AVATARS} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>
              {apptCount}+
            </span>
            <LiveDot />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 3, lineHeight: 1 }}>
            bookings made
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lc-ping {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(2.4); opacity: 0;    }
          100% { transform: scale(2.4); opacity: 0;    }
        }
      `}</style>
    </div>
  );
}
