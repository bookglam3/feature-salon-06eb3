"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PaymentsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: salonData } = await supabase.from("salons").select("*").eq("owner_id", user.id).single();
      setSalon(salonData);
      if (salonData) {
        const { data: appts } = await supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salonData.id).order("date_time", { ascending: false });
        setAppointments(appts || []);
      }
      setLoading(false);
    };
    loadData();
  }, [router]);

  const totalCollected = appointments.filter(a => a.status === "confirmed").reduce((sum, a) => sum + (a.services?.price || 0), 0);
  const pending = appointments.filter(a => a.status === "pending").reduce((sum, a) => sum + (a.services?.price || 0), 0);
  const refunded = appointments.filter(a => a.status === "cancelled").reduce((sum, a) => sum + (a.services?.price || 0), 0);

  const filtered = appointments.filter(a => {
    const matchTab = activeTab === "All" ? true : activeTab === "Paid" ? a.status === "confirmed" : activeTab === "Pending" ? a.status === "pending" : a.status === "cancelled";
    const matchSearch = search === "" || a.client_name?.toLowerCase().includes(search.toLowerCase()) || a.services?.name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#F2F4F7", minHeight: "100vh", padding: "28px 24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>Payment activity & invoices</p>
        <h1 style={{ margin: 0, fontSize: "28px", color: "#0F172A" }}>Payments</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Collected", value: `£${totalCollected.toFixed(2)}`, sub: `${appointments.filter(a => a.status === "confirmed").length} payments` },
          { label: "Pending", value: `£${pending.toFixed(2)}`, sub: `${appointments.filter(a => a.status === "pending").length} unpaid` },
          { label: "Refunded", value: `£${refunded.toFixed(2)}`, sub: `${appointments.filter(a => a.status === "cancelled").length} refunds` },
          { label: "All Transactions", value: appointments.length, sub: "total records" },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px", border: "0.5px solid #E8EAF0" }}>
            <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>{stat.label}</div>
            <div style={{ fontSize: "26px", color: "#0F172A", fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "0.5px solid #E8EAF0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #E8EAF0", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {["All", "Paid", "Pending", "Cancelled"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "6px", border: "0.5px solid", borderColor: activeTab === tab ? "#C7D2FE" : "#E8EAF0", background: activeTab === tab ? "#EEF2FF" : "#fff", color: activeTab === tab ? "#4F6EF7" : "#94A3B8", cursor: "pointer" }}>{tab}</button>
            ))}
          </div>
          <input type="text" placeholder="Search client, service..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "200px" }} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>No payments found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
              <thead>
                <tr style={{ background: "#F8F9FC" }}>
                  {["Status", "Client", "Service", "Staff", "Date", "Amount"].map(h => (
                    <th key={h} style={{ fontSize: "11px", color: "#94A3B8", textAlign: "left", padding: "10px 18px", fontWeight: 500, borderBottom: "0.5px solid #E8EAF0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ padding: "11px 18px", borderBottom: "0.5px solid #F1F5F9" }}>
                      <span style={{ background: a.status === "confirmed" ? "#ECFDF5" : a.status === "cancelled" ? "#FEE2E2" : "#FFF7ED", color: a.status === "confirmed" ? "#059669" : a.status === "cancelled" ? "#DC2626" : "#D97706", fontSize: "10px", padding: "3px 8px", borderRadius: "20px" }}>{a.status}</span>
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: "13px", color: "#0F172A", borderBottom: "0.5px solid #F1F5F9" }}>{a.client_name}</td>
                    <td style={{ padding: "11px 18px", fontSize: "13px", color: "#0F172A", borderBottom: "0.5px solid #F1F5F9" }}>{a.services?.name || "—"}</td>
                    <td style={{ padding: "11px 18px", fontSize: "13px", color: "#64748B", borderBottom: "0.5px solid #F1F5F9" }}>{a.staff?.name || "—"}</td>
                    <td style={{ padding: "11px 18px", fontSize: "13px", color: "#64748B", borderBottom: "0.5px solid #F1F5F9" }}>{new Date(a.date_time).toLocaleDateString("en-GB")}</td>
                    <td style={{ padding: "11px 18px", fontSize: "13px", fontWeight: 600, color: "#0F172A", borderBottom: "0.5px solid #F1F5F9" }}>£{a.services?.price?.toFixed(2) || "0.00"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}