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
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
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
        supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salonData.id).order("date_time", { ascending: false }),
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
    const { data: appts } = await supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salon.id).order("date_time", { ascending: false });
    setAppointments(appts || []);
  };

  const todayAppts = appointments.filter(a => new Date(a.date_time).toDateString() === new Date().toDateString());
  const upcomingAppts = appointments.filter(a => new Date(a.date_time) > new Date());
  const revenue = appointments.reduce((sum, a) => sum + (a.services?.price || 0), 0);
  const filteredAppts = activeTab === "Today" ? todayAppts : activeTab === "Upcoming" ? upcomingAppts : appointments;

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.client_name || !formData.service_id || !formData.date || !formData.time) { setError("Please fill required fields."); return; }
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    const { error: err } = await supabase.from("appointments").insert({ salon_id: salon.id, client_name: formData.client_name, client_email: formData.client_email, client_phone: formData.client_phone, service_id: formData.service_id, staff_id: formData.staff_id || null, date_time: dateTime.toISOString(), status: "pending" });
    if (err) { setError(err.message); return; }
    setShowModal(false);
    setFormData({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });
    await reloadAppointments();
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8F9FB" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature</div>
    </div>
  );

  const statCards = [
    { label: "Today", value: todayAppts.length, color: "#EEF2FF", text: "#4F6EF7", icon: "📅" },
    { label: "Upcoming", value: upcomingAppts.length, color: "#F0FDF4", text: "#16A34A", icon: "⏰" },
    { label: "Total Bookings", value: appointments.length, color: "#FFF7ED", text: "#EA580C", icon: "📋" },
    { label: "Revenue", value: `£${revenue.toFixed(0)}`, color: "#F0F9FF", text: "#0284C7", icon: "💰" },
    { label: "Plan", value: salon?.plan || "Starter", color: "#FDF4FF", text: "#9333EA", icon: "⭐" },
  ];

  return (
    <div style={{ background: "#F8F9FB", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 20px 16px", borderBottom: "0.5px solid #E8EAF0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8", letterSpacing: "0.5px" }}>SALON DASHBOARD</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "24px", color: "#0F172A", fontWeight: 700 }}>Welcome back 👋</h1>
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "12px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            + New
          </button>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#64748B" }}>{salon?.name}</p>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: "16px", padding: "16px", border: "0.5px solid #E8EAF0", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: s.text, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "3px" }}>{s.label}</div>
              </div>
            </div>
          ))}
          {/* Quick actions */}
          <div style={{ background: "#4F6EF7", borderRadius: "16px", padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }} onClick={() => router.push("/dashboard/bookings")}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>📖</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", lineHeight: 1 }}>All Bookings</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "3px" }}>View & manage</div>
            </div>
          </div>
        </div>

        {/* New Booking Modal */}
        {showModal && (
          <div style={{ background: "#fff", borderRadius: "20px", border: "0.5px solid #E8EAF0", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0F172A" }}>New Booking</h2>
              <button onClick={() => { setShowModal(false); setError(""); }} style={{ border: "none", background: "#F1F5F9", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", color: "#64748B" }}>✕ Close</button>
            </div>
            <form onSubmit={handleCreateBooking} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Client Name *", key: "client_name", type: "text", placeholder: "Sarah Jones" },
                { label: "Email", key: "client_email", type: "email", placeholder: "client@example.com" },
                { label: "Phone", key: "client_phone", type: "tel", placeholder: "07400 123456" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 500, display: "block", marginBottom: "4px" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(formData as any)[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required={f.key === "client_name"} style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #E8EAF0", borderRadius: "10px", fontSize: "14px", boxSizing: "border-box" as const }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 500, display: "block", marginBottom: "4px" }}>Service *</label>
                <select value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })} required style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #E8EAF0", borderRadius: "10px", fontSize: "14px" }}>
                  <option value="">Select service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} (£{s.price})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 500, display: "block", marginBottom: "4px" }}>Staff</label>
                <select value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })} style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #E8EAF0", borderRadius: "10px", fontSize: "14px" }}>
                  <option value="">Any staff</option>
                  {staff.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 500, display: "block", marginBottom: "4px" }}>Date *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #E8EAF0", borderRadius: "10px", fontSize: "14px", boxSizing: "border-box" as const }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748B", fontWeight: 500, display: "block", marginBottom: "4px" }}>Time *</label>
                  <select value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required style={{ width: "100%", padding: "10px 12px", border: "0.5px solid #E8EAF0", borderRadius: "10px", fontSize: "14px" }}>
                    <option value="">Select</option>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {error && <div style={{ color: "#DC2626", fontSize: "13px", background: "#FEF2F2", padding: "10px", borderRadius: "8px" }}>{error}</div>}
              <button type="submit" style={{ background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "12px", padding: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>Create Booking</button>
            </form>
          </div>
        )}

        {/* Recent Bookings */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "0.5px solid #E8EAF0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #E8EAF0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", color: "#0F172A", fontWeight: 600 }}>Recent Bookings</h2>
            <div style={{ display: "flex", gap: "6px" }}>
              {["All", "Today", "Upcoming"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "5px 12px", borderRadius: "20px", border: "none", background: activeTab === tab ? "#4F6EF7" : "#F1F5F9", color: activeTab === tab ? "#fff" : "#64748B", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>{tab}</button>
              ))}
            </div>
          </div>
          {filteredAppts.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>No appointments found</div>
          ) : (
            filteredAppts.map(a => (
              <div key={a.id} style={{ padding: "14px 20px", borderBottom: "0.5px solid #F1F5F9", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.client_name}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>{a.services?.name || "—"} · {new Date(a.date_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} {new Date(a.date_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>£{a.services?.price || "—"}</div>
                  <span style={{ display: "inline-block", marginTop: "3px", background: a.status === "confirmed" ? "#ECFDF5" : "#FFF7ED", color: a.status === "confirmed" ? "#059669" : "#D97706", fontSize: "10px", padding: "2px 8px", borderRadius: "20px", fontWeight: 500 }}>{a.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}