export default function DashboardLoading() {
  return (
    <div style={{ padding: "28px 24px", maxWidth: 1360, margin: "0 auto" }}>
      {/* Banner skeleton */}
      <div className="skeleton" style={{ height: 110, borderRadius: 24, marginBottom: 20 }} />
      {/* Stats skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 18 }} />
        ))}
      </div>
      {/* Quick actions skeleton */}
      <div className="skeleton" style={{ height: 80, borderRadius: 20, marginBottom: 20 }} />
      {/* Table skeleton */}
      <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, overflow: "hidden" }}>
        <div className="skeleton" style={{ height: 52, borderRadius: 0 }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ padding: "14px 22px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 16, alignItems: "center" }}>
            <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 99 }} />
            <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 60, height: 14, borderRadius: 6 }} />
            <div className="skeleton" style={{ flex: 1, height: 14, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
