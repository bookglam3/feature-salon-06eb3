export default function BookingsLoading() {
  return (
    <div style={{ padding: "28px 24px" }}>
      <div className="skeleton" style={{ width: 160, height: 28, borderRadius: 8, marginBottom: 20 }} />
      <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, overflow: "hidden" }}>
        <div className="skeleton" style={{ height: 52, borderRadius: 0 }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ padding: "14px 22px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 16 }}>
            <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 99 }} />
            <div className="skeleton" style={{ width: 130, height: 14, borderRadius: 6 }} />
            <div className="skeleton" style={{ flex: 1, height: 14, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 70, height: 14, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
