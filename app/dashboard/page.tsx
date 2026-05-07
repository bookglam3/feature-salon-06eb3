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

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const handleNewBooking = async () => {
    if (!salon) return;
    const date_time = new Date(formData.date + "T" + formData.time).toISOString();
    await supabase.from("appointments").insert({
      salon_id: salon.id, client_name: formData.client_name,
      client_email: formData.client_email, client_phone: formData.client_phone,
      service_id: formData.service_id || null, staff_id: formData.staff_id || null,
      date_time, status: "confirmed",
    });
    const selectedService = services.find(s => s.id === formData.service_id);
    const selectedStaff = staff.find(s => s.id === formData.staff_id);
    await fetch("/api/send-booking-emails", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail: formData.client_email, clientName: formData.client_name,
        clientPhone: formData.client_phone, serviceName: selectedService?.name || "Service",
        dateTime: date_time, staffName: selectedStaff?.name,
        salonName: salon.name, salonOwnerEmail: salon.owner_email,
      }),
    });
    setShowModal(false);
    setFormData({ client_name: "", client_email: "", client_phone: "", service_id: "", staff_id: "", date: "", time: "" });
    const { data: appts } = await supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id", salon.id).order("date_time", { ascending: true });
    setAppointments(appts || []);
  };

  const handleAddOffer = async () => {
    if (!salon || !offerForm.title) return;
    const { data } = await supabase.from("offers").insert({
      salon_id: salon.id, title: offerForm.title, description: offerForm.description,
      discount_type: offerForm.discount_type, discount_value: parseFloat(offerForm.discount_value) || 0,
      valid_until: offerForm.valid_until || null, active: offerForm.active,
    }).select();
    if (data) setOffers(prev => [data[0], ...prev]);
    setShowOfferModal(false);
    setOfferForm({ title: "", description: "", discount_type: "percentage", discount_value: "", valid_until: "", active: true });
  };

  const handleToggleOffer = async (id: string, current: boolean) => {
    await supabase.from("offers").update({ active: !current }).eq("id", id);
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !current } : o));
  };

  const handleDeleteOffer = async (id: string) => {
    await supabase.from("offers").delete().eq("id", id);
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${origin}/book/${salon?.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const todayAppts = appointments.filter(a => new Date(a.date_time).toDateString() === new Date().toDateString());
  const revenue = todayAppts.reduce((sum, a) => sum + (a.services?.price || 0), 0);
  const upcomingAppts = appointments.filter(a => new Date(a.date_time) > new Date());
  const filteredAppts = activeTab === "Today" ? todayAppts : activeTab === "Upcoming" ? upcomingAppts : appointments;
  const bookingLink = `${origin}/book/${salon?.slug}`;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  const mainNav = [
    { label: "Dashboard", path: "/dashboard", icon: "⬛", color: "blue" },
    { label: "Bookings",  path: "/dashboard/bookings", icon: "📅", color: "blue" },
    { label: "Clients",   path: "/dashboard/clients", icon: "👤", color: "green" },
    { label: "Staff",     path: "/dashboard/staff", icon: "✂️", color: "orange" },
  ];
  const financeNav = [
    { label: "Payments", path: "/dashboard/payments", icon: "💳", color: "green" },
    { label: "Reports",  path: "/dashboard/reports",  icon: "📊", color: "blue" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: "15px", fontWeight: 600, color: "#1E3A8A", letterSpacing: "-0.3px", opacity: 0.4 }}>feature</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --blue: #2563EB; --blue-dark: #1E3A8A; --blue-mid: #1D4ED8;
          --blue-light: #EFF6FF; --blue-pale: #DBEAFE;
          --green: #059669; --green-dark: #065F46;
          --green-light: #ECFDF5; --green-pale: #D1FAE5;
          --orange: #EA580C; --orange-dark: #9A3412;
          --orange-light: #FFF7ED; --orange-pale: #FED7AA;
          --grey: #6B7280; --grey-dark: #374151;
          --grey-light: #F9FAFB; --grey-pale: #F3F4F6;
          --grey-border: #E5E7EB; --grey-border2: #D1D5DB;
          --bg: #F8FAFF; --surface: #FFFFFF;
          --text-1: #111827; --text-2: #4B5563; --text-3: #9CA3AF;
          --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 20px;
          --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
          --shadow-sm: 0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
          --shadow-blue: 0 4px 14px rgba(37,99,235,0.18);

          /* ── Single font system ── */
          --font: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }

        body {
          font-family: var(--font);
          background: var(--bg);
          color: var(--text-1);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: "cv02","cv03","cv04","cv11";
        }

        .layout { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(17,24,39,0.3); backdrop-filter: blur(3px); z-index: 40; }
        .sidebar-overlay.open { display: block; }
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: 236px;
          background: var(--surface); border-right: 1px solid var(--grey-border);
          display: flex; flex-direction: column; z-index: 50;
          transform: translateX(-100%); transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .sidebar.open { transform: translateX(0); }
        @media (min-width: 768px) {
          .sidebar { position: relative; transform: none !important; flex-shrink: 0; }
          .sidebar-overlay { display: none !important; }
          .hamburger { display: none !important; }
        }

        .sidebar-logo {
          padding: 20px 18px 16px;
          border-bottom: 1px solid var(--grey-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo-mark { display: flex; align-items: center; gap: 9px; }
        .logo-icon {
          width: 29px; height: 29px; border-radius: 8px;
          background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: white; font-weight: 800;
          box-shadow: var(--shadow-blue); letter-spacing: -0.5px;
        }
        /* Logo uses font-weight 800 — heaviest weight, still same font */
        .logo-text {
          font-family: var(--font);
          font-size: 15px;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.6px;
        }

        .sidebar-nav { padding: 10px; flex: 1; overflow-y: auto; }
        .nav-section {
          font-size: 9.5px; font-weight: 700; color: var(--text-3);
          letter-spacing: 1.2px; text-transform: uppercase;
          padding: 14px 10px 5px;
          font-family: var(--font);
        }

        .nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: var(--r-sm);
          font-size: 13.5px; font-weight: 500; color: var(--text-2);
          cursor: pointer; transition: all 0.12s; margin-bottom: 1px;
          text-decoration: none; letter-spacing: -0.15px;
          font-family: var(--font);
        }
        .nav-link:hover { background: var(--grey-pale); color: var(--text-1); }
        .nav-link.active { background: var(--blue-light); color: var(--blue); font-weight: 600; }

        .nav-icon { width: 28px; height: 28px; border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .nav-icon.blue  { background: var(--blue-pale);   color: var(--blue); }
        .nav-icon.green { background: var(--green-pale);  color: var(--green); }
        .nav-icon.orange{ background: var(--orange-pale); color: var(--orange); }
        .nav-icon.grey  { background: var(--grey-pale);   color: var(--grey); }

        .sidebar-footer { padding: 14px 18px; border-top: 1px solid var(--grey-border); }
        .salon-name {
          font-size: 12.5px; font-weight: 600; color: var(--text-1);
          margin-bottom: 4px; white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; letter-spacing: -0.2px;
          font-family: var(--font);
        }
        .sign-out {
          font-size: 12px; color: var(--text-3); background: none; border: none;
          cursor: pointer; padding: 0; font-family: var(--font);
          font-weight: 500; transition: color 0.12s;
        }
        .sign-out:hover { color: var(--orange); }

        /* ── Main layout ── */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .topbar {
          background: var(--surface); border-bottom: 1px solid var(--grey-border);
          padding: 0 24px; height: 58px; display: flex; align-items: center;
          justify-content: space-between; gap: 16px; position: sticky; top: 0; z-index: 30;
        }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .greeting {
          font-size: 13.5px; font-weight: 600; color: var(--text-1);
          letter-spacing: -0.25px; font-family: var(--font);
        }
        .date-str {
          font-size: 11.5px; color: var(--text-3); margin-top: 1px;
          font-weight: 400; font-family: var(--font);
        }

        .hamburger { background: none; border: none; cursor: pointer; padding: 6px; border-radius: var(--r-sm); display: flex; flex-direction: column; gap: 4.5px; transition: background 0.12s; }
        .hamburger:hover { background: var(--grey-pale); }
        .hamburger span { display: block; width: 18px; height: 1.5px; background: var(--text-1); border-radius: 2px; }

        .btn-new {
          display: flex; align-items: center; gap: 6px;
          background: var(--blue); color: #fff;
          font-family: var(--font); font-size: 13px; font-weight: 600;
          padding: 8px 16px; border-radius: var(--r-sm); border: none;
          cursor: pointer; letter-spacing: -0.15px; transition: all 0.14s;
          white-space: nowrap; box-shadow: var(--shadow-blue);
        }
        .btn-new:hover { background: var(--blue-mid); transform: translateY(-0.5px); }

        .content { padding: 28px 24px; flex: 1; overflow-y: auto; }
        @media (max-width: 640px) { .content { padding: 20px 16px; } }

        /* ── Page header — purely sans, weight contrast replaces serif ── */
        .page-header { margin-bottom: 24px; }
        .page-title {
          font-family: var(--font);
          font-size: 24px;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.7px;
          line-height: 1.2;
        }
        .page-sub {
          font-size: 13px; color: var(--text-3); margin-top: 3px;
          font-weight: 400; font-family: var(--font);
        }

        /* ── Booking banner ── */
        .booking-banner {
          background: linear-gradient(135deg, var(--blue-dark) 0%, var(--blue) 100%);
          border-radius: var(--r-lg); padding: 18px 22px; margin-bottom: 20px;
          display: flex; flex-direction: column; gap: 14px;
          box-shadow: var(--shadow-blue); position: relative; overflow: hidden;
        }
        @media (min-width: 580px) { .booking-banner { flex-direction: row; align-items: center; justify-content: space-between; } }
        .banner-label {
          font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.5);
          letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 4px;
          font-family: var(--font);
        }
        .banner-url {
          font-size: 12px; color: rgba(255,255,255,0.7);
          font-family: 'SF Mono','Fira Code',monospace; word-break: break-all;
        }
        .banner-btns { display: flex; gap: 8px; flex-shrink: 0; position: relative; z-index: 1; }
        .btn-copy {
          padding: 8px 14px; background: rgba(255,255,255,0.12); color: #fff;
          border: 1px solid rgba(255,255,255,0.2); border-radius: var(--r-sm);
          font-family: var(--font); font-size: 12.5px; font-weight: 600;
          cursor: pointer; transition: all 0.12s; white-space: nowrap;
        }
        .btn-copy:hover { background: rgba(255,255,255,0.2); }
        .btn-copy.copied { background: rgba(16,185,129,0.3); border-color: rgba(16,185,129,0.5); }
        .btn-preview {
          padding: 8px 14px; background: #fff; color: var(--blue-dark);
          border: none; border-radius: var(--r-sm);
          font-family: var(--font); font-size: 12.5px; font-weight: 700;
          cursor: pointer; transition: all 0.12s; white-space: nowrap;
        }
        .btn-preview:hover { background: var(--blue-pale); }

        /* ── Stat cards ── */
        .stats-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 20px; }
        @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(4,1fr); } }

        .stat-card {
          background: var(--surface); border: 1px solid var(--grey-border);
          border-radius: var(--r-lg); padding: 18px 16px;
          display: flex; flex-direction: column; gap: 12px;
          transition: all 0.14s; position: relative; overflow: hidden;
        }
        .stat-card:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
        .stat-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: var(--r-lg) var(--r-lg) 0 0; }
        .stat-card.blue::before  { background: linear-gradient(90deg, var(--blue) 0%, #60A5FA 100%); }
        .stat-card.green::before { background: linear-gradient(90deg, var(--green) 0%, #34D399 100%); }
        .stat-card.orange::before{ background: linear-gradient(90deg, var(--orange) 0%, #FB923C 100%); }
        .stat-card.grey::before  { background: linear-gradient(90deg, var(--grey) 0%, #9CA3AF 100%); }

        .stat-top { display: flex; align-items: flex-start; justify-content: space-between; }
        .stat-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .stat-icon.blue  { background: var(--blue-light); }
        .stat-icon.green { background: var(--green-light); }
        .stat-icon.orange{ background: var(--orange-light); }
        .stat-icon.grey  { background: var(--grey-pale); }

        /* Label: tight uppercase, weight 700 */
        .stat-label {
          font-size: 10.5px; font-weight: 700; color: var(--text-3);
          letter-spacing: 0.5px; text-transform: uppercase;
          font-family: var(--font);
        }

        /* Value: weight 800 replaces the old serif — still feels punchy */
        .stat-value {
          font-family: var(--font);
          font-size: 30px;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -1.2px;
          line-height: 1;
        }
        .stat-value.blue  { color: var(--blue); }
        .stat-value.green { color: var(--green); }
        .stat-value.orange{ color: var(--orange); }
        @media (max-width: 480px) { .stat-value { font-size: 26px; } }

        .stat-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11.5px; font-weight: 700; padding: 4px 10px;
          border-radius: 20px; background: var(--orange-light);
          color: var(--orange); border: 1px solid var(--orange-pale);
          margin-top: 4px; font-family: var(--font); letter-spacing: -0.1px;
        }

        /* ── Section cards ── */
        .section-card { background: var(--surface); border: 1px solid var(--grey-border); border-radius: var(--r-lg); overflow: hidden; margin-bottom: 20px; }
        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--grey-border);
          flex-wrap: wrap; gap: 10px;
        }
        .section-title {
          font-size: 14px; font-weight: 700; color: var(--text-1);
          letter-spacing: -0.25px; font-family: var(--font);
        }
        .section-sub {
          font-size: 12px; color: var(--text-3); margin-top: 1px;
          font-weight: 400; font-family: var(--font);
        }

        /* ── Tabs ── */
        .tabs { display: flex; gap: 2px; background: var(--grey-pale); padding: 3px; border-radius: 8px; }
        .tab {
          font-size: 12px; padding: 5px 12px; border-radius: 6px; border: none;
          background: transparent; color: var(--text-3); cursor: pointer;
          font-family: var(--font); font-weight: 500; transition: all 0.12s;
          letter-spacing: -0.1px;
        }
        .tab.active { background: var(--surface); color: var(--blue); box-shadow: var(--shadow-xs); font-weight: 700; }

        /* ── Offers ── */
        .offers-grid { display: grid; grid-template-columns: 1fr; gap: 10px; padding: 16px; }
        @media (min-width: 600px) { .offers-grid { grid-template-columns: repeat(2,1fr); } }
        @media (min-width: 1024px) { .offers-grid { grid-template-columns: repeat(3,1fr); } }

        .offer-card {
          border: 1px solid var(--grey-border); border-radius: var(--r-md);
          padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;
          transition: all 0.14s; background: var(--surface);
        }
        .offer-card:hover { border-color: var(--blue-pale); box-shadow: var(--shadow-sm); }
        .offer-card.inactive { opacity: 0.5; }
        .offer-title {
          font-size: 13.5px; font-weight: 700; color: var(--text-1);
          letter-spacing: -0.25px; line-height: 1.3; font-family: var(--font);
        }
        .offer-desc {
          font-size: 12.5px; color: var(--text-2); line-height: 1.5;
          font-weight: 400; font-family: var(--font);
        }
        .offer-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11.5px; font-weight: 700; padding: 3px 10px;
          border-radius: 20px; background: var(--green-light);
          color: var(--green); border: 1px solid var(--green-pale);
          align-self: flex-start; font-family: var(--font); letter-spacing: -0.1px;
        }
        .offer-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
        .offer-expiry {
          font-size: 11px; color: var(--text-3);
          font-weight: 400; font-family: var(--font);
        }
        .offer-del { background: none; border: none; cursor: pointer; color: var(--text-3); font-size: 14px; padding: 2px 4px; transition: color 0.12s; }
        .offer-del:hover { color: var(--orange); }

        /* ── Toggle ── */
        .toggle { position: relative; width: 32px; height: 17px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: var(--grey-border2); border-radius: 17px; cursor: pointer; transition: background 0.18s; }
        .toggle-slider::before { content: ""; position: absolute; width: 11px; height: 11px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.18s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .toggle input:checked + .toggle-slider { background: var(--green); }
        .toggle input:checked + .toggle-slider::before { transform: translateX(15px); }

        .btn-add-offer {
          font-size: 12.5px; padding: 7px 13px; font-weight: 600;
          background: var(--green-light); color: var(--green-dark);
          border: 1px solid var(--green-pale); border-radius: var(--r-sm);
          cursor: pointer; font-family: var(--font); transition: all 0.12s;
          letter-spacing: -0.1px;
        }
        .btn-add-offer:hover { background: var(--green-pale); box-shadow: var(--shadow-xs); }

        /* ── Appointments table / cards ── */
        .appt-table { display: none; }
        .appt-cards { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
        @media (min-width: 768px) { .appt-table { display: table; width: 100%; border-collapse: collapse; } .appt-cards { display: none; } }

        .th {
          font-size: 10.5px; font-weight: 700; color: var(--text-3);
          text-align: left; padding: 10px 20px; letter-spacing: 0.5px;
          text-transform: uppercase; background: var(--grey-light);
          border-bottom: 1px solid var(--grey-border); font-family: var(--font);
        }
        .td {
          padding: 13px 20px; font-size: 13px; color: var(--text-1);
          border-bottom: 1px solid #F3F4F6; font-weight: 400;
          font-family: var(--font);
        }
        .td.muted { color: var(--text-2); }
        .td.name  { font-weight: 600; letter-spacing: -0.1px; }
        .td.amount { font-weight: 700; color: var(--green-dark); }
        tr:last-child .td { border-bottom: none; }
        tr:hover .td { background: #FAFBFF; }

        .pill {
          font-size: 10.5px; font-weight: 700; padding: 3px 9px;
          border-radius: 20px; display: inline-block;
          font-family: var(--font); letter-spacing: 0.1px;
        }
        .pill.confirmed { background: var(--green-light); color: var(--green); border: 1px solid var(--green-pale); }
        .pill.cancelled { background: var(--orange-light); color: var(--orange); border: 1px solid var(--orange-pale); }
        .pill.pending   { background: var(--blue-light); color: var(--blue); border: 1px solid var(--blue-pale); }

        .appt-card {
          border: 1px solid var(--grey-border); border-radius: var(--r-md);
          padding: 14px; background: var(--surface); transition: box-shadow 0.12s;
        }
        .appt-card:hover { box-shadow: var(--shadow-sm); }
        .appt-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .appt-client {
          font-size: 14px; font-weight: 700; color: var(--text-1);
          letter-spacing: -0.25px; font-family: var(--font);
        }
        .appt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .field-lbl {
          font-size: 10px; color: var(--text-3); font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px;
          font-family: var(--font);
        }
        .field-val {
          font-size: 13px; color: var(--text-1); font-weight: 500;
          font-family: var(--font); letter-spacing: -0.1px;
        }
        .field-val.muted { color: var(--text-2); font-weight: 400; }
        .field-val.amount { color: var(--green-dark); font-weight: 700; }

        /* ── Empty states ── */
        .empty { padding: 52px 24px; text-align: center; }
        .empty-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.35; }
        .empty-title {
          font-size: 14px; font-weight: 700; color: var(--text-1);
          margin-bottom: 4px; font-family: var(--font); letter-spacing: -0.2px;
        }
        .empty-desc {
          font-size: 13px; color: var(--text-3);
          font-weight: 400; font-family: var(--font);
        }

        /* ── Modals ── */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(17,24,39,0.4);
          backdrop-filter: blur(4px); display: flex;
          align-items: flex-end; justify-content: center; z-index: 100;
        }
        @media (min-width: 600px) { .modal-overlay { align-items: center; } }
        .modal-box {
          background: var(--surface); border-radius: var(--r-xl) var(--r-xl) 0 0;
          padding: 24px 20px; width: 100%; max-height: 92vh; overflow-y: auto;
        }
        @media (min-width: 600px) { .modal-box { border-radius: var(--r-lg); max-width: 460px; max-height: 90vh; margin: 16px; } }
        .modal-title {
          font-size: 16px; font-weight: 700; color: var(--text-1);
          letter-spacing: -0.3px; font-family: var(--font);
        }
        .modal-close {
          background: var(--grey-pale); border: none; cursor: pointer;
          width: 28px; height: 28px; border-radius: 50%; font-size: 12px;
          color: var(--text-2); display: flex; align-items: center;
          justify-content: center; transition: background 0.12s;
          font-family: var(--font); font-weight: 600;
        }
        .modal-close:hover { background: var(--grey-border2); }
        .form-group { margin-bottom: 14px; }
        .form-label {
          font-size: 12px; font-weight: 600; color: var(--text-2);
          display: block; margin-bottom: 6px; font-family: var(--font);
          letter-spacing: -0.1px;
        }
        .form-input {
          width: 100%; padding: 10px 13px;
          border: 1px solid var(--grey-border2); border-radius: var(--r-sm);
          font-size: 14px; font-family: var(--font); font-weight: 400;
          color: var(--text-1); background: var(--surface);
          outline: none; transition: border-color 0.12s, box-shadow 0.12s;
        }
        .form-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .divider { height: 1px; background: var(--grey-border); margin: 18px 0; }
        .btn-cancel {
          flex: 1; padding: 11px;
          border: 1px solid var(--grey-border2); border-radius: var(--r-sm);
          font-family: var(--font); font-size: 14px; font-weight: 500;
          cursor: pointer; background: var(--surface); color: var(--text-1);
          transition: background 0.12s; letter-spacing: -0.1px;
        }
        .btn-cancel:hover { background: var(--grey-pale); }
        .btn-submit {
          flex: 1; padding: 11px;
          background: var(--blue); color: #fff; border: none;
          border-radius: var(--r-sm); font-family: var(--font);
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.12s; box-shadow: var(--shadow-blue);
          letter-spacing: -0.15px;
        }
        .btn-submit:hover { background: var(--blue-mid); }
        .btn-submit:disabled { background: var(--grey-border2); box-shadow: none; cursor: not-allowed; }

        .offer-active-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; background: var(--grey-light); border-radius: var(--r-sm);
          margin-bottom: 20px; border: 1px solid var(--grey-border);
        }
        .offer-active-label {
          font-size: 13px; font-weight: 600; color: var(--text-1);
          font-family: var(--font); letter-spacing: -0.15px;
        }
        .offer-active-sub {
          font-size: 11.5px; color: var(--text-3); margin-top: 1px;
          font-weight: 400; font-family: var(--font);
        }
      `}</style>

      <div className="layout">
        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">
              <div className="logo-icon">f</div>
              <span className="logo-text">feature</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="modal-close">✕</button>
          </div>

          <nav className="sidebar-nav">
            {mainNav.map(item => (
              <a
                key={item.label}
                href={item.path}
                className={`nav-link ${item.path === "/dashboard" ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`nav-icon ${item.color}`}>{item.icon}</div>
                {item.label}
              </a>
            ))}

            <div className="nav-section">Finance</div>
            {financeNav.map(item => (
              <a
                key={item.label}
                href={item.path}
                className="nav-link"
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`nav-icon ${item.color}`}>{item.icon}</div>
                {item.label}
              </a>
            ))}

            <div className="nav-section">System</div>
            <a href="/dashboard/settings" className="nav-link" onClick={() => setSidebarOpen(false)}>
              <div className="nav-icon grey">⚙️</div>
              Settings
            </a>
          </nav>

          <div className="sidebar-footer">
            <div className="salon-name">{salon?.name}</div>
            <button className="sign-out" onClick={handleLogout}>Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <div className="main">
          <header className="topbar">
            <div className="topbar-left">
              <button className="hamburger" onClick={() => setSidebarOpen(true)}>
                <span /><span /><span />
              </button>
              <div>
                <div className="greeting">{greeting()} 👋</div>
                <div className="date-str">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
              </div>
            </div>
            <button className="btn-new" onClick={() => setShowModal(true)}>
              <span>+</span> New Booking
            </button>
          </header>

          <div className="content">
            <div className="page-header">
              <h1 className="page-title">{salon?.name}</h1>
              <p className="page-sub">Salon dashboard overview</p>
            </div>

            <div className="booking-banner">
              <div style={{ minWidth: 0, position: "relative", zIndex: 1 }}>
                <div className="banner-label">🔗 Your Booking Link</div>
                <div className="banner-url">{salon?.slug ? bookingLink : "Loading..."}</div>
              </div>
              <div className="banner-btns">
                <button onClick={handleCopyLink} className={`btn-copy ${copied ? "copied" : ""}`}>
                  {copied ? "✓ Copied" : "Copy Link"}
                </button>
                <button onClick={() => window.open(`/book/${salon?.slug}`, "_blank")} className="btn-preview">
                  Preview ↗
                </button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-top"><div><div className="stat-label">Today's Bookings</div></div><div className="stat-icon blue">📅</div></div>
                <div className="stat-value blue">{todayAppts.length}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-top"><div><div className="stat-label">Revenue Today</div></div><div className="stat-icon green">💷</div></div>
                <div className="stat-value green">£{revenue}</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-top"><div><div className="stat-label">Total Bookings</div></div><div className="stat-icon orange">📋</div></div>
                <div className="stat-value orange">{appointments.length}</div>
              </div>
              <div className="stat-card grey">
                <div className="stat-top"><div><div className="stat-label">Current Plan</div></div><div className="stat-icon grey">⭐</div></div>
                <div className="stat-badge">✦ {salon?.plan || "Starter"}</div>
              </div>
            </div>

            {/* Offers */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <div className="section-title">Special Offers</div>
                  <div className="section-sub">Shown on your public booking page</div>
                </div>
                <button className="btn-add-offer" onClick={() => setShowOfferModal(true)}>+ Add Offer</button>
              </div>
              {offers.length === 0 ? (
                <div className="empty"><div className="empty-icon">🎁</div><div className="empty-title">No offers yet</div><div className="empty-desc">Add a special offer to attract more bookings</div></div>
              ) : (
                <div className="offers-grid">
                  {offers.map(offer => {
                    const label = offer.discount_type === "percentage" ? `${offer.discount_value}% off` : `£${offer.discount_value} off`;
                    const expired = offer.valid_until && new Date(offer.valid_until) < new Date();
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
                        <div className="offer-chip">🎉 {label}</div>
                        <div className="offer-footer">
                          <div className="offer-expiry">{expired ? "⚠️ Expired" : offer.valid_until ? `Until ${new Date(offer.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No expiry date"}</div>
                          <button className="offer-del" onClick={() => handleDeleteOffer(offer.id)}>🗑</button>
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
                <div className="tabs">
                  {["All", "Today", "Upcoming"].map(t => (
                    <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                  ))}
                </div>
              </div>
              {filteredAppts.length === 0 ? (
                <div className="empty"><div className="empty-icon">📅</div><div className="empty-title">No appointments</div><div className="empty-desc">Share your booking link to get started</div></div>
              ) : (
                <>
                  <table className="appt-table">
                    <thead><tr>{["Status","Client","Service","Staff","Date & Time","Amount"].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredAppts.map(a => (
                        <tr key={a.id}>
                          <td className="td"><span className={`pill ${a.status === "confirmed" ? "confirmed" : a.status === "cancelled" ? "cancelled" : "pending"}`}>{a.status}</span></td>
                          <td className="td name">{a.client_name}</td>
                          <td className="td">{a.services?.name || "—"}</td>
                          <td className="td muted">{a.staff?.name || "—"}</td>
                          <td className="td muted">{new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="td amount">{a.services?.price ? `£${a.services.price}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="appt-cards">
                    {filteredAppts.map(a => (
                      <div key={a.id} className="appt-card">
                        <div className="appt-card-top">
                          <div className="appt-client">{a.client_name}</div>
                          <span className={`pill ${a.status === "confirmed" ? "confirmed" : a.status === "cancelled" ? "cancelled" : "pending"}`}>{a.status}</span>
                        </div>
                        <div className="appt-grid">
                          <div><div className="field-lbl">Service</div><div className="field-val">{a.services?.name || "—"}</div></div>
                          <div><div className="field-lbl">Amount</div><div className="field-val amount">{a.services?.price ? `£${a.services.price}` : "—"}</div></div>
                          <div><div className="field-lbl">Staff</div><div className="field-val muted">{a.staff?.name || "—"}</div></div>
                          <div><div className="field-lbl">Time</div><div className="field-val muted" style={{ fontSize: 12 }}>{new Date(a.date_time).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* New Booking Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal-box">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div className="modal-title">New Booking</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              {[
                { label: "Client Name", key: "client_name", type: "text", ph: "Sarah Johnson" },
                { label: "Email Address", key: "client_email", type: "email", ph: "sarah@email.com" },
                { label: "Phone Number", key: "client_phone", type: "text", ph: "+44 7700 900000" },
                { label: "Date", key: "date", type: "date", ph: "" },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={(formData as any)[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="form-input" />
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
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleNewBooking}>Create Booking</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Offer Modal */}
        {showOfferModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowOfferModal(false); }}>
            <div className="modal-box">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div className="modal-title">Add Special Offer</div>
                <button className="modal-close" onClick={() => setShowOfferModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">Offer Title *</label>
                <input type="text" placeholder="e.g. Summer Special" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></label>
                <textarea placeholder="e.g. Get 20% off any haircut this month" value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} rows={2} className="form-input" style={{ resize: "vertical" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={offerForm.discount_type} onChange={e => setOfferForm({ ...offerForm, discount_type: e.target.value })} className="form-input" style={{ flex: "0 0 150px" }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                  <input type="number" min="0" placeholder={offerForm.discount_type === "percentage" ? "e.g. 20" : "e.g. 10"} value={offerForm.discount_value} onChange={e => setOfferForm({ ...offerForm, discount_value: e.target.value })} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Valid Until <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={offerForm.valid_until} onChange={e => setOfferForm({ ...offerForm, valid_until: e.target.value })} className="form-input" />
              </div>
              <div className="offer-active-row">
                <div>
                  <div className="offer-active-label">Show on booking page</div>
                  <div className="offer-active-sub">Clients will see this offer immediately</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={offerForm.active} onChange={e => setOfferForm({ ...offerForm, active: e.target.checked })} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-cancel" onClick={() => setShowOfferModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleAddOffer} disabled={!offerForm.title}>Save Offer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}