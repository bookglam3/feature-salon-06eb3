"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getCurrentUserProfile } from "@/app/lib/auth";
import DashboardShell, { HamburgerBtn } from "./components/DashboardShell";
import Modal, { FormGroup, Input, Select, ModalActions, BtnPrimary, BtnSecondary } from "./components/Modal";
import EmptyState from "./components/EmptyState";
import { SkeletonDashboard } from "./components/SkeletonLoader";
import { useToast } from "./components/Toast";
import type { Salon, Appointment, Service, Offer } from "../types";

type StaffItem = { id: string; name: string };

const TIME_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];

const PLAN_FEATURES: Record<string, { color: string; bg: string; border: string; badge: string; features: string[]; limit: string }> = {
  Starter: { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", badge: "STARTER", features: ["Up to 50 bookings/mo", "1 staff member", "Basic analytics", "Email notifications", "Public booking page"], limit: "50 bookings/month" },
  Professional: { color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", badge: "PROFESSIONAL", features: ["Unlimited bookings", "Up to 5 staff", "Advanced analytics", "SMS + Email", "Custom offers", "Priority support"], limit: "Unlimited bookings" },
  Growth: { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", badge: "GROWTH", features: ["Unlimited bookings", "Up to 15 staff", "Revenue reports", "SMS + Email + WhatsApp", "Staff performance", "API access"], limit: "Unlimited bookings" },
  Enterprise: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", badge: "ENTERPRISE", features: ["Unlimited everything", "Unlimited staff", "White-label option", "Dedicated support", "Custom integrations", "SLA 99.9%"], limit: "Unlimited everything" },
};

/* ─── STATUS PILL ─────────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    confirmed: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0", dot: "#10B981" },
    pending: { bg: "#FEF9C3", color: "#B45309", border: "#FDE68A", dot: "#F59E0B" },
    cancelled: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", dot: "#EF4444" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: "0.2px", textTransform: "capitalize", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

/* ─── QUICK ACTION ────────────────────────────────────────────── */
function QuickAction({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 14px", background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 16, cursor: "pointer", transition: "all 0.18s ease", flex: 1, minWidth: 76, fontFamily: "inherit" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 8px 24px ${color}25`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = `${color}08`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#F1F5F9"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "#fff"; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 13, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, transition: "transform 0.18s" }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", whiteSpace: "nowrap", letterSpacing: "0.1px" }}>{label}</span>
    </button>
  );
}

/* ─── MINI STAT ───────────────────────────────────────────────── */
function MiniStat({ label, value, color, icon, sub }: { label: string; value: string | number; color: string; icon: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 18, padding: "20px 18px", position: "relative", overflow: "hidden", transition: "all 0.18s ease", cursor: "default" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 32px ${color}20`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "#F1F5F9"; }}
    >
      {/* top color bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: "18px 18px 0 0" }} />
      {/* bg circle */}
      <div style={{ position: "absolute", bottom: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}08` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

/* ─── SEARCH BAR ──────────────────────────────────────────────── */
function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "8px 14px", minWidth: 220, transition: "border-color 0.15s" }}
      onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#6366F1"; (e.currentTarget as HTMLDivElement).style.background = "#fff"; }}
      onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLDivElement).style.background = "#F8FAFC"; }}
    >
      <span style={{ fontSize: 15, color: "#94A3B8" }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Search..."} style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#1E293B", fontFamily: "inherit", width: "100%" }} />
      {value && <button onClick={() => onChange("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>}
    </div>
  );
}

/* ─── REVENUE MINI BARS ───────────────────────────────────────── */
function RevenueMiniChart({ appointments }: { appointments: Appointment[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const dayRevenue = days.map((_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (now.getDay() - 1 - i));
    return appointments.filter(a => {
      const ad = new Date(a.date_time);
      return ad.toDateString() === d.toDateString() && a.status === "confirmed";
    }).reduce((s, a) => s + (a.services?.price || 0), 0);
  });
  const max = Math.max(...dayRevenue, 1);
  const todayIdx = (now.getDay() + 6) % 7;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60, paddingTop: 8 }}>
      {dayRevenue.map((rev, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div title={`£${rev}`} style={{ width: "100%", borderRadius: "5px 5px 0 0", height: `${Math.max((rev / max) * 52, 4)}px`, background: i === todayIdx ? "linear-gradient(180deg,#6366F1,#4F46E5)" : "#E0E7FF", transition: "all 0.3s ease", cursor: "default" }} />
          <span style={{ fontSize: 9, color: i === todayIdx ? "#6366F1" : "#94A3B8", fontWeight: i === todayIdx ? 800 : 500 }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────── */
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
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
      setAppointments(appts || []); setStaff(staffData || []); setServices(svcs || []); setOffers(ofrs || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const reloadAppts = useCallback(async () => {
    if (!salon) return;
    const { data } = await supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id", salon.id).order("date_time", { ascending: true });
    setAppointments(data || []);
  }, [salon]);

  /* ── Update appointment status ── */
  const handleUpdateStatus = useCallback(async (id: string, status: "confirmed" | "pending" | "cancelled") => {
    setUpdatingId(id);
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); }
    else {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success(`Appointment ${status}`);
    }
    setUpdatingId(null);
  }, [toast]);

  /* ── Delete appointment ── */
  const handleDeleteAppt = useCallback(async (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    toast.success("Appointment deleted");
  }, [toast]);

  const handleNewBooking = useCallback(async () => {
    if (!salon || !formData.client_name || !formData.date || !formData.time) { toast.error("Fill required fields"); return; }
    const date_time = new Date(formData.date + "T" + formData.time).toISOString();
    const { error } = await supabase.from("appointments").insert({ salon_id: salon.id, client_name: formData.client_name, client_email: formData.client_email, client_phone: formData.client_phone, service_id: formData.service_id || null, staff_id: formData.staff_id || null, date_time, status: "confirmed" });
    if (error) { toast.error("Failed to create booking"); return; }
    const svc = services.find(s => s.id === formData.service_id);
    const stf = staff.find(s => s.id === formData.staff_id);
    await fetch("/api/send-booking-emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientEmail: formData.client_email, clientName: formData.client_name, clientPhone: formData.client_phone, serviceName: svc?.name || "Service", dateTime: date_time, staffName: stf?.name, salonName: salon.name, salonOwnerEmail: salon.owner_email }) });
    toast.success("Booking created successfully!");
    setShowModal(false);
    setFormData({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });
    await reloadAppts();
  }, [salon, formData, services, staff, toast, reloadAppts]);

  const handleAddOffer = useCallback(async () => {
    if (!salon || !offerForm.title) { toast.error("Title required"); return; }
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
    toast.success(current ? "Offer paused" : "Offer activated");
  }, [toast]);

  const handleDeleteOffer = useCallback(async (id: string) => {
    await supabase.from("offers").delete().eq("id", id);
    setOffers(p => p.filter(o => o.id !== id));
    toast.success("Offer removed");
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`${origin}/book/${salon?.slug}`);
    setCopied(true);
    toast.success("Booking link copied!");
    setTimeout(() => setCopied(false), 2500);
  }, [origin, salon, toast]);

  /* ── Export CSV ── */
  const handleExportCSV = useCallback(() => {
    const rows = [["Client", "Service", "Staff", "Date & Time", "Amount", "Status"]];
    appointments.forEach(a => {
      rows.push([a.client_name, a.services?.name || "", a.staff?.name || "", new Date(a.date_time).toLocaleString("en-GB"), a.services?.price ? `£${a.services.price}` : "", a.status]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    toast.success("CSV exported!");
  }, [appointments, toast]);

  /* ── Computed values ── */
  const now = new Date();
  const todayStr = now.toDateString();
  const todayAppts = useMemo(() => appointments.filter(a => new Date(a.date_time).toDateString() === todayStr), [appointments, todayStr]);
  const upcomingAppts = useMemo(() => appointments.filter(a => new Date(a.date_time) > now), [appointments]);
  const confirmedAppts = useMemo(() => appointments.filter(a => a.status === "confirmed"), [appointments]);
  const pendingAppts = useMemo(() => appointments.filter(a => a.status === "pending"), [appointments]);
  const revenue = useMemo(() => todayAppts.reduce((s, a) => s + (a.services?.price || 0), 0), [todayAppts]);
  const totalRevenue = useMemo(() => confirmedAppts.reduce((s, a) => s + (a.services?.price || 0), 0), [confirmedAppts]);

  const filteredAppts = useMemo(() => {
    let list = appointments;
    if (activeTab === "Today") list = todayAppts;
    if (activeTab === "Upcoming") list = upcomingAppts;
    if (activeTab === "Confirmed") list = confirmedAppts;
    if (activeTab === "Pending") list = pendingAppts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.client_name?.toLowerCase().includes(q) || a.services?.name?.toLowerCase().includes(q) || a.staff?.name?.toLowerCase().includes(q));
    }
    return list;
  }, [activeTab, appointments, todayAppts, upcomingAppts, confirmedAppts, pendingAppts, searchQuery]);

  const greeting = useMemo(() => { const h = now.getHours(); return h < 12 ? "Good morning ☀️" : h < 17 ? "Good afternoon 👋" : "Good evening 🌙"; }, []);
  const plan = salon?.plan || "Starter";
  const planInfo = PLAN_FEATURES[plan] || PLAN_FEATURES.Starter;

  const salonAny = salon as unknown as Record<string, unknown>;
  const subStatus = salonAny?.subscription_status as string || "trial";
  const subPlan = salonAny?.subscription_plan as string || "starter";
  const trialEnd = salonAny?.trial_ends_at as string | null || null;
  const periodEnd = salonAny?.current_period_end as string | null || null;
  const hasCustId = !!(salonAny?.stripe_customer_id);
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000)) : 0;

  const SUB_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    trial: { label: "Free Trial", color: "#6366F1", bg: "#EEF2FF" },
    trialing: { label: "Trial", color: "#8B5CF6", bg: "#F5F3FF" },
    active: { label: "Active", color: "#059669", bg: "#D1FAE5" },
    past_due: { label: "Past Due", color: "#D97706", bg: "#FEF3C7" },
    cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
    unpaid: { label: "Unpaid", color: "#DC2626", bg: "#FEE2E2" },
  };
  const statusBadge = SUB_STATUS_MAP[subStatus] || SUB_STATUS_MAP.trial;
  const PLAN_PRICE: Record<string, string> = { starter: "£29", pro: "£59", business: "£99" };

  const handleManageSub = async () => {
    if (!hasCustId) { router.push("/subscribe"); return; }
    const res = await fetch("/api/subscription/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ salonId: salon?.id }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else toast.error("Could not open billing portal");
  };

  /* ── Loading ── */
  if (loading) return (
    <DashboardShell salonName="" topbar={<header style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", height: 58, display: "flex", alignItems: "center", padding: "0 20px", gap: 14 }}><div style={{ width: 36, height: 12, borderRadius: 6 }} className="skeleton" /><div style={{ width: 140, height: 12, borderRadius: 6 }} className="skeleton" /></header>}>
      <SkeletonDashboard />
    </DashboardShell>
  );

  /* ── Topbar ── */
  const Topbar = (
    <header style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HamburgerBtn onClick={() => { }} />
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.4px" }}>{greeting}, {salon?.name?.split(" ")[0]}</div>
          <div className="dash-greeting-date" style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 1 }}>{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Plan badge */}
        <div className="dash-topbar-badge" style={{ padding: "5px 14px", borderRadius: 99, background: planInfo.bg, border: `1.5px solid ${planInfo.border}`, fontSize: 10.5, fontWeight: 900, color: planInfo.color, letterSpacing: "1px" }}>{planInfo.badge}</div>
        {/* Export */}
        <button onClick={handleExportCSV} title="Export CSV" className="dash-topbar-export"
          style={{ width: 38, height: 38, borderRadius: 10, background: "#F8FAFC", border: "1.5px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.borderColor = "#6366F1"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
        >📥</button>
        {/* New Booking */}
        <button onClick={() => setShowModal(true)} className="dash-topbar-newbtn"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)", color: "#fff", fontSize: 13.5, fontWeight: 800, padding: "10px 22px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)", whiteSpace: "nowrap", letterSpacing: "-0.2px", transition: "all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.35)"; }}
        >＋ New Booking</button>
      </div>
    </header>
  );

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <DashboardShell salonName={salon?.name} topbar={Topbar}>
      <style>{`
        @media(max-width:640px){
          .dash-wrap{padding:14px 12px!important}
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important}
          .dash-banner{padding:20px 18px!important;border-radius:16px!important}
          .dash-banner h1{font-size:22px!important;letter-spacing:-0.5px!important}
          .dash-banner-meta{font-size:12px!important}
          .dash-banner-btns{gap:8px!important}
          .dash-banner-btns button,.dash-banner-btns a{padding:8px 12px!important;font-size:12px!important}
          .dash-topbar-badge{display:none!important}
          .dash-topbar-export{display:none!important}
          .dash-topbar-newbtn{padding:9px 14px!important;font-size:13px!important}
          .dash-greeting-date{display:none!important}
          .dash-quick-scroll{-webkit-overflow-scrolling:touch;scrollbar-width:none}
          .dash-quick-scroll::-webkit-scrollbar{display:none}
          .dash-quick-scroll>button{min-width:70px!important;padding:12px 8px!important}
          .dash-appt-row{display:none!important}
          .dash-appt-card{display:flex!important}
          .dash-table-head{display:none!important}
          .dash-table-footer{display:none!important}
        }
        @media(min-width:641px){
          .dash-appt-card{display:none!important}
          .dash-cols{grid-template-columns:3fr 2fr!important}
        }
      `}</style>
      <div className="dash-wrap" style={{ padding: "28px 24px", maxWidth: 1360, margin: "0 auto" }}>

        {/* ── Welcome Banner ────────────────────────────────────── */}
        <div className="dash-banner" style={{ background: "linear-gradient(135deg,#0F0B2D 0%,#1E1B4B 35%,#3730A3 65%,#6366F1 100%)", borderRadius: 24, padding: "32px 36px", marginBottom: 24, position: "relative", overflow: "hidden", boxShadow: "0 16px 48px rgba(99,102,241,0.3)" }}>
          {/* decorative circles */}
          <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "absolute", bottom: -80, right: 100, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
          <div style={{ position: "absolute", top: 20, right: 200, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 8 }}>Salon Dashboard</div>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-1px", margin: 0, lineHeight: 1.1 }}>{salon?.name}</h1>
              <p className="dash-banner-meta" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", margin: 0, marginTop: 8 }}>
                {todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""} today · £{revenue} earned so far
              </p>
            </div>
            <div className="dash-banner-btns" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={handleCopyLink}
                style={{ padding: "10px 20px", background: copied ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.1)", color: "#fff", border: `1.5px solid ${copied ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.2)"}`, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(8px)" }}>
                {copied ? "✓ Copied!" : "🔗 Copy Link"}
              </button>
              <button onClick={() => window.open(`/book/${salon?.slug}`, "_blank")}
                style={{ padding: "10px 20px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(8px)" }}>
                Preview ↗
              </button>
              <a href="/dashboard/reports"
                style={{ padding: "10px 20px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", textDecoration: "none", backdropFilter: "blur(8px)" }}>
                Reports 📊
              </a>
            </div>
          </div>
        </div>

        {/* ── 4 Stat Cards ─────────────────────────────────────────── */}
        <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          <MiniStat label="Upcoming" value={upcomingAppts.length} color="#6366F1" icon="⏰" sub={`${confirmedAppts.length} confirmed`} />
          <MiniStat label="Total Revenue" value={`£${totalRevenue}`} color="#10B981" icon="💰" sub="all confirmed" />
          <MiniStat label="Total Bookings" value={appointments.length} color="#8B5CF6" icon="📋" sub={`${pendingAppts.length} pending`} />
          <MiniStat label="Staff Members" value={staff.length} color="#EC4899" icon="✂️" sub="active team" />
        </div>

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, padding: "20px 22px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#94A3B8", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 16 }}>Quick Actions</div>
          <div className="dash-quick-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
            <QuickAction icon="📅" label="New Booking" color="#6366F1" onClick={() => setShowModal(true)} />
            <QuickAction icon="🎁" label="Add Offer" color="#10B981" onClick={() => setShowOfferModal(true)} />
            <QuickAction icon="👤" label="Add Client" color="#8B5CF6" onClick={() => router.push("/dashboard/clients")} />
            <QuickAction icon="✂️" label="Add Staff" color="#EC4899" onClick={() => router.push("/dashboard/staff")} />
            <QuickAction icon="📊" label="Reports" color="#F59E0B" onClick={() => router.push("/dashboard/reports")} />
            <QuickAction icon="⚙️" label="Settings" color="#06B6D4" onClick={() => router.push("/dashboard/settings")} />
          </div>
        </div>


        {/* ── Two-Column Layout ─────────────────────────────────── */}
        <div className="dash-cols" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

            {/* LEFT ────────────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>


              {/* All Appointments Table */}
              <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #F1F5F9", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>All Appointments</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search client, service..." />
                    <div style={{ display: "flex", gap: 2, background: "#F1F5F9", padding: 3, borderRadius: 10 }}>
                      {["All", "Today", "Upcoming", "Confirmed", "Pending"].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                          style={{ fontSize: 11.5, padding: "5px 12px", borderRadius: 8, border: "none", background: activeTab === t ? "#fff" : "transparent", color: activeTab === t ? "#6366F1" : "#64748B", cursor: "pointer", fontWeight: activeTab === t ? 800 : 500, boxShadow: activeTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.12s", whiteSpace: "nowrap" }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredAppts.length === 0 ? (
                  <EmptyState icon="📋" title="No appointments found" description={searchQuery ? "Try a different search term" : "No appointments match this filter"} />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    {/* Desktop table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                      <thead className="dash-table-head">
                        <tr style={{ background: "#F8FAFC" }}>
                          {["Status", "Client", "Service", "Staff", "Date & Time", "Amount", "Actions"].map(h => (
                            <th key={h} style={{ fontSize: 10, fontWeight: 900, color: "#94A3B8", textAlign: "left", padding: "11px 16px", letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid #F1F5F9" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppts.map(a => (
                          <React.Fragment key={a.id}>
                            {/* Desktop row */}
                            <tr key={`row-${a.id}`} className="dash-appt-row" style={{ transition: "background 0.1s" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#F8FAFC"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                            >
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}><StatusPill status={a.status} /></td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>{a.client_name}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontSize: 13, color: "#475569" }}>{a.services?.name || "—"}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontSize: 13, color: "#94A3B8" }}>{a.staff?.name || "—"}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontSize: 12.5, color: "#475569", whiteSpace: "nowrap" }}>{new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", fontSize: 13, fontWeight: 800, color: "#10B981" }}>{a.services?.price ? `£${a.services.price}` : "—"}</td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9" }}>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                  {a.status !== "confirmed" && (
                                    <button onClick={() => handleUpdateStatus(a.id, "confirmed")} disabled={updatingId === a.id}
                                      style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 7, border: "1.5px solid #A7F3D0", background: "#ECFDF5", color: "#059669", cursor: "pointer", opacity: updatingId === a.id ? 0.5 : 1 }}>✓</button>
                                  )}
                                  {a.status !== "cancelled" && (
                                    <button onClick={() => handleUpdateStatus(a.id, "cancelled")} disabled={updatingId === a.id}
                                      style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 7, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", opacity: updatingId === a.id ? 0.5 : 1 }}>✕</button>
                                  )}
                                  <button onClick={() => handleDeleteAppt(a.id)}
                                    style={{ fontSize: 13, padding: "4px 7px", borderRadius: 7, border: "1.5px solid #E2E8F0", background: "#F8FAFC", color: "#94A3B8", cursor: "pointer" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.color = "#EF4444"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#94A3B8"; }}
                                  >🗑</button>
                                </div>
                              </td>
                            </tr>
                            {/* Mobile card */}
                            <tr key={`card-${a.id}`} className="dash-appt-card" style={{ display: "none" }}>
                              <td colSpan={7} style={{ padding: "10px 16px", borderBottom: "1px solid #F1F5F9" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>{a.client_name}</div>
                                    <div style={{ fontSize: 12, color: "#64748B" }}>{a.services?.name || "No service"}{a.staff?.name ? ` · ${a.staff.name}` : ""}</div>
                                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{a.services?.price ? ` · £${a.services.price}` : ""}</div>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                    <StatusPill status={a.status} />
                                    <div style={{ display: "flex", gap: 5 }}>
                                      {a.status !== "confirmed" && <button onClick={() => handleUpdateStatus(a.id, "confirmed")} style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 7, border: "1.5px solid #A7F3D0", background: "#ECFDF5", color: "#059669", cursor: "pointer" }}>✓</button>}
                                      {a.status !== "cancelled" && <button onClick={() => handleUpdateStatus(a.id, "cancelled")} style={{ fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 7, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer" }}>✕</button>}
                                      <button onClick={() => handleDeleteAppt(a.id)} style={{ fontSize: 13, padding: "4px 7px", borderRadius: 7, border: "1.5px solid #E2E8F0", background: "#F8FAFC", color: "#94A3B8", cursor: "pointer" }}>🗑</button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                    <div className="dash-table-footer" style={{ padding: "12px 22px", fontSize: 12, color: "#94A3B8", borderTop: "1px solid #F1F5F9" }}>
                      Showing {filteredAppts.length} of {appointments.length} total appointments
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT ───────────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Revenue Chart */}
              <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, overflow: "hidden", padding: "18px 22px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>This Week's Revenue</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>Daily breakdown (confirmed)</div>
                <RevenueMiniChart appointments={appointments} />
              </div>

              {/* Subscription Plan */}
              <div style={{ background: "#fff", border: `2px solid ${statusBadge.color}25`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ padding: "18px 20px", borderBottom: "1px solid #F1F5F9", background: `linear-gradient(135deg,${statusBadge.bg} 0%,#fff 100%)` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "1.5px", color: statusBadge.color, textTransform: "uppercase" }}>Current Plan</div>
                    <div style={{ padding: "4px 12px", borderRadius: 99, background: statusBadge.bg, color: statusBadge.color, fontSize: 10, fontWeight: 900, letterSpacing: "0.8px", border: `1.5px solid ${statusBadge.color}44` }}>{statusBadge.label}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.5px", textTransform: "capitalize" }}>{subPlan} Plan</div>
                  <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{PLAN_PRICE[subPlan] || "£29"}/month</div>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  {(subStatus === "trial" || subStatus === "trialing") && (
                    <div style={{ background: trialDaysLeft <= 3 ? "#FEF2F2" : "#EEF2FF", border: `1.5px solid ${trialDaysLeft <= 3 ? "#FECACA" : "#C7D2FE"}`, borderRadius: 12, padding: "11px 16px", marginBottom: 14 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: trialDaysLeft <= 3 ? "#DC2626" : "#4F46E5" }}>
                        {trialDaysLeft === 0 ? "⚠️ Trial ended — subscribe to continue" : `🎁 ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in free trial`}
                      </div>
                    </div>
                  )}
                  {subStatus === "active" && periodEnd && (
                    <div style={{ background: "#ECFDF5", border: "1.5px solid #A7F3D0", borderRadius: 12, padding: "11px 16px", marginBottom: 14 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#059669" }}>✅ Next billing: {new Date(periodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </div>
                  )}
                  {subStatus === "past_due" && (
                    <div style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "11px 16px", marginBottom: 14 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#D97706" }}>⚠️ Payment failed — update your card</div>
                    </div>
                  )}
                  <button onClick={handleManageSub}
                    style={{ width: "100%", textAlign: "center", padding: "12px", background: `linear-gradient(135deg,${statusBadge.color} 0%,${statusBadge.color}cc 100%)`, color: "#fff", borderRadius: 12, fontSize: 13.5, fontWeight: 800, border: "none", cursor: "pointer", letterSpacing: "-0.2px", boxShadow: `0 4px 14px ${statusBadge.color}30`, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
                  >
                    {subStatus === "active" || subStatus === "trialing" ? "Manage Subscription →" : hasCustId ? "Reactivate / Upgrade →" : "Choose a Plan →"}
                  </button>
                  {subStatus !== "active" && <div style={{ textAlign: "center", fontSize: 11.5, color: "#94A3B8", marginTop: 10 }}>Plans from £29/month · Cancel anytime</div>}
                </div>
              </div>

              {/* Special Offers */}
              <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Special Offers</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{offers.length} active offer{offers.length !== 1 ? "s" : ""}</div>
                  </div>
                  <button onClick={() => setShowOfferModal(true)}
                    style={{ padding: "7px 16px", background: "#ECFDF5", color: "#059669", border: "1.5px solid #A7F3D0", borderRadius: 10, fontSize: 12.5, fontWeight: 800, cursor: "pointer", transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#D1FAE5"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#ECFDF5"; }}
                  >+ Add</button>
                </div>
                {offers.length === 0 ? (
                  <EmptyState icon="🎁" title="No offers yet" description="Attract clients with special deals" action={{ label: "+ Create Offer", onClick: () => setShowOfferModal(true) }} />
                ) : (
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    {offers.map(offer => {
                      const label = offer.discount_type === "percentage" ? `${offer.discount_value}% off` : `£${offer.discount_value} off`;
                      const expired = offer.valid_until && new Date(offer.valid_until) < new Date();
                      return (
                        <div key={offer.id}
                          style={{ border: "1.5px solid #F1F5F9", borderRadius: 14, padding: "14px 16px", opacity: offer.active ? 1 : 0.5, transition: "all 0.14s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#C7D2FE"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#F1F5F9"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", lineHeight: 1.3 }}>{offer.title}</div>
                            <label style={{ position: "relative", width: 32, height: 18, cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
                              <input type="checkbox" checked={offer.active} onChange={() => handleToggleOffer(offer.id, offer.active)} style={{ opacity: 0, width: 0, height: 0 }} />
                              <span style={{ position: "absolute", inset: 0, background: offer.active ? "#10B981" : "#CBD5E1", borderRadius: 99, transition: "background 0.18s" }}>
                                <span style={{ position: "absolute", width: 12, height: 12, left: offer.active ? 17 : 3, top: 3, background: "#fff", borderRadius: "50%", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                              </span>
                            </label>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>🎉 {label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, color: expired ? "#EF4444" : "#94A3B8", fontWeight: 500 }}>{expired ? "Expired" : offer.valid_until ? `Until ${new Date(offer.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No expiry"}</span>
                              <button onClick={() => handleDeleteOffer(offer.id)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#CBD5E1", fontSize: 14, padding: 0, transition: "color 0.12s" }}
                                onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "#CBD5E1"; }}
                              >🗑</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Team Overview */}
              <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Team Overview</div>
                  <a href="/dashboard/staff" style={{ fontSize: 12.5, fontWeight: 700, color: "#6366F1", textDecoration: "none", padding: "6px 14px", background: "#EEF2FF", borderRadius: 8 }}>Manage →</a>
                </div>
                {staff.length === 0 ? (
                  <EmptyState icon="✂️" title="No staff" description="Add team members to assign bookings" action={{ label: "Add Staff", onClick: () => router.push("/dashboard/staff") }} />
                ) : (
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {staff.slice(0, 5).map(s => {
                      const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                      const bg = colors[s.name.charCodeAt(0) % colors.length];
                      const initials = s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                      const staffAppts = appointments.filter(a => a.staff_id === s.id && a.status === "confirmed");
                      return (
                        <div key={s.id}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 13, border: "1.5px solid #F1F5F9", transition: "all 0.12s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E0E7FF"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#F1F5F9"; }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: `0 4px 10px ${bg}40` }}>{initials}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                            <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{staffAppts.length} confirmed booking{staffAppts.length !== 1 ? "s" : ""}</div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", flexShrink: 0 }}>Active</div>
                        </div>
                      );
                    })}
                    {staff.length > 5 && <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "6px 0" }}>+{staff.length - 5} more staff members</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── New Booking Modal ─────────────────────────────────────── */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Booking">
        <FormGroup label="Client Name *"><Input placeholder="Sarah Johnson" value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} /></FormGroup>
        <FormGroup label="Email"><Input type="email" placeholder="sarah@email.com" value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value })} /></FormGroup>
        <FormGroup label="Phone"><Input placeholder="+44 7700 900000" value={formData.client_phone} onChange={e => setFormData({ ...formData, client_phone: e.target.value })} /></FormGroup>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormGroup label="Date *"><Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></FormGroup>
          <FormGroup label="Time *"><Select value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}><option value="">Select time</option>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</Select></FormGroup>
        </div>
        <FormGroup label="Service"><Select value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })}><option value="">Select service</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} — £{s.price}</option>)}</Select></FormGroup>
        <FormGroup label="Staff Member"><Select value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })}><option value="">Assign staff (optional)</option>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormGroup>
        <ModalActions><BtnSecondary onClick={() => setShowModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleNewBooking} disabled={!formData.client_name || !formData.date || !formData.time}>Create Booking</BtnPrimary></ModalActions>
      </Modal>

      {/* ── Add Offer Modal ───────────────────────────────────────── */}
      <Modal open={showOfferModal} onClose={() => setShowOfferModal(false)} title="Add Special Offer">
        <FormGroup label="Offer Title *"><Input placeholder="e.g. Summer Special" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} /></FormGroup>
        <FormGroup label="Description"><textarea placeholder="Describe your offer..." value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, resize: "vertical", fontFamily: "inherit", outline: "none" }} /></FormGroup>
        <FormGroup label="Discount">
          <div style={{ display: "flex", gap: 8 }}>
            <Select value={offerForm.discount_type} onChange={e => setOfferForm({ ...offerForm, discount_type: e.target.value })} style={{ flex: "0 0 150px" }}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (£)</option></Select>
            <Input type="number" min="0" placeholder={offerForm.discount_type === "percentage" ? "e.g. 20" : "e.g. 10"} value={offerForm.discount_value} onChange={e => setOfferForm({ ...offerForm, discount_value: e.target.value })} />
          </div>
        </FormGroup>
        <FormGroup label="Valid Until (optional)"><Input type="date" value={offerForm.valid_until} onChange={e => setOfferForm({ ...offerForm, valid_until: e.target.value })} /></FormGroup>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F8FAFC", borderRadius: 12, border: "1.5px solid #E2E8F0", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>Publish on booking page</div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>Clients see this immediately</div>
          </div>
          <label style={{ position: "relative", width: 34, height: 18, cursor: "pointer" }}>
            <input type="checkbox" checked={offerForm.active} onChange={e => setOfferForm({ ...offerForm, active: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", inset: 0, background: offerForm.active ? "#10B981" : "#CBD5E1", borderRadius: 99, transition: "background 0.18s" }}>
              <span style={{ position: "absolute", width: 12, height: 12, left: offerForm.active ? 19 : 3, top: 3, background: "#fff", borderRadius: "50%", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
            </span>
          </label>
        </div>
        <ModalActions><BtnSecondary onClick={() => setShowOfferModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleAddOffer} disabled={!offerForm.title}>Save Offer</BtnPrimary></ModalActions>
      </Modal>
    </DashboardShell>
  );
}