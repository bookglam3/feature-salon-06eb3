interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "var(--r-lg)",
        background: "var(--slate-100)", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 26, marginBottom: 16,
      }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6, letterSpacing: "-0.3px" }}>{title}</div>
      <div style={{ fontSize: 13.5, color: "var(--text-3)", maxWidth: 280, lineHeight: 1.6 }}>{description}</div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 20, padding: "9px 20px",
            background: "var(--indigo)", color: "#fff",
            border: "none", borderRadius: "var(--r-sm)",
            fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            boxShadow: "var(--shadow-indigo)", transition: "all 0.14s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--indigo-dark)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--indigo)"; }}
        >{action.label}</button>
      )}
    </div>
  );
}
