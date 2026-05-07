"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getCurrentUserProfile } from "@/app/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "", client_email: "", client_phone: "",
    service_id: "", staff_id: "", date: "", time: "",
  });
  const [offerForm, setOfferForm] = useState({
    title: "", description: "", discount_type: "percentage",
    discount_value: "", valid_until: "", active: true,
  });

  const timeSlots = [
    "09:00","09:30","10:00","10:30","11:00","11:30","12:00",
    "12:30","13:00","13:30","14:00","14:30","15:00","15:30",
    "16:00","16:30","17:00","17:30",
  ];

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    const loadData = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile || !profile.salon) { router.push("/login"); return; }
      setSalon(profile.salon);
      const salonId = profile.salon.id;
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: appts }, { data: staffData }, { data: servicesData }, { data: offersData }] = await Promise.all([
        supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id", salonId).order("date_time", { ascending: true }),
        supabase.from("staff").select("*").eq("salon_id", salonId),
        supabase.from("services").select("*").eq("salon_id", salonId),
        supabase.from("offers").select("*").eq("salon_id", salonId).eq("active", true)
          .or(`valid_until.is.null,valid_until.gte.${today}`)
          .order("created_at", { ascending: false }),
      ]);
      setAppointments(appts || []);
      setStaff(staffData || []);
      setServices(servicesData || []);
      setOffers(offersData || []);
      setLoading(false);
    };
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNewBooking = async () => {
    if (!salon) return;
    const date_time = new Date(formData.date + "T" + formData.time).toISOString();
    await supabase.from("appointments").insert({
      salon_id: salon.id,
      client_name: formData.client_name,
      client_email: formData.client_email,
      client_phone: formData.client_phone,
      service_id: formData.service_id || null,
      staff_id: formData.staff_id || null,
      date_time,
      status: "confirmed",
    });
    const selectedService = services.find(s => s.id === formData.service_id);
    const selectedStaff = staff.find(s => s.id === formData.staff_id);
    await fetch("/api/send-booking-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail: formData.client_email,
        clientName: formData.client_name,
        clientPhone: formData.client_phone,
        serviceName: selectedService?.name || "Service",
        dateTime: date_time,
        staffName: selectedStaff?.name,
        salonName: salon.name,
        salonOwnerEmail: salon.owner_email,
      }),
    });
    setShowModal(false);
    setFormData({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });
    const { data: appts } = await supabase.from("appointments")
      .select("*, services(name,price), staff(name)")
      .eq("salon_id", salon.id)
      .order("date_time", { ascending: true });
    setAppointments(appts || []);
  };

  const handleAddOffer = async () => {
    if (!salon || !offerForm.title) return;
    const { data } = await supabase.from("offers").insert({
      salon_id: salon.id,
      title: offerForm.title,
      description: offerForm.description,
      discount_type: offerForm.discount_type,
      discount_value: parseFloat(offerForm.discount_value) || 0,
      valid_until: offerForm.valid_until || null,
      active: offerForm.active,
    }).select();
    if (data) setOffers(prev => [data[0], ...prev]);
    setShowOfferModal(false);
    setOfferForm({ title: "", description: "", discount_type: "percentage", discount_value: "", valid_until: "", active: true });
  };

  const handleToggleOffer = async (offerId: string, current: boolean) => {
    await supabase.from("offers").update({ active: !current }).eq("id", offerId);
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, active: !current } : o));
  };

  const handleDeleteOffer = async (offerId: string) => {
    await supabase.from("offers").delete().eq("id", offerId);
    setOffers(prev => prev.filter(o => o.id !== offerId));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${origin}/book/${salon?.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bookingLink = `${origin}/book/${salon?.slug}`;
  const todayAppts = appointments.filter(a => new Date(a.date_time).toDateString() === new Date().toDateString());
  const revenue = todayAppts.reduce((sum, a) => sum + (a.services?.price || 0), 0);
  const upcomingAppts = appointments.filter(a => new Date(a.date_time) > new Date());
  const filteredAppts = activeTab === "Today" ? todayAppts : activeTab === "Upcoming" ? upcomingAppts : appointments;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "⬛" },
    { label: "Bookings", path: "/dashboard/bookings", icon: "📅" },
    { label: "Clients", path: "/dashboard/clients", icon: "👤" },
    { label: "Staff", path: "/dashboard/staff", icon: "✂️" },
    { label: "Payments", path: "/dashboard/payments", icon: "💳" },
    { label: "Reports", path: "/dashboard/reports", icon: "📊" },
    { label: "Settings", path: "/dashboard/settings", icon: "⚙️" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "22px", color: "#0A0A0A", letterSpacing: "-0.3px", opacity: 0.4 }}>feature</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --font-display: 'Instrument Serif', Georgia, serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
          --color-bg: #F7F7F5;
          --color-surface: #FFFFFF;
          --color-border: #EBEBEB;
          --color-border-strong: #D8D8D8;
          --color-text-primary: #0A0A0A;
          --color-text-secondary: #6B6B6B;
          --color-text-tertiary: #A8A8A8;
          --color-accent: #1A1A1A;
          --color-accent-blue: #2563EB;
          --color-accent-blue-light: #EFF6FF;
          --color-success: #059669;
          --color-success-light: #ECFDF5;
          --color-warning: #D97706;
          --color-warning-light: #FFFBEB;
          --color-danger: #DC2626;
          --color-danger-light: #FEF2F2;
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 14px;
          --radius-xl: 20px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04);
          --shadow-lg: 0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06);
        }

        body { font-family: var(--font-body); background: var(--color-bg); color: var(--color-text-primary); -webkit-font-smoothing: antialiased; }

        /* ── Layout ── */
        .layout { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(2px); z-index: 40; }
        .sidebar-overlay.open { display: block; }

        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: 232px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex; flex-direction: column;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .sidebar.open { transform: translateX(0); }

        @media (min-width: 768px) {
          .sidebar { position: relative; transform: none !important; flex-shrink: 0; }
          .sidebar-overlay { display: none !important; }
          .hamburger { display: none !important; }
        }

        .sidebar-logo {
          padding: 24px 20px 20px;
          border-bottom: 1px solid var(--color-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo-text {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--color-text-primary);
          letter-spacing: -0.4px;
        }

        .sidebar-nav { padding: 12px 10px; flex: 1; overflow-y: auto; }
        .nav-section-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--color-text-tertiary);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 12px 10px 4px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px;
          border-radius: var(--radius-sm);
          font-size: 13.5px;
          font-weight: 400;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.12s;
          margin-bottom: 1px;
          letter-spacing: -0.1px;
        }
        .nav-item:hover { background: #F4F4F2; color: var(--color-text-primary); }
        .nav-item.active {
          background: var(--color-accent-blue-light);
          color: var(--color-accent-blue);
          font-weight: 500;
        }
        .nav-item-icon { font-size: 14px; opacity: 0.7; width: 20px; text-align: center; }

        .sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--color-border);
        }
        .sidebar-salon-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-signout {
          font-size: 12px;
          color: var(--color-text-tertiary);
          background: none; border: none; cursor: pointer; padding: 0;
          transition: color 0.12s;
        }
        .sidebar-signout:hover { color: var(--color-danger); }

        /* ── Main ── */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

        /* ── Topbar ── */
        .topbar {
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding: 0 24px;
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          position: sticky; top: 0; z-index: 30;
        }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .topbar-greeting { font-size: 14px; font-weight: 500; color: var(--color-text-primary); letter-spacing: -0.2px; }
        .topbar-date { font-size: 12px; color: var(--color-text-tertiary); margin-top: 1px; font-weight: 400; }

        .hamburger {
          background: none; border: none; cursor: pointer;
          padding: 6px; border-radius: var(--radius-sm);
          display: flex; flex-direction: column; gap: 4.5px;
          transition: background 0.12s;
        }
        .hamburger:hover { background: #F4F4F2; }
        .hamburger span { display: block; width: 18px; height: 1.5px; background: var(--color-text-primary); border-radius: 2px; }

        .btn-primary {
          background: var(--color-accent);
          color: #fff;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
          letter-spacing: -0.1px;
          transition: all 0.12s;
          white-space: nowrap;
        }
        .btn-primary:hover { background: #333; transform: translateY(-0.5px); }
        .btn-secondary {
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border-strong);
          cursor: pointer;
          letter-spacing: -0.1px;
          transition: all 0.12s;
        }
        .btn-secondary:hover { background: #F9F9F9; }

        /* ── Content ── */
        .content { padding: 28px 24px; flex: 1; overflow-y: auto; }
        @media (max-width: 640px) { .content { padding: 20px 16px; } }

        /* ── Page header ── */
        .page-header { margin-bottom: 28px; }
        .page-title {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-text-primary);
          letter-spacing: -0.6px;
          line-height: 1.15;
          font-weight: 400;
        }
        @media (max-width: 480px) { .page-title { font-size: 24px; } }
        .page-subtitle {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: 3px;
          font-weight: 400;
          letter-spacing: -0.1px;
        }

        /* ── Booking banner ── */
        .booking-banner {
          background: var(--color-accent);
          border-radius: var(--radius-lg);
          padding: 18px 22px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        @media (min-width: 580px) {
          .booking-banner { flex-direction: row; align-items: center; justify-content: space-between; }
        }
        .banner-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .banner-url {
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          font-family: 'SF Mono', 'Fira Code', monospace;
          word-break: break-all;
          letter-spacing: 0;
        }
        .banner-btns { display: flex; gap: 8px; flex-shrink: 0; }
        .btn-banner-copy {
          padding: 8px 14px;
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.12s;
          white-space: nowrap;
        }
        .btn-banner-copy:hover { background: rgba(255,255,255,0.18); }
        .btn-banner-copy.copied { background: rgba(16,185,129,0.25); border-color: rgba(16,185,129,0.4); }
        .btn-banner-preview {
          padding: 8px 14px;
          background: #fff;
          color: #0A0A0A;
          border: none;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.12s;
          white-space: nowrap;
        }
        .btn-banner-preview:hover { background: #F0F0F0; }

        /* ── Stats grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }

        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 18px 16px;
          transition: box-shadow 0.15s;
        }
        .stat-card:hover { box-shadow: var(--shadow-sm); }
        .stat-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-tertiary);
          letter-spacing: 0.2px;
          margin-bottom: 10px;
          text-transform: uppercase;
          font-size: 10.5px;
          letter-spacing: 0.6px;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 30px;
          color: var(--color-text-primary);
          letter-spacing: -1px;
          line-height: 1;
          font-weight: 400;
        }
        @media (max-width: 480px) { .stat-value { font-size: 26px; } }
        .stat-value.revenue { color: var(--color-success); }
        .stat-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 20px;
          background: var(--color-accent-blue-light);
          color: var(--color-accent-blue);
          letter-spacing: -0.1px;
          margin-top: 2px;
        }

        /* ── Section card ── */
        .section-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 20px;
        }
        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap; gap: 10px;
        }
        .section-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-text-primary);
          letter-spacing: -0.2px;
        }
        .section-subtitle {
          font-size: 11.5px;
          color: var(--color-text-tertiary);
          font-weight: 400;
          margin-top: 1px;
          letter-spacing: -0.1px;
        }

        /* ── Tab pills ── */
        .tab-group { display: flex; gap: 2px; background: #F3F3F1; padding: 3px; border-radius: var(--radius-sm); }
        .tab-btn {
          font-size: 12px;
          padding: 5px 12px;
          border-radius: 5px;
          border: none;
          background: transparent;
          color: var(--color-text-tertiary);
          cursor: pointer;
          font-family: var(--font-body);
          font-weight: 500;
          transition: all 0.12s;
          letter-spacing: -0.1px;
        }
        .tab-btn.active { background: var(--color-surface); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }

        /* ── Offers ── */
        .offers-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          padding: 16px;
        }
        @media (min-width: 600px) { .offers-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .offers-grid { grid-template-columns: repeat(3, 1fr); } }

        .offer-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex; flex-direction: column; gap: 8px;
          transition: all 0.15s;
          position: relative;
        }
        .offer-card:hover { border-color: var(--color-border-strong); box-shadow: var(--shadow-sm); }
        .offer-card.inactive { opacity: 0.5; }
        .offer-title { font-size: 13.5px; font-weight: 600; color: var(--color-text-primary); letter-spacing: -0.2px; line-height: 1.3; }
        .offer-desc { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; }
        .offer-discount {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
          background: var(--color-success-light);
          color: var(--color-success);
          letter-spacing: 0.1px;
          align-self: flex-start;
        }
        .offer-expiry { font-size: 11px; color: var(--color-text-tertiary); }
        .offer-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }

        /* Toggle */
        .toggle { position: relative; width: 32px; height: 17px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: #E0E0E0; border-radius: 17px; cursor: pointer; transition: background 0.18s; }
        .toggle-slider::before { content: ""; position: absolute; width: 11px; height: 11px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.18s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .toggle input:checked + .toggle-slider { background: var(--color-success); }
        .toggle input:checked + .toggle-slider::before { transform: translateX(15px); }

        /* ── Appointments table ── */
        .appt-table { display: none; }
        .appt-cards { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
        @media (min-width: 768px) {
          .appt-table { display: table; width: 100%; border-collapse: collapse; }
          .appt-cards { display: none; }
        }

        .table-th {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--color-text-tertiary);
          text-align: left;
          padding: 10px 20px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          background: #FAFAFA;
          border-bottom: 1px solid var(--color-border);
        }
        .table-td {
          padding: 13px 20px;
          font-size: 13px;
          color: var(--color-text-primary);
          border-bottom: 1px solid #F5F5F5;
          font-weight: 400;
          letter-spacing: -0.1px;
        }
        .table-td.muted { color: var(--color-text-secondary); }
        .table-td.amount { font-weight: 600; color: var(--color-text-primary); font-variant-numeric: tabular-nums; }
        tr:last-child .table-td { border-bottom: none; }
        tr:hover .table-td { background: #FAFAFA; }

        .status-pill {
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 20px;
          letter-spacing: 0.1px;
          display: inline-block;
        }

        /* ── Appt card (mobile) ── */
        .appt-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 14px;
          transition: box-shadow 0.12s;
        }
        .appt-card:hover { box-shadow: var(--shadow-sm); }
        .appt-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .appt-client { font-size: 14px; font-weight: 600; color: var(--color-text-primary); letter-spacing: -0.2px; }
        .appt-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .appt-field-label { font-size: 10.5px; color: var(--color-text-tertiary); font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 2px; }
        .appt-field-value { font-size: 13px; color: var(--color-text-primary); font-weight: 500; letter-spacing: -0.1px; }
        .appt-field-value.muted { color: var(--color-text-secondary); font-weight: 400; }

        /* ── Empty state ── */
        .empty-state { padding: 52px 24px; text-align: center; }
        .empty-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.4; }
        .empty-title { font-size: 14px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 4px; letter-spacing: -0.2px; }
        .empty-desc { font-size: 13px; color: var(--color-text-tertiary); }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 100;
        }
        @media (min-width: 600px) { .modal-overlay { align-items: center; } }

        .modal-box {
          background: var(--color-surface);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          padding: 24px 20px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
        }
        @media (min-width: 600px) {
          .modal-box { border-radius: var(--radius-lg); max-width: 460px; max-height: 90vh; margin: 16px; }
        }

        .modal-title { font-size: 17px; font-weight: 600; color: var(--color-text-primary); letter-spacing: -0.4px; }
        .modal-close { background: #F5F5F3; border: none; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; font-size: 14px; color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; transition: background 0.12s; }
        .modal-close:hover { background: #EBEBEB; }

        .form-label { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); display: block; margin-bottom: 6px; letter-spacing: -0.1px; }
        .form-input {
          width: 100%;
          padding: 10px 13px;
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-family: var(--font-body);
          color: var(--color-text-primary);
          background: var(--color-surface);
          outline: none;
          transition: border-color 0.12s, box-shadow 0.12s;
          letter-spacing: -0.1px;
        }
        .form-input:focus { border-color: var(--color-accent-blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .form-group { margin-bottom: 14px; }

        .btn-modal-cancel {
          flex: 1; padding: 11px;
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          font-family: var(--font-body); font-size: 14px; font-weight: 400;
          cursor: pointer; background: var(--color-surface);
          color: var(--color-text-primary);
          transition: background 0.12s;
          letter-spacing: -0.1px;
        }
        .btn-modal-cancel:hover { background: #F5F5F3; }
        .btn-modal-submit {
          flex: 1; padding: 11px;
          background: var(--color-accent); color: #fff;
          border: none; border-radius: var(--radius-sm);
          font-family: var(--font-body); font-size: 14px; font-weight: 500;
          cursor: pointer;
          transition: background 0.12s;
          letter-spacing: -0.2px;
        }
        .btn-modal-submit:hover { background: #333; }
        .btn-modal-submit:disabled { background: #D0D0D0; cursor: not-allowed; }

        .divider { height: 1px; background: var(--color-border); margin: 18px 0; }

        .add-offer-btn {
          font-size: 12.5px; padding: 7px 13px;
          background: var(--color-surface);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-family: var(--font-body); font-weight: 500;
          transition: all 0.12s;
          letter-spacing: -0.1px;
        }
        .add-offer-btn:hover { background: #F5F5F3; box-shadow: var(--shadow-sm); }
      `}</style>

      <div className="layout">
        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <span className="logo-text">feature</span>
            <button onClick={() => setSidebarOpen(false)} className="hamburger modal-close" style={{ display: "block" }}>✕</button>
          </div>

          <nav className="sidebar-nav">
            {navItems.slice(0, 4).map(item => (
              <div key={item.label}
                className={`nav-item ${item.path === "/dashboard" ? "active" : ""}`}
                onClick={() => { router.push(item.path); setSidebarOpen(false); }}>
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div className="nav-section-label">Finance</div>
            {navItems.slice(4, 6).map(item => (
              <div key={item.label} className="nav-item" onClick={() => { router.push(item.path); setSidebarOpen(false); }}>
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div className="nav-section-label">System</div>
            <div className="nav-item" onClick={() => { router.push("/dashboard/settings"); setSidebarOpen(false); }}>
              <span className="nav-item-icon">⚙️</span>
              Settings
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-salon-name">{salon?.name}</div>
            <button className="sidebar-signout" onClick={handleLogout}>Sign out</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">

          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <button className="hamburger" onClick={() => setSidebarOpen(true)}>
                <span /><span /><span />
              </button>
              <div>
                <div className="topbar-greeting">{greeting()} 👋</div>
                <div className="topbar-date">
                  {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </div>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Booking</button>
          </header>

          {/* Content */}
          <div className="content">

            {/* Page header */}
            <div className="page-header">
              <h1 className="page-title">{salon?.name}</h1>
              <p className="page-subtitle">Salon dashboard overview</p>
            </div>

            {/* Booking link banner */}
            <div className="booking-banner">
              <div style={{ minWidth: 0 }}>
                <div className="banner-label">🔗 Booking Link</div>
                <div className="banner-url">{salon?.slug ? bookingLink : "Loading..."}</div>
              </div>
              <div className="banner-btns">
                <button onClick={handleCopyLink} className={`btn-banner-copy ${copied ? "copied" : ""}`}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button onClick={() => window.open(`/book/${salon?.slug}`, "_blank")} className="btn-banner-preview">
                  Preview ↗
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: "Today's Bookings", value: todayAppts.length.toString(), type: "num" },
                { label: "Revenue Today", value: `£${revenue}`, type: "revenue" },
                { label: "Total Bookings", value: appointments.length.toString(), type: "num" },
                { label: "Plan", value: salon?.plan || "Starter", type: "badge" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  {s.type === "badge"
                    ? <div className="stat-badge">{s.value}</div>
                    : <div className={`stat-value ${s.type === "revenue" ? "revenue" : ""}`}>{s.value}</div>
                  }
                </div>
              ))}
            </div>

            {/* Offers */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <div className="section-title">Special Offers</div>
                  <div className="section-subtitle">Shown on your public booking page</div>
                </div>
                <button className="add-offer-btn" onClick={() => setShowOfferModal(true)}>+ Add Offer</button>
              </div>

              {offers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎁</div>
                  <div className="empty-title">No offers yet</div>
                  <div className="empty-desc">Add a special offer to attract more bookings</div>
                </div>
              ) : (
                <div className="offers-grid">
                  {offers.map(offer => {
                    const discountLabel = offer.discount_type === "percentage"
                      ? `${offer.discount_value}% off`
                      : `£${offer.discount_value} off`;
                    const isExpired = offer.valid_until && new Date(offer.valid_until) < new Date();
                    return (
                      <div key={offer.id} className={`offer-card ${!offer.active ? "inactive" : ""}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div className="offer-title">{offer.title}</div>
                          <label className="toggle" style={{ marginTop: 2 }}>
                            <input type="checkbox" checked={offer.active} onChange={() => handleToggleOffer(offer.id, offer.active)} />
                            <span className="toggle-slider" />
                          </label>
                        </div>
                        {offer.description && <div className="offer-desc">{offer.description}</div>}
                        <div className="offer-discount">🎉 {discountLabel}</div>
                        <div className="offer-footer">
                          <div className="offer-expiry">
                            {isExpired ? "⚠️ Expired" : offer.valid_until
                              ? `Until ${new Date(offer.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                              : "No expiry"}
                          </div>
                          <button onClick={() => handleDeleteOffer(offer.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: 14, padding: "2px 4px", transition: "color 0.12s" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-danger)")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-tertiary)")}>
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Appointments */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-title">Appointments</div>
                <div className="tab-group">
                  {["All", "Today", "Upcoming"].map(tab => (
                    <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
                  ))}
                </div>
              </div>

              {filteredAppts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <div className="empty-title">No appointments</div>
                  <div className="empty-desc">Share your booking link to get started</div>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <table className="appt-table">
                    <thead>
                      <tr>
                        {["Status", "Client", "Service", "Staff", "Date & Time", "Amount"].map(h => (
                          <th key={h} className="table-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppts.map(a => {
                        const sc = a.status === "confirmed" ? { bg: "var(--color-success-light)", color: "var(--color-success)" }
                          : a.status === "cancelled" ? { bg: "var(--color-danger-light)", color: "var(--color-danger)" }
                          : { bg: "var(--color-warning-light)", color: "var(--color-warning)" };
                        return (
                          <tr key={a.id}>
                            <td className="table-td">
                              <span className="status-pill" style={{ background: sc.bg, color: sc.color }}>{a.status}</span>
                            </td>
                            <td className="table-td" style={{ fontWeight: 500 }}>{a.client_name}</td>
                            <td className="table-td">{a.services?.name || "—"}</td>
                            <td className="table-td muted">{a.staff?.name || "—"}</td>
                            <td className="table-td muted">{new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="table-td amount">{a.services?.price ? `£${a.services.price}` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <div className="appt-cards">
                    {filteredAppts.map(a => {
                      const sc = a.status === "confirmed" ? { bg: "var(--color-success-light)", color: "var(--color-success)" }
                        : a.status === "cancelled" ? { bg: "var(--color-danger-light)", color: "var(--color-danger)" }
                        : { bg: "var(--color-warning-light)", color: "var(--color-warning)" };
                      return (
                        <div key={a.id} className="appt-card">
                          <div className="appt-card-top">
                            <div className="appt-client">{a.client_name}</div>
                            <span className="status-pill" style={{ background: sc.bg, color: sc.color }}>{a.status}</span>
                          </div>
                          <div className="appt-card-grid">
                            <div>
                              <div className="appt-field-label">Service</div>
                              <div className="appt-field-value">{a.services?.name || "—"}</div>
                            </div>
                            <div>
                              <div className="appt-field-label">Amount</div>
                              <div className="appt-field-value">{a.services?.price ? `£${a.services.price}` : "—"}</div>
                            </div>
                            <div>
                              <div className="appt-field-label">Staff</div>
                              <div className="appt-field-value muted">{a.staff?.name || "—"}</div>
                            </div>
                            <div>
                              <div className="appt-field-label">Date & Time</div>
                              <div className="appt-field-value muted" style={{ fontSize: 12 }}>
                                {new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── New Booking Modal ── */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal-box">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div className="modal-title">New Booking</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {[
                { label: "Client Name", key: "client_name", type: "text", placeholder: "Sarah Johnson" },
                { label: "Email Address", key: "client_email", type: "email", placeholder: "sarah@email.com" },
                { label: "Phone Number", key: "client_phone", type: "text", placeholder: "+44 7700 900000" },
                { label: "Date", key: "date", type: "date", placeholder: "" },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(formData as any)[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="form-input" />
                </div>
              ))}

              {[
                { label: "Time", key: "time", opts: timeSlots.map(t => ({ v: t, l: t })) },
                { label: "Service", key: "service_id", opts: services.map(s => ({ v: s.id, l: `${s.name} — £${s.price}` })) },
                { label: "Staff", key: "staff_id", opts: staff.map(s => ({ v: s.id, l: s.name })) },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <select value={(formData as any)[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="form-input">
                    <option value="">Select {f.label.toLowerCase()}</option>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}

              <div className="divider" />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-modal-submit" onClick={handleNewBooking}>Create Booking</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Offer Modal ── */}
        {showOfferModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowOfferModal(false); }}>
            <div className="modal-box">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div className="modal-title">Add Special Offer</div>
                <button className="modal-close" onClick={() => setShowOfferModal(false)}>✕</button>
              </div>

              <div className="form-group">
                <label className="form-label">Offer Title *</label>
                <input type="text" placeholder="e.g. Summer Special" value={offerForm.title}
                  onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span></label>
                <textarea placeholder="e.g. Get 20% off any haircut this month" value={offerForm.description}
                  onChange={e => setOfferForm({ ...offerForm, description: e.target.value })}
                  rows={2} className="form-input" style={{ resize: "vertical" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={offerForm.discount_type} onChange={e => setOfferForm({ ...offerForm, discount_type: e.target.value })}
                    className="form-input" style={{ flex: "0 0 150px" }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                  <input type="number" min="0" placeholder={offerForm.discount_type === "percentage" ? "e.g. 20" : "e.g. 10"}
                    value={offerForm.discount_value} onChange={e => setOfferForm({ ...offerForm, discount_value: e.target.value })}
                    className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Valid Until <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={offerForm.valid_until}
                  onChange={e => setOfferForm({ ...offerForm, valid_until: e.target.value })} className="form-input" />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#F9F9F7", borderRadius: "var(--radius-sm)", marginBottom: 20, border: "1px solid var(--color-border)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: "-0.1px" }}>Show on booking page</div>
                  <div style={{ fontSize: 11.5, color: "var(--color-text-tertiary)", marginTop: 1 }}>Clients will see this offer immediately</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={offerForm.active} onChange={e => setOfferForm({ ...offerForm, active: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-modal-cancel" onClick={() => setShowOfferModal(false)}>Cancel</button>
                <button className="btn-modal-submit" onClick={handleAddOffer} disabled={!offerForm.title}>Save Offer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}