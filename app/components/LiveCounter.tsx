"use client";

import { useEffect, useRef, useState } from "react";

const FLOOR = 147;
const REFRESH_MS = 60_000;

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

  // Initial fetch + polling
  useEffect(() => {
    fetchCount();
    const poll = setInterval(fetchCount, REFRESH_MS);
    return () => clearInterval(poll);
  }, []);

  // Animate displayed → target
  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current);
    if (displayed === target) return;

    const step = target > displayed ? 1 : -1;
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

    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 99,
        padding: "8px 16px",
        fontSize: 13,
        color: "rgba(255,255,255,0.85)",
        fontWeight: 500,
        marginTop: 16,
      }}
    >
      {/* Pulsing live dot */}
      <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#4ade80",
            opacity: 0.6,
            animation: "lc-ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
          }}
        />
        <span
          style={{
            position: "relative",
            display: "block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#22c55e",
          }}
        />
      </span>

      <span>
        <strong style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{displayed}+</strong>
        {" "}businesses already using Feature
      </span>

      <style>{`
        @keyframes lc-ping {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(2.2); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
