"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getCurrentUserProfile } from "@/app/lib/auth";
import DashboardShell, { HamburgerBtn } from "./components/DashboardShell";
import StatCard from "./components/StatCard";
import Modal, { FormGroup, Input, Select, ModalActions, BtnPrimary, BtnSecondary } from "./components/Modal";
import EmptyState from "./components/EmptyState";
import { SkeletonDashboard } from "./components/SkeletonLoader";
import { useToast } from "./components/Toast";
import type { Salon, Appointment, Service, Offer } from "../types";

type StaffItem = { id: string; name: string };

const TIME_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];

const PILL: Record<string, { bg: string; color: string; border: string }> = {
  confirmed: { bg: "var(--green-light)",  color: "var(--green)",  border: "var(--green-pale)" },
  pending:   { bg: "var(--indigo-light)", color: "var(--indigo)", border: "var(--indigo-pale)" },
  cancelled: { bg: "var(--red-light)",    color: "var(--red)",    border: "var(--red-pale)" },
};

function StatusPill({ status }: { status: string }) {
  const s = PILL[status] || PILL.pending;
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: "0.1px" }}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });
  const [offerForm, setOfferForm] = useState({ title: "", description: "", discount_type: "percentage", discount_value: "", valid_until: "", active: true });

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile?.salon) { router.push("/login"); return; }
      setSalon(profile.salon);
      const id = profile.salon.id;
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: appts }, { data: staffData }, { data: svcs }, { data: ofrs }] = await Promise.all([
        supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id", id).order("date_time", { ascending: true }),
        supabase.from("staff").select("id,name").eq("salon_id", id),
        supabase.from("services").select("*").eq("salon_id", id),
        supabase.from("offers").select("*").eq("salon_id", id).eq("active", true).or(`valid_until.is.null,valid_until.gte.${today}`).order("created_at", { ascending: false }),
      ]);
      setAppointments(appts || []);
      setStaff(staffData || []);
      setServices(svcs || []);
      setOffers(ofrs || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const reloadAppts = useCallback(async () => {
    if (!salon) return;
    const { data } = await supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id", salon.id).order("date_time", { ascending: true });
    setAppointments(data || []);
  }, [salon]);

  const handleNewBooking = useCallback(async () => {
    if (!salon || !formData.client_name || !formData.date || !formData.time) { toast.error("Please fill required fields"); return; }
    const date_time = new Date(formData.date + "T" + formData.time).toISOString();
    const { error } = await supabase.from("appointments").insert({ salon_id: salon.id, client_name: formData.client_name, client_email: formData.client_email, client_phone: formData.client_phone, service_id: formData.service_id || null, staff_id: formData.staff_id || null, date_time, status: "confirmed" });
    if (error) { toast.error("Failed to create booking"); return; }
    const svc = services.find(s => s.id === formData.service_id);
    const stf = staff.find(s => s.id === formData.staff_id);
    await fetch("/api/send-booking-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientEmail: formData.client_email, clientName: formData.client_name, clientPhone: formData.client_phone, serviceName: svc?.name || "Service", dateTime: date_time, staffName: stf?.name, salonName: salon.name, salonOwnerEmail: salon.owner_email }) });
    toast.success("Booking created!");
    setShowModal(false);
    setFormData({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });
    await reloadAppts();
  }, [salon, formData, services, staff, toast, reloadAppts]);

  const handleAddOffer = useCallback(async () => {
    if (!salon || !offerForm.title) { toast.error("Title is required"); return; }
    const { data, error } = await supabase.from("offers").insert({ salon_id: salon.id, title: offerForm.title, description: offerForm.description, discount_type: offerForm.discount_type, discount_value: parseFloat(offerForm.discount_value) || 0, valid_until: offerForm.valid_until || null, active: offerForm.active }).select();
    if (error) { toast.error("Failed to add offer"); return; }
    if (data) setOffers(p => [data[0], ...p]);
    toast.success("Offer added!");
    setShowOfferModal(false);
    setOfferForm({ title: "", description: "", discount_type: "percentage", discount_value: "", valid_until: "", active: true });
  }, [salon, offerForm, toast]);

  const handleToggleOffer = useCallback(async (id: string, current: boolean) => {
    await supabase.from("offers").update({ active: !current }).eq("id", id);
    setOffers(p => p.map(o => o.id === id ? { ...o, active: !current } : o));
  }, []);

  const handleDeleteOffer = useCallback(async (id: string) => {
    await supabase.from("offers").delete().eq("id", id);
    setOffers(p => p.filter(o => o.id !== id));
    toast.success("Offer deleted");
  }, [toast]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`${origin}/book/${salon?.slug}`);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [origin, salon, toast]);

  const now = new Date();
  const todayStr = now.toDateString();
  const todayAppts = useMemo(() => appointments.filter(a => new Date(a.date_time).toDateString() === todayStr), [appointments, todayStr]);
  const upcomingAppts = useMemo(() => appointments.filter(a => new Date(a.date_time) > now).slice(0, 5), [appointments]);
  const revenue = useMemo(() => todayAppts.reduce((s, a) => s + (a.services?.price || 0), 0), [todayAppts]);
  const filteredAppts = useMemo(() => {
    if (activeTab === "Today") return todayAppts;
    if (activeTab === "Upcoming") return appointments.filter(a => new Date(a.date_time) > now);
    return appointments;
  }, [activeTab, appointments, todayAppts, now]);

  const greeting = useMemo(() => { const h = now.getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }, []);
  const bookingLink = `${origin}/book/${salon?.slug}`;

  if (loading) return (
    <DashboardShell salonName="" topbar={
      <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 20px", height: 58, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 12, borderRadius: 6 }} className="skeleton" />
        <div style={{ width: 120, height: 12, borderRadius: 6 }} className="skeleton" />
      </header>
    }>
      <SkeletonDashboard />
    </DashboardShell>
  );

  const Topbar = (
    <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HamburgerBtn onClick={() => setSidebarOpen(!sidebarOpen)} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.25px" }}>{greeting} ??</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
      </div>
      <button
        onClick={() => setShowModal(true)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--indigo)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", boxShadow: "var(--shadow-indigo)", whiteSpace: "nowrap", transition: "all 0.14s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--indigo-dark)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--indigo)"; e.currentTarget.style.transform = "none"; }}
      >+ New Booking</button>
    </header>
  );

  return (
    <DashboardShell salonName={salon?.name} topbar={Topbar}>
      <div style={{ padding: "24px 20px" }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.7px" }}>{salon?.name}</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 3 }}>Salon dashboard overview</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
          <StatCard label="Today's Bookings" value={todayAppts.length} icon="??" color="indigo" />
          <StatCard label="Revenue Today" value={`�${revenue}`} icon="??" color="green" />
          <StatCard label="Total Bookings" value={appointments.length} icon="??" color="amber" />
          <StatCard label="Current Plan" value="" icon="?" color="slate" badge={salon?.plan || "Starter"} />
        </div>

        {/* Booking link banner */}
        <div style={{ background: "linear-gradient(135deg,#4338CA 0%,#6366F1 60%,#818CF8 100%)", borderRadius: "var(--r-lg)", padding: "18px 22px", marginBottom: 20, boxShadow: "var(--shadow-indigo)", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 4 }}>?? Your Booking Link</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "monospace", wordBreak: "break-all" }}>{salon?.slug ? bookingLink : "Loading..."}</div>
          </div>
          <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 1 }}>
            <button onClick={handleCopyLink} style={{ padding: "8px 16px", background: copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.12)", color: "#fff", border: `1px solid ${copied ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.2)"}`, borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
              {copied ? "? Copied!" : "Copy Link"}
            </button>
            <button onClick={() => window.open(`/book/${salon?.slug}`, "_blank")} style={{ padding: "8px 16px", background: "#fff", color: "var(--indigo-dark)", border: "none", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
              Preview ?
            </button>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.25px" }}>Upcoming Appointments</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>Next {upcomingAppts.length} bookings</div>
            </div>
          </div>
          {upcomingAppts.length === 0 ? (
            <EmptyState icon="??" title="No upcoming appointments" description="Share your booking link to get started" action={{ label: "Copy Link", onClick: handleCopyLink }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {upcomingAppts.map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < upcomingAppts.length - 1 ? "1px solid var(--slate-100)" : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--slate-50)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: "var(--r-sm)", background: "var(--indigo-light)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--indigo)", lineHeight: 1 }}>{new Date(a.date_time).toLocaleDateString("en-GB", { day: "numeric" })}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "var(--indigo)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{new Date(a.date_time).toLocaleDateString("en-GB", { month: "short" })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.client_name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{a.services?.name || "No service"} {a.staff?.name ? `� ${a.staff.name}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{new Date(a.date_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                    {a.services?.price ? <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>�{a.services.price}</div> : null}
                  </div>
                  <StatusPill status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offers */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Special Offers</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>Shown on your public booking page</div>
            </div>
            <button onClick={() => setShowOfferModal(true)} style={{ padding: "7px 14px", background: "var(--green-light)", color: "var(--green-dark)", border: "1px solid var(--green-pale)", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--green-pale)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--green-light)"; }}
            >+ Add Offer</button>
          </div>
          {offers.length === 0 ? (
            <EmptyState icon="??" title="No offers yet" description="Add a special offer to attract more bookings" action={{ label: "+ Add Offer", onClick: () => setShowOfferModal(true) }} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, padding: 16 }}>
              {offers.map(offer => {
                const label = offer.discount_type === "percentage" ? `${offer.discount_value}% off` : `�${offer.discount_value} off`;
                const expired = offer.valid_until && new Date(offer.valid_until) < new Date();
                return (
                  <div key={offer.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", opacity: offer.active ? 1 : 0.5, transition: "all 0.14s", background: "#fff" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--indigo-pale)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.2px", lineHeight: 1.3 }}>{offer.title}</div>
                      <label style={{ position: "relative", width: 32, height: 17, flexShrink: 0, cursor: "pointer" }}>
                        <input type="checkbox" checked={offer.active} onChange={() => handleToggleOffer(offer.id, offer.active)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: "absolute", inset: 0, background: offer.active ? "var(--green)" : "var(--slate-300)", borderRadius: 99, transition: "background 0.18s" }}>
                          <span style={{ position: "absolute", width: 11, height: 11, left: offer.active ? 18 : 3, top: 3, background: "#fff", borderRadius: "50%", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                        </span>
                      </label>
                    </div>
                    {offer.description && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 8 }}>{offer.description}</div>}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "var(--green-light)", color: "var(--green)", border: "1px solid var(--green-pale)", marginBottom: 8 }}>?? {label}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11, color: expired ? "var(--red)" : "var(--text-3)" }}>{expired ? "?? Expired" : offer.valid_until ? `Until ${new Date(offer.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No expiry"}</div>
                      <button onClick={() => handleDeleteOffer(offer.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 14, padding: "2px 4px", transition: "color 0.12s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
                      >??</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Appointments */}
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Appointments</div>
            <div style={{ display: "flex", gap: 2, background: "var(--slate-100)", padding: 3, borderRadius: 8 }}>
              {["All","Today","Upcoming"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "none", background: activeTab === t ? "#fff" : "transparent", color: activeTab === t ? "var(--indigo)" : "var(--text-3)", cursor: "pointer", fontWeight: activeTab === t ? 700 : 500, boxShadow: activeTab === t ? "var(--shadow-xs)" : "none", transition: "all 0.12s" }}>{t}</button>
              ))}
            </div>
          </div>
          {filteredAppts.length === 0 ? (
            <EmptyState icon="??" title="No appointments" description="Share your booking link to get started" />
          ) : (
            <>
              {/* Desktop table */}
              <div style={{ overflowX: "auto", display: "block" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr style={{ background: "var(--slate-50)" }}>
                      {["Status","Client","Service","Staff","Date & Time","Amount"].map(h => (
                        <th key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textAlign: "left", padding: "10px 20px", letterSpacing: "0.5px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppts.map(a => (
                      <tr key={a.id} style={{ transition: "background 0.1s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--slate-50)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--slate-100)" }}><StatusPill status={a.status} /></td>
                        <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{a.client_name}</td>
                        <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, color: "var(--text-2)" }}>{a.services?.name || "�"}</td>
                        <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, color: "var(--text-3)" }}>{a.staff?.name || "�"}</td>
                        <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, color: "var(--text-2)" }}>{new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td style={{ padding: "13px 20px", borderBottom: "1px solid var(--slate-100)", fontSize: 13, fontWeight: 700, color: "var(--green)" }}>{a.services?.price ? `�${a.services.price}` : "�"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Booking Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Booking">
        <FormGroup label="Client Name *"><Input placeholder="Sarah Johnson" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} /></FormGroup>
        <FormGroup label="Email"><Input type="email" placeholder="sarah@email.com" value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value })} /></FormGroup>
        <FormGroup label="Phone"><Input placeholder="+44 7700 900000" value={formData.client_phone} onChange={e => setFormData({ ...formData, client_phone: e.target.value })} /></FormGroup>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormGroup label="Date *"><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></FormGroup>
          <FormGroup label="Time *"><Select value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}><option value="">Select time</option>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</Select></FormGroup>
        </div>
        <FormGroup label="Service"><Select value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })}><option value="">Select service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} � �{s.price}</option>)}</Select></FormGroup>
        <FormGroup label="Staff"><Select value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })}><option value="">Select staff</option>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormGroup>
        <ModalActions><BtnSecondary onClick={() => setShowModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleNewBooking} disabled={!formData.client_name || !formData.date || !formData.time}>Create Booking</BtnPrimary></ModalActions>
      </Modal>

      {/* Add Offer Modal */}
      <Modal open={showOfferModal} onClose={() => setShowOfferModal(false)} title="Add Special Offer">
        <FormGroup label="Offer Title *"><Input placeholder="e.g. Summer Special" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} /></FormGroup>
        <FormGroup label="Description"><textarea placeholder="Get 20% off any haircut this month" value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "10px 13px", border: "1px solid var(--border-2)", borderRadius: "var(--r-sm)", fontSize: 14, resize: "vertical", fontFamily: "var(--font)", outline: "none" }} /></FormGroup>
        <FormGroup label="Discount">
          <div style={{ display: "flex", gap: 8 }}>
            <Select value={offerForm.discount_type} onChange={e => setOfferForm({ ...offerForm, discount_type: e.target.value })} style={{ flex: "0 0 150px" }}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed Amount (�)</option></Select>
            <Input type="number" min="0" placeholder={offerForm.discount_type === "percentage" ? "e.g. 20" : "e.g. 10"} value={offerForm.discount_value} onChange={e => setOfferForm({ ...offerForm, discount_value: e.target.value })} />
          </div>
        </FormGroup>
        <FormGroup label="Valid Until (optional)"><Input type="date" value={offerForm.valid_until} onChange={e => setOfferForm({ ...offerForm, valid_until: e.target.value })} /></FormGroup>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--slate-50)", borderRadius: "var(--r-sm)", marginBottom: 4, border: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Show on booking page</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>Clients will see this offer immediately</div>
          </div>
          <label style={{ position: "relative", width: 32, height: 17, cursor: "pointer" }}>
            <input type="checkbox" checked={offerForm.active} onChange={e => setOfferForm({ ...offerForm, active: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", inset: 0, background: offerForm.active ? "var(--green)" : "var(--slate-300)", borderRadius: 99, transition: "background 0.18s" }}>
              <span style={{ position: "absolute", width: 11, height: 11, left: offerForm.active ? 18 : 3, top: 3, background: "#fff", borderRadius: "50%", transition: "left 0.18s" }} />
            </span>
          </label>
        </div>
        <ModalActions><BtnSecondary onClick={() => setShowOfferModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleAddOffer} disabled={!offerForm.title}>Save Offer</BtnPrimary></ModalActions>
      </Modal>
    </DashboardShell>
  );
}
