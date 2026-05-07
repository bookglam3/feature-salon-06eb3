export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <main className="dashboard-main">
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-main {
            padding-bottom: 72px !important;
          }
        }
      `}</style>
    </div>
  );
}