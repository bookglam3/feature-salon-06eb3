"use client";

import { useEffect, useRef, useState } from "react";

const FLOOR = 147;
const REFRESH_MS = 60_000;

// Decorative avatar placeholders — illustrative, not specific real users
const AVATARS = [
  { bg: "#6366F1", label: "S" },
  { bg: "#EC4899", label: "A" },
  { bg: "#F59E0B", label: "M" },
  { bg: "#10B981", label: "J" },
  { bg: "#3B82F6", label: "R" },
];

export default function LiveCounter() {
  const [target, setTarget]       = useState<number>(FLOOR);
  const [displayed, setDisplayed] = useState<number>(FLOOR);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchCount() {
    try {
      const res = await fetch("/api/stats/count", { cache: "no-store" });
      if (!res.ok) return;
      const { count } = await res.json();
      if (typeof count === "number") setTarget(count);
    } catch {
      // leave current value
    }
  }

  useEffect(() => {
    fetchCount();
    const poll = setInterval(fetchCount, REFRESH_MS);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current);
    if (displayed === target) return;
    const step  = target > displayed ? 1 : -1;
    const steps = Math.abs(target - displayed);
    const delay = Math.max(16, Math.min(80, 1200 / steps));
    animRef.current = setInterval(() => {
      setDisplayed(prev => {
        const next = prev + step;
        if (next === target && animRef.current) {
          clearInterval(animRef.current);
          animRef.current = null;
        }
        return next;
      });
    }, delay);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginTop: 20 }}>

      {/* Overlapping avatar stack */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {AVATARS.map((av, i) => (
          <div
            key={i}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: av.bg,
              border: "2.5px solid #0E1320",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              marginLeft: i === 0 ? 0 : -10,
              position: "relative",
              zIndex: AVATARS.length - i,
              flexShrink: 0,
            }}
          >
            {av.label}
          </div>
        ))}
        {/* overflow indicator */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            border: "2.5px solid #0E1320",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.6)",
            marginLeft: -10,
            flexShrink: 0,
          }}
        >
          +
        </div>
      </div>

      {/* Number + label */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>
            {displayed}+
          </span>
          {/* Pulsing live dot */}
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
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginTop: 3, lineHeight: 1 }}>
          businesses using Feature
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
