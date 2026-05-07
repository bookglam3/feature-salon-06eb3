"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
];

const SERVICE_ICONS: Record<string, string> = {
  haircut: "✂️", cut: "✂️", hair: "💇", color: "🎨", colour: "🎨",
  highlights: "✨", blowout: "💨", styling: "💫", beard: "🧔", shave: "🪒",
  facial: "🧖", massage: "💆", nails: "💅", manicure: "💅", pedicure: "🦶",
  wax: "🌿", threading: "🧵", lash: "👁️", brow: "🪮", keratin: "✨", treatment: "🌿",
};

const STEPS = ["Service", "Staff", "Date & Time", "Details"];

function getServiceIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "💈";
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return /^(\+44|0)[\d]{10,11}$/.test(cleaned);
}

export default function BookingPage() {
  const { slug } = useParams() as { slug: string };

  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [staffConfirmed, setStaffConfirmed] = useState(false);
  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selTime, setSelTime] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({ email: "", phone: "" });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: s } = await supabase.from("salons").select("*").eq("slug", slug).single();
      if (!s) { setNotFound(true); setLoading(false); return; }
      setSalon(s);

      const [{ data: sv }, { data: st }] = await Promise.all([
        supabase.from("services").select("*").eq("salon_id", s.id).order("price"),
        supabase.from("staff").select("*").eq("salon_id", s.id),
      ]);
      setServices(sv || []);
      setStaffList(st || []);
      setLoading(false);
    })();
  }, [slug]);

  const validateForm = () => {
    const newErrors = { email: "", phone: "" };

    if (form.email &&!isValidEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (form.phone &&!isValidPhone(form.phone)) {
      newErrors.phone = "Please enter a valid UK phone number";
    }

    setErrors(newErrors);
    return!newErrors.email &&!newErrors.phone;
  };

  const handleBook = async () => {
    if (!salon ||!selectedService ||!selDate ||!selTime ||!form.name.trim()) return;
    if (!validateForm()) return;

    setSubmitting(true);

    const [hours, minutes] = selTime.split(":");
    const bookingDateTime = new Date(selDate);
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const iso = bookingDateTime.toISOString();

    const { data: existing } = await supabase
    .from("appointments")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("date_time", iso)
    .eq("staff_id", selectedStaff?.id || null)
    .maybeSingle();

    if (existing) {
      alert("This slot is already booked.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("appointments").insert({
      salon_id: salon.id,
      client_name: form.name,
      client_email: form.email,
      client_phone: form.phone,
      service_id: selectedService.id,
      staff_id: selectedStaff?.id || null,
      date_time: iso,
      status: "pending",
    });

    if (error) {
      alert("Booking failed. Please try again.");
      setSubmitting(false);
      return;
    }

    try {
      await fetch("/api/send-booking-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: form.email,
          clientName: form.name,
          clientPhone: form.phone,
          serviceName: selectedService.name,
          dateTime: iso,
          staffName: selectedStaff?.name,
          salonName: salon.name,
          salonOwnerEmail: salon.owner_email,
        }),
      });
    } catch (err) {
      console.log(err);
    }

    setSubmitting(false);
    setStep(4);
  };

  const canNext0 =!!selectedService;
  const canNext1 = staffConfirmed;
  const canNext2 =!!selDate &&!!selTime;
  const canSubmit =!!form.name.trim() &&!!form.email &&!!form.phone &&!errors.email &&!errors.phone;
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "18px", fontWeight: 700, color: "white", letterSpacing: "-0.4px" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }}></div>
            Loading...
          </div>
        </div>
        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Booking page not found.
      </div>
    );
  }

  if (step === 4) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); *{font-family:'Plus Jakarta Sans',sans-serif;box-sizing:border-box;margin:0}`}</style>
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: "48px 32px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", animation: "slideUp 0.5s ease-out" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px", boxShadow: "0 8px 16px rgba(16,185,129,0.4)" }}>✓</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 12, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Booking Confirmed!</h1>
            <p style={{ fontSize: 15, color: "#64748B", marginBottom: 32 }}>Your appointment request has been submitted successfully.</p>
            <div style={{ padding: 20, background: "#F8FAFC", borderRadius: 16, textAlign: "left", border: "1px solid #E2E8F0" }}>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B", fontSize: 14 }}>Service</span><strong style={{ fontSize: 14 }}>{selectedService?.name}</strong></div>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B", fontSize: 14 }}>Staff</span><strong style={{ fontSize: 14 }}>{selectedStaff?.name || "Any available"}</strong></div>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B", fontSize: 14 }}>Date</span><strong style={{ fontSize: 14 }}>{selDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748B", fontSize: 14 }}>Time</span><strong style={{ fontSize: 14 }}>{selTime}</strong></div>
            </div>
          </div>
        </div>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;}
        body{background:#F8FAFF;}
        input,button,textarea,select{-webkit-appearance:none;appearance:none;font-family:inherit;}

      .page-bg{min-height:100vh;background:linear-gradient(180deg, #667eea 0%, #764ba2 100%);padding-bottom:40px;}
      .container{max-width:680px;margin:auto;padding:0 20px;}

      .hero{padding:48px 20px 120px;text-align:center;position:relative;}
      .hero-bg{position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;background-size:cover;opacity:0.3;}

      .logo-wrapper{width:104px;height:104px;border-radius:28px;background:white;padding:6px;margin:0 auto 20px;box-shadow:0 16px 32px rgba(0,0,0,0.25);position:relative;z-index:1;border:3px solid rgba(255,255,255,0.3);}
      .logo{width:100%;height:100%;border-radius:22px;object-fit:cover;}
      .logo-placeholder{width:100%;height:100%;border-radius:22px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.2);}

      .hero h1{font-size:32px;font-weight:800;letter-spacing:-1px;color:white;margin-bottom:8px;position:relative;z-index:1;text-shadow:0 2px 12px rgba(0,0,0,0.15);}
      .hero p{font-size:15px;color:rgba(255,255,255,0.95);position:relative;z-index:1;font-weight:500;}

      .card{background:white;border-radius:24px;margin-top:-80px;position:relative;z-index:2;box-shadow:0 20px 60px rgba(0,0,0,0.15);padding:32px 24px;animation:slideUp 0.5s ease-out;}

      .progress{display:flex;gap:8px;margin-bottom:32px;}
      .progress-step{flex:1;height:4px;background:#E2E8F0;border-radius:2px;transition:all 0.3s;}
      .progress-step.active{background:linear-gradient(90deg, #667eea 0%, #764ba2 100%);box-shadow:0 2px 8px rgba(102,126,234,0.4);}
      .progress-labels{display:flex;justify-content:space-between;margin-bottom:24px;}
      .progress-label{font-size:12px;font-weight:600;color:#94A3B8;transition:color 0.3s;}
      .progress-label.active{color:#667eea;}

        h2{font-size:24px;font-weight:800;letter-spacing:-0.6px;margin-bottom:20px;color:#0F172A;}

      .item-card{border:2px solid #E2E8F0;border-radius:16px;padding:18px;margin-bottom:12px;cursor:pointer;background:white;transition:all 0.2s;display:flex;align-items:center;gap:16px;}
      .item-card:hover{border-color:#CBD5E1;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.08);}
      .item-card.selected{border-color:#667eea;background:linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%);box-shadow:0 4px 12px rgba(102,126,234,0.2);}
      .item-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
      .item-card.selected.item-icon{background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);}
      .item-content{flex:1;}
      .item-content h3{font-size:16px;font-weight:700;letter-spacing:-0.3px;margin-bottom:4px;color:#0F172A;}
      .item-content p{font-size:14px;color:#64748B;font-weight:600;}
      .item-meta{font-size:13px;color:#94A3B8;font-weight:500;}

      .btn{width:100%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;padding:16px;border-radius:14px;font-weight:700;cursor:pointer;margin-top:24px;font-size:16px;letter-spacing:-0.3px;box-shadow:0 8px 16px rgba(102,126,234,0.4);transition:all 0.2s;}
      .btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 24px rgba(102,126,234,0.5);}
      .btn:active:not(:disabled){transform:translateY(0);}
      .btn:disabled{opacity:0.5;cursor:not-allowed;box-shadow:none;}

      .back-btn{background:none;border:none;color:#667eea;font-weight:700;cursor:pointer;margin-bottom:20px;font-size:15px;padding:8px 0;display:flex;align-items:center;gap:6px;transition:gap 0.2s;}
      .back-btn:hover{gap:10px;}

      .input-group{margin-bottom:20px;}
      .input-label{display:block;font-size:14px;font-weight:700;color:#334155;margin-bottom:8px;letter-spacing:-0.2px;}
      .input{width:100%;padding:14px 16px;border-radius:12px;border:2px solid #E2E8F0;font-size:15px;font-weight:600;color:#0F172A;transition:all 0.2s;background:#F8FAFC;}
      .input:focus{outline:none;border-color:#667eea;background:white;box-shadow:0 0 0 4px rgba(102,126,234,0.1);}
      .input::placeholder{color:#94A3B8;font-weight:500;}
      .input.error{border-color:#EF4444;background:#FEF2F2;}
      .error-text{font-size:13px;color:#EF4444;font-weight:600;margin-top:6px;display:block;}

      .time-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px;}
      .time-btn{padding:12px;border-radius:12px;border:2px solid #E2E8F0;background:white;cursor:pointer;font-weight:700;font-size:14px;color:#334155;transition:all 0.2s;}
      .time-btn:hover:not(:disabled){border-color:#CBD5E1;transform:translateY(-2px);}
      .time-btn.selected{background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border-color:transparent;box-shadow:0 4px 12px rgba(102,126,234,0.4);}
      .time-btn:disabled{opacity:0.3;cursor:not-allowed;background:#F1F5F9;}

      .summary{padding:20px;background:linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);border-radius:16px;margin-top:24px;border:2px solid #E2E8F0;}
      .summary-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #E2E8F0;}
      .summary-row:last-child{border-bottom:none;padding-bottom:0;}
      .summary-row:first-child{padding-top:0;}
      .summary-label{font-size:14px;color:#64748B;font-weight:600;}
      .summary-value{font-size:14px;color:#0F172A;font-weight:700;}
      .summary-total{margin-top:12px;padding-top:12px;border-top:2px solid #CBD5E1;}
      .summary-total.summary-value{font-size:18px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}

        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}

        @media (max-width:640px){
        .time-grid{grid-template-columns:repeat(3,1fr);}
        .hero{padding:32px 20px 100px;}
        .hero h1{font-size:26px;}
        .card{padding:24px 20px;margin-top:-60px;}
        .logo-wrapper{width:88px;height:88px;}
        }
      `}</style>

      <div className="page-bg">
        <div className="hero">
          <div className="hero-bg"></div>
          <div className="logo-wrapper">
            {salon?.logo_url? (
              <img src={salon.logo_url} className="logo" alt={salon.name} />
            ) : (
              <div className="logo-placeholder">{getInitials(salon?.name || "S")}</div>
            )}
          </div>
          <h1>{salon?.name}</h1>
          {salon?.description && <p>{salon.description}</p>}
        </div>

        <div className="container">
          <div className="card">
            <div className="progress">
              {STEPS.map((_, i) => (
                <div key={i} className={`progress-step ${i <= step? "active" : ""}`}></div>
              ))}
            </div>
            <div className="progress-labels">
              {STEPS.map((label, i) => (
                <span key={i} className={`progress-label ${i <= step? "active" : ""}`}>{label}</span>
              ))}
            </div>

            {step === 0 && (
              <>
                <h2>Choose Your Service</h2>
                {services.map((s) => (
                  <div key={s.id} className={`item-card ${selectedService?.id === s.id? "selected" : ""}`} onClick={() => setSelectedService(s)}>
                    <div className="item-icon">{getServiceIcon(s.name)}</div>
                    <div className="item-content">
                      <h3>{s.name}</h3>
                      <p>£{s.price}</p>
                      {s.duration_minutes && <span className="item-meta">{s.duration_minutes} mins</span>}
                    </div>
                  </div>
                ))}
                <button className="btn" disabled={!canNext0} onClick={() => setStep(1)}>Continue →</button>
              </>
            )}

            {step === 1 && (
              <>
                <button onClick={() => setStep(0)} className="back-btn">← Back to Services</button>
                <h2>Select Your Stylist</h2>
                <div className={`item-card ${staffConfirmed && selectedStaff === null? "selected" : ""}`} onClick={() => { setSelectedStaff(null); setStaffConfirmed(true); }}>
                  <div className="item-icon">👥</div>
                  <div className="item-content">
                    <h3>Any Available Staff</h3>
                    <p>We'll assign the best available</p>
                  </div>
                </div>
                {staffList.map((s) => (
                  <div key={s.id} className={`item-card ${selectedStaff?.id === s.id? "selected" : ""}`} onClick={() => { setSelectedStaff(s); setStaffConfirmed(true); }}>
                    <div className="item-icon">{getInitials(s.name)}</div>
                    <div className="item-content">
                      <h3>{s.name}</h3>
                      {s.role && <p>{s.role}</p>}
                    </div>
                  </div>
                ))}
                <button className="btn" disabled={!canNext1} onClick={() => setStep(2)}>Continue →</button>
              </>
            )}

            {step === 2 && (
              <>
                <button onClick={() => setStep(1)} className="back-btn">← Back to Staff</button>
                <h2>Pick Date & Time</h2>
                <div className="input-group">
                  <label className="input-label">Select Date</label>
                  <input type="date" className="input" min={todayStr} onChange={(e) => setSelDate(new Date(e.target.value))} />
                </div>
                {selDate && (
                  <>
                    <label className="input-label">Available Times</label>
                    <div className="time-grid">
                      {TIME_SLOTS.map((t) => {
                        const now = new Date();
                        const selectedDateTime = new Date(`${selDate.getFullYear()}-${String(selDate.getMonth() + 1).padStart(2, "0")}-${String(selDate.getDate()).padStart(2, "0")}T${t}`);
                        const disabled = selectedDateTime < now && selDate.toDateString() === now.toDateString();
                        return (
                          <button key={t} disabled={disabled} className={`time-btn ${selTime === t? "selected" : ""}`} onClick={() =>!disabled && setSelTime(t)}>
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    <button className="btn" disabled={!canNext2} onClick={() => setStep(3)}>Continue →</button>
                  </>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <button onClick={() => setStep(2)} className="back-btn">← Back to Date & Time</button>
                <h2>Your Information</h2>
                <div className="input-group">
                  <label className="input-label">Full Name *</label>
                  <input
                    className="input"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address *</label>
                  <input
                    className={`input ${errors.email? "error" : ""}`}
                    placeholder="john@example.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({...form, email: e.target.value });
                      if (errors.email) setErrors({...errors, email: ""});
                    }}
                    onBlur={validateForm}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number *</label>
                  <input
                    className={`input ${errors.phone? "error" : ""}`}
                    placeholder="+44 1234 567890"
                    value={form.phone}
                    onChange={(e) => {
                      setForm({...form, phone: e.target.value });
                      if (errors.phone) setErrors({...errors, phone: ""});
                    }}
                    onBlur={validateForm}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="summary">
                  <div className="summary-row">
                    <span className="summary-label">Service</span>
                    <span className="summary-value">{selectedService?.name}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Stylist</span>
                    <span className="summary-value">{selectedStaff?.name || "Any available"}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Date</span>
                    <span className="summary-value">{selDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Time</span>
                    <span className="summary-value">{selTime}</span>
                  </div>
                  <div className="summary-row summary-total">
                    <span className="summary-label">Total</span>
                    <span className="summary-value">£{selectedService?.price}</span>
                  </div>
                </div>

                <button className="btn" disabled={!canSubmit ||!!submitting} onClick={handleBook}>
                  {submitting? "Booking..." : "Confirm Booking"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}