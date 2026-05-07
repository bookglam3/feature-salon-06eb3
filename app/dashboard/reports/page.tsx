"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ReportsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: salonData } = await supabase.from("salons").select("*").eq("owner_id", user.id).single();
      if (salonData) {
        const { data: appts } = await supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salonData.id).order("date_time", { ascending: false });
        setAppointments(appts || []);
      }
      setLoading(false);
    };
    loadData();
  }, [router]);

  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
  const inRange = appointments.filter(a => new Date(a.date_time) >= daysAgo(Number(range)));

  const totalRevenue = inRange.reduce((sum, a) => sum + (a.services?.price || 0), 0);
  const confirmed = inRange.filter(a => a.status === "confirmed").length;
  const cancelled = inRange.filter(a => a.status === "cancelled").length;
  const completionRate = inRange.length > 0 ? Math.round((confirmed / inRange.length) * 100) : 0;

  const clientMap = new Map<string, number>();
  inRange.forEach(a => { if (a.client_name) clientMap.set(a.client_name, (clientMap.get(a.client_name) || 0) + 1); });
  const topClients = Array.from(clientMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const serviceMap = new Map<string, { count: number; revenue: number }>();
  inRange.forEach(a => {
    const name = a.services?.name || "Unknown";
    const prev = serviceMap.get(name) || { count: 0, revenue: 0 };
    serviceMap.set(name, { count: prev.count + 1, revenue: prev.revenue + (a.services?.price || 0) });
  });
  const topServices = Array.from(serviceMap.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#F2F4F7", minHeight: "100vh", padding: "28px 24px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>Salon performance & trends</p>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#0F172A" }}>Reports</h1>
        </div>
        <select value={range} onChange={e => setRange(e.target.value)} style={{ padding: "8px 14px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", background: "#fff" }}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Bookings", value: inRange.length },
          { label: "Completed", value: confirmed },
          { label: "Completion rate", value: `${completionRate}%` },
          { label: "Cancelled", value: cancelled },
          { label: "Revenue", value: `£${totalRevenue.toFixed(2)}` },
          { label: "New clients", value: clientMap.size },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px", border: "0.5px solid #E8EAF0" }}>
            <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>{stat.label}</div>
            <div style={{ fontSize: "26px", color: "#0F172A", fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "0.5px solid #E8EAF0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #E8EAF0", fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>Top Clients</div>
          {topClients.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No data</div>
          ) : topClients.map(([name, count]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "0.5px solid #F1F5F9" }}>
              <span style={{ fontSize: "13px", color: "#0F172A" }}>{name}</span>
              <span style={{ background: "#EEF2FF", color: "#4F6EF7", fontSize: "11px", padding: "3px 10px", borderRadius: "20px" }}>{count} bookings</span>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "0.5px solid #E8EAF0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #E8EAF0", fontSize: "14px", fontWeight: 500, color: "#0F172A" }}>Top Services</div>
          {topServices.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No data</div>
          ) : topServices.map(([name, data]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "0.5px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#0F172A" }}>{name}</div>
                <div style={{ fontSize: "11px", color: "#94A3B8" }}>{data.count} bookings</div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#059669" }}>£{data.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}