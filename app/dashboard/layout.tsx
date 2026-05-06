import DashboardSidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8F9FB",
      }}
    >
      <DashboardSidebar />
      <main
        style={{
          flex: 1,
          overflow: "auto",
        }}
        className="dashboard-main"
      >
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