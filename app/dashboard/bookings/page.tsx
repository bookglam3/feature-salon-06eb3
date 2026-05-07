"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function BookingsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [view, setView] = useState<"table" | "calendar">("table");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_name: "", client_email: "", client_phone: "",
    staff_id: "", service_id: "", date_time: "", status: "pending",
  });
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: salonData } = await supabase.from("salons").select("*").eq("owner_id", user.id).single();
      setSalon(salonData);
      if (salonData) {
        const { data: appts } = await supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salonData.id).order("date_time", { ascending: true });
        setAppointments(appts || []);
        const { data: staffData } = await supabase.from("staff").select("*").eq("salon_id", salonData.id);
        setStaff(staffData || []);
        const { data: servicesData } = await supabase.from("services").select("*").eq("salon_id", salonData.id);
        setServices(servicesData || []);
      }
      setLoading(false);
    };
    loadData();
  }, [router]);

  const reloadAppts = async () => {
    if (!salon) return;
    const { data: appts } = await supabase.from("appointments").select("*, services(name, price), staff(name)").eq("salon_id", salon.id).order("date_time", { ascending: true });
    setAppointments(appts || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    if (editingId) {
      await supabase.from("appointments").update({
        client_name: formData.client_name, client_email: formData.client_email,
        client_phone: formData.client_phone, staff_id: formData.staff_id || null,
        service_id: formData.service_id, date_time: formData.date_time, status: formData.status,
      }).eq("id", editingId);
    } else {
      await supabase.from("appointments").insert({
        salon_id: salon.id, client_name: formData.client_name, client_email: formData.client_email,
        client_phone: formData.client_phone, staff_id: formData.staff_id || null,
        service_id: formData.service_id, date_time: formData.date_time, status: formData.status,
      });
    }
    setFormData({ client_name: "", client_email: "", client_phone: "", staff_id: "", service_id: "", date_time: "", status: "pending" });
    setShowForm(false);
    setEditingId(null);
    await reloadAppts();
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setFormData({
      client_name: a.client_name || "", client_email: a.client_email || "",
      client_phone: a.client_phone || "", staff_id: a.staff_id || "",
      service_id: a.service_id || "", date_time: a.date_time ? a.date_time.slice(0, 16) : "",
      status: a.status || "pending",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    await reloadAppts();
  };

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === "All") return true;
    const apptDate = new Date(a.date_time).toDateString();
    const today = new Date().toDateString();
    if (activeTab === "Today") return apptDate === today;
    if (activeTab === "Upcoming") return new Date(a.date_time) > new Date();
    return true;
  });

  // Calendar week
  const getWeekDays = () => {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F2F4F7" }}>
      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #E8EAF0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "17px", fontWeight: 500, color: "#0F172A" }}>Bookings</div>
          <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>{appointments.length} total appointments</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", background: "#F8F9FC", borderRadius: "8px", padding: "2px" }}>
            {(["table", "calendar"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: view === v ? "#fff" : "transparent", color: view === v ? "#0F172A" : "#94A3B8", fontSize: "12px", cursor: "pointer", boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {v === "table" ? "Table" : "Calendar"}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ client_name: "", client_email: "", client_phone: "", staff_id: "", service_id: "", date_time: "", status: "pending" }); }} style={{ background: "#4F6EF7", color: "#fff", fontSize: "13px", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
            + New Booking
          </button>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Form */}
        {showForm && (
          <div style={{ background: "#fff", border: "0.5px solid #E8EAF0", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
            <div style={{ fontSize: "15px", fontWeight: 500, color: "#0F172A", marginBottom: "18px" }}>{editingId ? "Edit Booking" : "New Booking"}</div>
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[
                { placeholder: "Client Name", value: formData.client_name, key: "client_name", type: "text" },
                { placeholder: "Client Email", value: formData.client_email, key: "client_email", type: "email" },
                { placeholder: "Client Phone", value: formData.client_phone, key: "client_phone", type: "tel" },
              ].map(f => (
                <input key={f.key} type={f.type} placeholder={f.placeholder} value={f.value}
                  onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                  required={f.key === "client_name"}
                  style={{ padding: "10px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px" }} />
              ))}
              <select value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })} required style={{ padding: "10px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px" }}>
                <option value="">Select Service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} — £{s.price}</option>)}
              </select>
              <select value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })} style={{ padding: "10px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px" }}>
                <option value="">Select Staff</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="datetime-local" value={formData.date_time} onChange={e => setFormData({ ...formData, date_time: e.target.value })} required style={{ padding: "10px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px" }} />
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ padding: "10px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px" }}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div style={{ display: "flex", gap: "8px", gridColumn: "1 / -1" }}>
                <button type="submit" style={{ flex: 1, padding: "10px", background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>{editingId ? "Update" : "Create"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} style={{ flex: 1, padding: "10px", background: "#E8EAF0", color: "#64748B", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {view === "table" ? (
          <div style={{ background: "#fff", border: "0.5px solid #E8EAF0", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "0.5px solid #E8EAF0" }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>All Bookings</div>
              <div style={{ display: "flex", gap: "4px" }}>
                {["All", "Today", "Upcoming"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "6px", border: "0.5px solid", borderColor: activeTab === tab ? "#C7D2FE" : "#E8EAF0", background: activeTab === tab ? "#EEF2FF" : "#fff", color: activeTab === tab ? "#4F6EF7" : "#94A3B8", cursor: "pointer" }}>{tab}</button>
                ))}
              </div>
            </div>
            {filteredAppointments.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>No bookings found</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                  <thead>
                    <tr style={{ background: "#F8F9FC" }}>
                      {["Status", "Client", "Service", "Staff", "Date & Time", "Amount", "Actions"].map(h => (
                        <th key={h} style={{ fontSize: "11px", color: "#94A3B8", textAlign: "left", padding: "10px 18px", fontWeight: 500, borderBottom: "0.5px solid #E8EAF0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(a => (
                      <tr key={a.id}>
                        <td style={{ padding: "11px 18px", borderBottom: "0.5px solid #F1F5F9" }}>
                          <span style={{ background: a.status === "confirmed" ? "#ECFDF5" : a.status === "cancelled" ? "#FEE2E2" : "#FFF7ED", color: a.status === "confirmed" ? "#059669" : a.status === "cancelled" ? "#DC2626" : "#D97706", fontSize: "10px", padding: "3px 8px", borderRadius: "20px" }}>{a.status}</span>
                        </td>
                        <td style={{ padding: "11px 18px", fontSize: "13px", color: "#0F172A", borderBottom: "0.5px solid #F1F5F9" }}>{a.client_name}</td>
                        <td style={{ padding: "11px 18px", fontSize: "13px", color: "#0F172A", borderBottom: "0.5px solid #F1F5F9" }}>{a.services?.name || "—"}</td>
                        <td style={{ padding: "11px 18px", fontSize: "13px", color: "#64748B", borderBottom: "0.5px solid #F1F5F9" }}>{a.staff?.name || "—"}</td>
                        <td style={{ padding: "11px 18px", fontSize: "13px", color: "#64748B", borderBottom: "0.5px solid #F1F5F9" }}>{new Date(a.date_time).toLocaleString("en-GB")}</td>
                        <td style={{ padding: "11px 18px", fontSize: "13px", color: "#0F172A", borderBottom: "0.5px solid #F1F5F9" }}>£{a.services?.price || "—"}</td>
                        <td style={{ padding: "11px 18px", fontSize: "13px", borderBottom: "0.5px solid #F1F5F9" }}>
                          <button onClick={() => handleEdit(a)} style={{ color: "#4F6EF7", background: "none", border: "none", cursor: "pointer", fontSize: "12px", marginRight: "8px" }}>Edit</button>
                          <button onClick={() => handleDelete(a.id)} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Calendar View
          <div style={{ background: "#fff", border: "0.5px solid #E8EAF0", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "0.5px solid #E8EAF0" }}>
              <button onClick={() => setWeekOffset(w => w - 1)} style={{ border: "0.5px solid #E8EAF0", background: "#fff", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "14px" }}>‹</button>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>
                {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => setWeekOffset(0)} style={{ border: "0.5px solid #E8EAF0", background: "#fff", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "12px", color: "#4F6EF7" }}>Today</button>
                <button onClick={() => setWeekOffset(w => w + 1)} style={{ border: "0.5px solid #E8EAF0", background: "#fff", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "14px" }}>›</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "0.5px solid #E8EAF0" }}>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} style={{ padding: "12px 8px", textAlign: "center", borderRight: i < 6 ? "0.5px solid #E8EAF0" : "none" }}>
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "4px" }}>{dayNames[day.getDay()]}</div>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isToday ? "#4F6EF7" : "transparent", color: isToday ? "#fff" : "#0F172A", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: "300px" }}>
              {weekDays.map((day, i) => {
                const dayAppts = appointments.filter(a => new Date(a.date_time).toDateString() === day.toDateString());
                return (
                  <div key={i} style={{ padding: "8px", borderRight: i < 6 ? "0.5px solid #E8EAF0" : "none", borderTop: "0.5px solid #F1F5F9", minHeight: "200px" }}>
                    {dayAppts.map(a => (
                      <div key={a.id} onClick={() => handleEdit(a)} style={{ background: "#EEF2FF", borderRadius: "6px", padding: "6px 8px", marginBottom: "4px", cursor: "pointer", borderLeft: "3px solid #4F6EF7" }}>
                        <div style={{ fontSize: "11px", fontWeight: 500, color: "#0F172A" }}>{new Date(a.date_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                        <div style={{ fontSize: "11px", color: "#4F6EF7" }}>{a.client_name}</div>
                        <div style={{ fontSize: "10px", color: "#94A3B8" }}>{a.services?.name}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}