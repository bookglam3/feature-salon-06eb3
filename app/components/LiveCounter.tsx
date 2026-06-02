"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_MS  = 60_000;
const COUNT_DURATION_MS = 2800; // how long the count-up animation takes

function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/London",
  });
}

export default function LiveCounter() {
  const [target,    setTarget]    = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const [today,     setToday]     = useState("");
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<{ time: number; from: number } | null>(null);

  // Fetch real count
  async function fetchStats() {
    try {
      const res = await fetch("/api/stats/count", { cache: "no-store" });
      if (!res.ok) return;
      const { appointments } = await res.json();
      if (typeof appointments === "number") setTarget(appointments);
    } catch { /* keep current */ }
  }

  useEffect(() => {
    setToday(todayLabel());
    fetchStats();
    const poll = setInterval(fetchStats, REFRESH_MS);
    return () => clearInterval(poll);
  }, []);

  // Smooth easeOut count-up animation from 0 → target on every target change
  useEffect(() => {
    if (target === 0) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startRef.current = { time: performance.now(), from: 0 };
    setDisplayed(0);

    function tick(now: number) {
      if (!startRef.current) return;
      const elapsed  = now - startRef.current.time;
      const progress = Math.min(elapsed / COUNT_DURATION_MS, 1);
      // ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = Math.round(startRef.current.from + eased * (target - startRef.current.from));
      setDisplayed(value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  if (target === 0) return null;

  return (
    <div style={{
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 0,
      marginTop: 20,
      background: "rgba(201,162,75,0.08)",
      border: "1px solid rgba(201,162,75,0.25)",
      borderRadius: 14,
      padding: "14px 22px",
      minWidth: 220,
    }}>

      {/* Today label */}
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
        textTransform: "uppercase", color: "rgba(201,162,75,0.7)",
        marginBottom: 6,
      }}>
        {today}
      </div>

      {/* Two stats side by side */}
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>

        {/* Bookings */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{
              fontSize: 36, fontWeight: 900, color: "#C9A24B",
              letterSpacing: "-1.5px", lineHeight: 1,
              animation: displayed === target && target > 0 ? "lc-pulse 2.8s ease-in-out infinite" : "none",
            }}>
              {displayed.toLocaleString()}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(201,162,75,0.6)" }}>+</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginTop: 2 }}>
            bookings made
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "#22c55e", opacity: 0.5,
              animation: "lc-ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
            }} />
            <span style={{
              position: "relative", display: "block",
              width: 10, height: 10, borderRadius: "50%", background: "#22c55e",
            }} />
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#22c55e", letterSpacing: "0.5px" }}>LIVE</span>
        </div>

      </div>

      <style>{`
        @keyframes lc-ping {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(2.5); opacity: 0;   }
          100% { transform: scale(2.5); opacity: 0;   }
        }
        @keyframes lc-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
