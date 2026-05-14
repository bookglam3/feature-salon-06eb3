export default function BookingsLoading() {
  return (
    <div style={{ padding: "24px 20px" }}>
      {/* Filter bar skeleton */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 11 }} />
        <div className="skeleton" style={{ width: 280, height: 40, borderRadius: 10 }} />
      </div>
      {/* Table skeleton */}
      <div style={{
        background: "linear-gradient(145deg,rgba(16,15,28,0.98),rgba(13,12,25,0.99))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: "0 4px 32px rgba(0,0,0,0.45)",
      }}>
        {/* thead */}
        <div style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "11px 18px", display: "flex", gap: 20 }}>
          {[60, 120, 100, 80, 130, 60, 80].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 10, borderRadius: 5 }} />
          ))}
        </div>
        {/* rows */}
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 20, alignItems: "center" }}>
            <div className="skeleton" style={{ width: 68, height: 22, borderRadius: 99 }} />
            <div className="skeleton" style={{ width: 110, height: 12, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 70, height: 12, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 120, height: 12, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 50, height: 12, borderRadius: 6 }} />
            <div className="skeleton" style={{ flex: 1, height: 12, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
