"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_MS        = 60_000;
const COUNT_DURATION_MS = 2800;

export default function LiveCounter() {
  const [target,    setTarget]    = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<{ time: number; from: number } | null>(null);

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats/count", { cache: "no-store" });
      if (!res.ok) return;
      const { businesses } = await res.json();
      if (typeof businesses === "number") setTarget(businesses);
    } catch { /* keep current */ }
  }

  useEffect(() => {
    fetchStats();
    const poll = setInterval(fetchStats, REFRESH_MS);
    return () => clearInterval(poll);
  }, []);

  // Smooth easeOut count-up from 0 → target on every page visit
  useEffect(() => {
    if (target === 0) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = { time: performance.now(), from: 0 };
    setDisplayed(0);

    function tick(now: number) {
      if (!startRef.current) return;
      const progress = Math.min((now - startRef.current.time) / COUNT_DURATION_MS, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  if (target === 0) return null;

  const done = displayed === target;

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      marginTop: 20,
      background: "rgba(201,162,75,0.08)",
      border: "1px solid rgba(201,162,75,0.25)",
      borderRadius: 14,
      padding: "12px 20px",
    }}>

      {/* Number */}
      <span style={{
        fontSize: 34,
        fontWeight: 900,
        color: "#C9A24B",
        letterSpacing: "-1.5px",
        lineHeight: 1,
        animation: done ? "lc-pulse 3s ease-in-out infinite" : "none",
      }}>
        {displayed.toLocaleString()}+
      </span>

      {/* Text + live dot */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#F7F5EF", lineHeight: 1.35 }}>
          businesses already trusting<br />and working with Feature
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "#22c55e", opacity: 0.5,
              animation: "lc-ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
            }} />
            <span style={{ position: "relative", display: "block", width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: "1px", textTransform: "uppercase" }}>Live</span>
        </span>
      </div>

      <style>{`
        @keyframes lc-ping {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(2.6); opacity: 0;   }
          100% { transform: scale(2.6); opacity: 0;   }
        }
        @keyframes lc-pulse {
          0%, 100% { opacity: 1;    }
          50%      { opacity: 0.72; }
        }
      `}</style>
    </div>
  );
}
