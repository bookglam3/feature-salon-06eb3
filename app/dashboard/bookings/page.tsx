"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import DashboardShell, { HamburgerBtn } from "../components/DashboardShell";
import Modal, { FormGroup, Input, Select, ModalActions, BtnPrimary, BtnSecondary } from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { SkeletonDashboard } from "../components/SkeletonLoader";
import { useToast } from "../components/Toast";
import type { Appointment, Service } from "../../types";

type StaffItem = { id: string; name: string };

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  confirmed: { bg: "var(--green-light)",  color: "var(--green)",  border: "var(--green-pale)" },
  pending:   { bg: "var(--indigo-light)", color: "var(--indigo)", border: "var(--indigo-pale)" },
  cancelled: { bg: "var(--red-light)",    color: "var(--red)",    border: "var(--red-pale)" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}

const EMPTY_FORM = { client_name: "", client_email: "", client_phone: "", staff_id: "", service_id: "", date_time: "", status: "pending" };

export default function BookingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [salon, setSalon] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [view, setView] = useState<"table"|"calendar">("table");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: salonData } = await supabase.from("salons").select("*").eq("owner_id", user.id).single();
      setSalon(salonData);
      if (salonData) {
        const [{ data: appts }, { data: staffData }, { data: svcs }] = await Promise.all([
          supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id", salonData.id).order("date_time", { ascending: true }),
          supabase.from("staff").select("id,name").eq("salon_id", salonData.id),
          supabase.from("services").select("*").eq("salon_id", salonData.id),
        ]);
        setAppointments(appts || []);
        setStaff(staffData || []);
        setServices(svcs || []);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const reloadAppts = useCallback(async () => {
    if (!salon) return;
    const { data } = await supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id", salon.id).order("date_time", { ascending: true });
    setAppointments(data || []);
  }, [salon]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    if (editingId) {
      const { error } = await supabase.from("appointments").update({ client_name: formData.client_name, client_email: formData.client_email, client_phone: formData.client_phone, staff_id: formData.staff_id || null, service_id: formData.service_id, date_time: formData.date_time, status: formData.status }).eq("id", editingId);
      if (error) { toast.error("Failed to update booking"); return; }
      toast.success("Booking updated!");
    } else {
      const { error } = await supabase.from("appointments").insert({ salon_id: salon.id, client_name: formData.client_name, client_email: formData.client_email, client_phone: formData.client_phone, staff_id: formData.staff_id || null, service_id: formData.service_id, date_time: formData.date_time, status: formData.status });
      if (error) { toast.error("Failed to create booking"); return; }
      toast.success("Booking created!");
    }
    setFormData(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    await reloadAppts();
  }, [salon, editingId, formData, toast, reloadAppts]);

  const handleEdit = useCallback((a: Appointment) => {
    setEditingId(a.id);
    setFormData({ client_name: a.client_name || "", client_email: a.client_email || "", client_phone: a.client_phone || "", staff_id: a.staff_id || "", service_id: a.service_id || "", date_time: a.date_time ? a.date_time.slice(0,16) : "", status: a.status || "pending" });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Booking deleted");
    await reloadAppts();
  }, [toast, reloadAppts]);

  const now = new Date();
  const filtered = useMemo(() => {
    let list = appointments;
    if (activeTab === "Today") list = list.filter(a => new Date(a.date_time).toDateString() === now.toDateString());
    else if (activeTab === "Upcoming") list = list.filter(a => new Date(a.date_time) > now);
    if (search) list = list.filter(a => a.client_name?.toLowerCase().includes(search.toLowerCase()) || a.services?.name?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [appointments, activeTab, search, now]);

  const getWeekDays = useCallback(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
  }, [weekOffset]);

  const weekDays = getWeekDays();

  if (loading) return <DashboardShell salonName=""><SkeletonDashboard /></DashboardShell>;

  const Topbar = (
    <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HamburgerBtn onClick={() => {}} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.3px" }}>Bookings</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{appointments.length} total appointments</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", background: "var(--slate-100)", borderRadius: 8, padding: 3 }}>
          {(["table","calendar"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: view === v ? "#fff" : "transparent", color: view === v ? "var(--text-1)" : "var(--text-3)", fontSize: 12, cursor: "pointer", fontWeight: view === v ? 600 : 400, boxShadow: view === v ? "var(--shadow-xs)" : "none", transition: "all 0.12s" }}>
              {v === "table" ? "Table" : "Calendar"}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(EMPTY_FORM); }} style={{ background: "var(--indigo)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", boxShadow: "var(--shadow-indigo)", whiteSpace: "nowrap", transition: "all 0.14s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--indigo-dark)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--indigo)"; }}
        >+ New Booking</button>
      </div>
    </header>
  );

  return (
    <DashboardShell salonName={salon?.name} topbar={Topbar}>
      <div style={{ padding: "24px 20px" }}>

        {/* Search + Tabs bar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or service..." style={{ flex: 1, minWidth: 160, padding: "9px 13px", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", fontSize: 13.5, fontFamily: "var(--font)", outline: "none", color: "var(--text-1)" }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--indigo)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
          <div style={{ display: "flex", gap: 2, background: "var(--slate-100)", padding: 3, borderRadius: 8 }}>
            {["All","Today","Upcoming"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: activeTab === t ? "#fff" : "transparent", color: activeTab === t ? "var(--indigo)" : "var(--text-3)", cursor: "pointer", fontWeight: activeTab === t ? 700 : 500, boxShadow: activeTab === t ? "var(--shadow-xs)" : "none", transition: "all 0.12s" }}>{t}</button>
            ))}
          </div>
        </div>

        {view === "table" ? (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <EmptyState icon="??" title="No bookings found" description={search ? "Try a different search term" : "Create your first booking"} action={{ label: "+ New Booking", onClick: () => setShowForm(true) }} />
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: "var(--slate-50)" }}>
                        {["Status","Client","Service","Staff","Date & Time","Amount","Actions"].map(h => (
                          <th key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textAlign: "left", padding: "10px 18px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(a => (
                        <tr key={a.id}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--slate-50)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                          style={{ transition: "background 0.1s" }}
                        >
                          <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--slate-100)" }}><StatusPill status={a.status} /></td>
                          <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{a.client_name}</td>
                          <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, color: "var(--text-2)" }}>{a.services?.name || "�"}</td>
                          <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, color: "var(--text-3)" }}>{a.staff?.name || "�"}</td>
                          <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, color: "var(--text-2)" }}>{new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                          <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, fontWeight: 700, color: "var(--green)" }}>{a.services?.price ? `�${a.services.price}` : "�"}</td>
                          <td style={{ padding: "12px 18px", borderBottom: "1px solid var(--slate-100)", whiteSpace: "nowrap" }}>
                            <button onClick={() => handleEdit(a)} style={{ color: "var(--indigo)", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 10, fontFamily: "var(--font)" }}>Edit</button>
                            <button onClick={() => handleDelete(a.id)} style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font)" }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => setWeekOffset(w => w - 1)} style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: "var(--r-sm)", padding: "5px 12px", cursor: "pointer", fontSize: 14, color: "var(--text-2)" }}>�</button>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                {weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} � {weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setWeekOffset(0)} style={{ border: "1px solid var(--indigo-pale)", background: "var(--indigo-light)", borderRadius: "var(--r-sm)", padding: "5px 12px", cursor: "pointer", fontSize: 12, color: "var(--indigo)", fontWeight: 600 }}>Today</button>
                <button onClick={() => setWeekOffset(w => w + 1)} style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: "var(--r-sm)", padding: "5px 12px", cursor: "pointer", fontSize: 14, color: "var(--text-2)" }}>�</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} style={{ padding: "10px 8px", textAlign: "center", borderRight: i < 6 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day.getDay()]}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isToday ? "var(--indigo)" : "transparent", color: isToday ? "#fff" : "var(--text-1)", fontSize: 13, fontWeight: isToday ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", minHeight: 280, overflowX: "auto" }}>
              {weekDays.map((day, i) => {
                const dayAppts = appointments.filter(a => new Date(a.date_time).toDateString() === day.toDateString());
                return (
                  <div key={i} style={{ padding: 6, borderRight: i < 6 ? "1px solid var(--border)" : "none", minHeight: 200 }}>
                    {dayAppts.map(a => (
                      <div key={a.id} onClick={() => handleEdit(a)} style={{ background: "var(--indigo-light)", borderRadius: 6, padding: "5px 7px", marginBottom: 4, cursor: "pointer", borderLeft: "3px solid var(--indigo)", transition: "all 0.12s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--indigo-pale)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--indigo-light)"; }}
                      >
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-1)" }}>{new Date(a.date_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                        <div style={{ fontSize: 10.5, color: "var(--indigo)", fontWeight: 500 }}>{a.client_name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-3)" }}>{a.services?.name}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? "Edit Booking" : "New Booking"}>
        <form onSubmit={handleSubmit}>
          <FormGroup label="Client Name *"><Input placeholder="Sarah Johnson" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} required /></FormGroup>
          <FormGroup label="Email"><Input type="email" placeholder="sarah@email.com" value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value })} /></FormGroup>
          <FormGroup label="Phone"><Input placeholder="+44 7700 900000" value={formData.client_phone} onChange={e => setFormData({ ...formData, client_phone: e.target.value })} /></FormGroup>
          <FormGroup label="Date & Time *"><Input type="datetime-local" value={formData.date_time} onChange={e => setFormData({ ...formData, date_time: e.target.value })} required /></FormGroup>
          <FormGroup label="Service"><Select value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })}><option value="">Select service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} � �{s.price}</option>)}</Select></FormGroup>
          <FormGroup label="Staff"><Select value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })}><option value="">Select staff</option>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormGroup>
          <FormGroup label="Status"><Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></Select></FormGroup>
          <ModalActions><BtnSecondary type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</BtnSecondary><BtnPrimary type="submit">{editingId ? "Update" : "Create"}</BtnPrimary></ModalActions>
        </form>
      </Modal>
    </DashboardShell>
  );
}
