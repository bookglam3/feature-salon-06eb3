export default function ReportsLoading() {
  return (
    <div style={{ padding: "28px 24px" }}>
      <div className="skeleton" style={{ width: 140, height: 28, borderRadius: 8, marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 18 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 240, borderRadius: 20 }} />
    </div>
  );
}
