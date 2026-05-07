"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const timeSlots = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];

export default function DashboardPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });

  useEffect(() => {
    const loadData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) { router.push("/login"); return; }
      const { data: salonData, error: salonError } = await supabase.from("salons").select("*").eq("owner_id", user.id).single();
      if (salonError || !salonData) { router.push("/login"); return; }
      setSalon(salonData);
      const [{ data: appts }, { data: staffData }, { data: servicesData }] = await Promise.all([
        supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salonData.id).order("date_time", { ascending: true }),
        supabase.from("staff").select("*").eq("salon_id", salonData.id),
        supabase.from("services").select("*").eq("salon_id", salonData.id),
      ]);
      setAppointments(appts || []);
      setStaff(staffData || []);
      setServices(servicesData || []);
      setLoading(false);
    };
    loadData();
  }, [router]);

  const reloadAppointments = async () => {
    if (!salon) return;
    const { data: appts } = await supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salon.id).order("date_time", { ascending: true });
    setAppointments(appts || []);
  };

  const todayAppointments = appointments.filter(a => new Date(a.date_time).toDateString() === new Date().toDateString());
  const upcomingAppointments = appointments.filter(a => new Date(a.date_time) > new Date());
  const filteredAppointments = activeTab === "Today" ? todayAppointments : activeTab === "Upcoming" ? upcomingAppointments : appointments;
  const revenue = appointments.reduce((sum, a) => sum + (a.services?.price || 0), 0);

  const handleCreateBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!formData.client_name || !formData.service_id || !formData.date || !formData.time) { setError("Please complete the required fields."); return; }
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    if (Number.isNaN(dateTime.getTime())) { setError("Please select a valid date and time."); return; }
    const { error: createError } = await supabase.from("appointments").insert({
      salon_id: salon.id, client_name: formData.client_name, client_email: formData.client_email,
      client_phone: formData.client_phone, service_id: formData.service_id,
      staff_id: formData.staff_id || null, date_time: dateTime.toISOString(), status: "pending",
    });
    if (createError) { setError(createError.message); return; }
    setShowModal(false);
    setFormData({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });
    await reloadAppointments();
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#F2F4F7", minHeight: "100vh", padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>Salon dashboard</p>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#0F172A" }}>Welcome back</h1>
        </div>
        <button type="button" onClick={() => setShowModal(true)} style={{ border: "none", borderRadius: "12px", backgroundColor: "#4F6EF7", color: "#ffffff", padding: "12px 20px", fontSize: "14px", cursor: "pointer" }}>
          + New Booking
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Today's bookings", value: todayAppointments.length },
          { label: "Upcoming", value: upcomingAppointments.length },
          { label: "Total bookings", value: appointments.length },
          { label: "Revenue", value: `£${revenue.toFixed(2)}` },
          { label: "Plan", value: salon?.plan || "Starter" },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px", border: "0.5px solid #E8EAF0" }}>
            <div style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{stat.label}</div>
            <div style={{ fontSize: "28px", color: "#0F172A", fontWeight: 700, textTransform: "capitalize" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Bookings", path: "/dashboard/bookings", color: "#EEF2FF", textColor: "#4F6EF7" },
          { label: "Clients", path: "/dashboard/clients", color: "#ECFDF5", textColor: "#059669" },
          { label: "Staff", path: "/dashboard/staff", color: "#FFF7ED", textColor: "#D97706" },
          { label: "Settings", path: "/dashboard/settings", color: "#F8F9FC", textColor: "#475569" },
        ].map(item => (
          <button key={item.label} onClick={() => router.push(item.path)} style={{ background: item.color, border: "none", borderRadius: "12px", padding: "16px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: item.textColor }}>Go to {item.label} →</div>
          </button>
        ))}
      </div>

      {/* New Booking Modal */}
      {showModal && (
        <div style={{ marginBottom: "24px", backgroundColor: "#ffffff", border: "0.5px solid #E8EAF0", borderRadius: "20px", padding: "28px", maxWidth: "780px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0F172A" }}>Create appointment</h2>
            <button type="button" onClick={() => { setShowModal(false); setError(""); }} style={{ border: "none", backgroundColor: "transparent", color: "#475569", cursor: "pointer", fontSize: "14px" }}>Close</button>
          </div>
          <form onSubmit={handleCreateBooking} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {[
              { label: "Client name", key: "client_name", type: "text", placeholder: "Sarah Jones", required: true },
              { label: "Client email", key: "client_email", type: "email", placeholder: "client@example.com", required: false },
              { label: "Phone number", key: "client_phone", type: "tel", placeholder: "07400 123456", required: false },
            ].map(f => (
              <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 600 }}>{f.label}</label>
                <input type={f.type} value={(formData as any)[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} required={f.required} style={{ border: "0.5px solid #E8EAF0", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#0F172A" }} />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 600 }}>Service</label>
              <select value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })} required style={{ border: "0.5px solid #E8EAF0", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#0F172A" }}>
                <option value="">Select service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} (£{s.price})</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 600 }}>Staff member</label>
              <select value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })} style={{ border: "0.5px solid #E8EAF0", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#0F172A" }}>
                <option value="">Any available staff</option>
                {staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 600 }}>Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required style={{ border: "0.5px solid #E8EAF0", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#0F172A" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 600 }}>Time</label>
              <select value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required style={{ border: "0.5px solid #E8EAF0", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#0F172A" }}>
                <option value="">Select time</option>
                {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button type="button" onClick={() => { setShowModal(false); setError(""); }} style={{ border: "1px solid #E8EAF0", backgroundColor: "#ffffff", color: "#475569", borderRadius: "10px", padding: "10px 18px", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ border: "none", backgroundColor: "#4F6EF7", color: "#ffffff", borderRadius: "10px", padding: "10px 18px", cursor: "pointer" }}>Create booking</button>
            </div>
            {error && <div style={{ gridColumn: "1 / -1", color: "#DC2626", fontSize: "13px" }}>{error}</div>}
          </form>
        </div>
      )}

      {/* Appointments Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", overflow: "hidden", border: "0.5px solid #E8EAF0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "20px 24px", borderBottom: "0.5px solid #E8EAF0" }}>
          <h2 style={{ margin: 0, fontSize: "16px", color: "#0F172A" }}>Recent bookings</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {["All", "Today", "Upcoming"].map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ border: "none", backgroundColor: activeTab === tab ? "#4F6EF7" : "#F8FAFC", color: activeTab === tab ? "#ffffff" : "#475569", borderRadius: "999px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>{tab}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px", backgroundColor: "#ffffff" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "0.5px solid #E8EAF0" }}>
                {["Status", "Client", "Service", "Staff", "Date & time", "Price"].map(h => (
                  <th key={h} style={{ padding: "14px 18px", fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "32px 18px", color: "#64748B", fontSize: "14px", textAlign: "center" }}>No appointments found.</td></tr>
              ) : (
                filteredAppointments.map(a => (
                  <tr key={a.id} style={{ borderBottom: "0.5px solid #F1F5F9" }}>
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: "999px", backgroundColor: a.status === "confirmed" ? "#ECFDF5" : "#EFF6FF", color: a.status === "confirmed" ? "#166534" : "#1D4ED8", fontSize: "11px", fontWeight: 600 }}>{a.status}</span>
                    </td>
                    <td style={{ padding: "13px 18px", fontSize: "13px", color: "#0F172A" }}>{a.client_name}</td>
                    <td style={{ padding: "13px 18px", fontSize: "13px", color: "#0F172A" }}>{a.services?.name || "—"}</td>
                    <td style={{ padding: "13px 18px", fontSize: "13px", color: "#64748B" }}>{a.staff?.name || "—"}</td>
                    <td style={{ padding: "13px 18px", fontSize: "13px", color: "#0F172A" }}>{new Date(a.date_time).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td style={{ padding: "13px 18px", fontSize: "13px", color: "#0F172A" }}>£{a.services?.price?.toFixed(2) || "0.00"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}