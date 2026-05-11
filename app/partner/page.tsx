"use client";
import { useState } from "react";

interface FormData {
  full_name: string;
  phone: string;
  whatsapp: string;
  city: string;
  experience: string;
  own_vehicle: boolean;
  daily_availability: string;
  why_hire: string;
}

const EMPTY: FormData = {
  full_name: "",
  phone: "",
  whatsapp: "",
  city: "",
  experience: "",
  own_vehicle: false,
  daily_availability: "",
  why_hire: "",
};

const INDIGO = "#4F6EF7";
const INDIGO_DARK = "#3B55E0";

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "11px 14px",
        border: "1.5px solid #E5E7EB", borderRadius: 10,
        fontSize: 14, color: "#111827", background: "#fff",
        outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        boxSizing: "border-box",
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.12)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "11px 14px",
        border: "1.5px solid #E5E7EB", borderRadius: 10,
        fontSize: 14, color: "#111827", background: "#fff",
        outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
        paddingRight: 38,
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.12)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function StyledTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%", padding: "11px 14px",
        border: "1.5px solid #E5E7EB", borderRadius: 10,
        fontSize: 14, color: "#111827", background: "#fff",
        outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        resize: "vertical", minHeight: 110, lineHeight: 1.6,
        boxSizing: "border-box", fontFamily: "inherit",
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,110,247,0.12)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

export default function PartnerPage() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(p => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Submission failed. Please try again."); return; }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F0F4FF 0%, #F8FAFF 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "48px 36px",
          textAlign: "center", maxWidth: 480, width: "100%",
          boxShadow: "0 20px 60px rgba(79,110,247,0.12)",
        }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.8px", marginBottom: 12 }}>
            Application Received!
          </h2>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
            Thank you for applying to become a Feature partner. Our team will review your application and get back to you within <strong>2–3 business days</strong>.
          </p>
          <div style={{ background: "#F0F4FF", borderRadius: 12, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: INDIGO, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>What happens next?</div>
            {["Our team reviews your application", "You receive a confirmation call/WhatsApp", "Get your unique referral link", "Start earning commission on every signup"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: INDIGO, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 13.5, color: "#374151" }}>{s}</span>
              </div>
            ))}
          </div>
          <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: INDIGO, color: "#fff", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // ── Application form
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .partner-card { animation: fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #3B55E0 0%, #4F6EF7 50%, #7C3AED 100%)",
        padding: "60px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ fontSize: 16 }}>🤝</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", letterSpacing: "0.5px", textTransform: "uppercase" }}>Partner Program</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: 16 }}>
            Become a Feature<br />Sales Partner
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Join our partner network. Help salons grow with Feature and earn commission on every successful signup.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[["💰", "Earn Commission"], ["🔗", "Unique Referral Link"], ["📱", "Work Anywhere"]].map(([icon, label]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ background: "linear-gradient(180deg, #F0F4FF 0%, #F8FAFF 100%)", padding: "0 16px 60px", marginTop: -32 }}>
        <div
          className="partner-card"
          style={{
            maxWidth: 580, margin: "0 auto",
            background: "#fff", borderRadius: 20,
            boxShadow: "0 20px 60px rgba(79,110,247,0.1)",
            padding: "36px 32px",
            border: "1px solid #E8EDFF",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.6px", marginBottom: 6 }}>
              Apply Now
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280" }}>
              Fill in the form below — takes less than 2 minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Row: name + phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Full Name *">
                <StyledInput placeholder="e.g. Ahmed Ali" value={form.full_name} onChange={e => set("full_name", e.target.value)} required />
              </Field>
              <Field label="Phone Number *">
                <StyledInput placeholder="+92 300 1234567" value={form.phone} onChange={e => set("phone", e.target.value)} required />
              </Field>
            </div>

            {/* Row: whatsapp + city */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="WhatsApp Number" hint="Leave blank if same as phone">
                <StyledInput placeholder="+92 300 1234567" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} />
              </Field>
              <Field label="City *">
                <StyledInput placeholder="e.g. Lahore" value={form.city} onChange={e => set("city", e.target.value)} required />
              </Field>
            </div>

            {/* Row: experience + availability */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Sales Experience *">
                <StyledSelect value={form.experience} onChange={e => set("experience", e.target.value)} required>
                  <option value="">Select experience</option>
                  <option value="fresher">Fresher — no experience</option>
                  <option value="less-than-1">Less than 1 year</option>
                  <option value="1-2">1–2 years</option>
                  <option value="2-5">2–5 years</option>
                  <option value="5+">5+ years</option>
                </StyledSelect>
              </Field>
              <Field label="Daily Availability *">
                <StyledSelect value={form.daily_availability} onChange={e => set("daily_availability", e.target.value)} required>
                  <option value="">Select availability</option>
                  <option value="full-time">Full-time (8h+)</option>
                  <option value="part-time">Part-time (4h)</option>
                  <option value="mornings">Mornings only</option>
                  <option value="evenings">Evenings only</option>
                  <option value="weekends">Weekends only</option>
                </StyledSelect>
              </Field>
            </div>

            {/* Own vehicle toggle */}
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#F9FAFB", borderRadius: 12, border: "1.5px solid #E5E7EB" }}>
              <label style={{ position: "relative", width: 36, height: 20, cursor: "pointer", flexShrink: 0 }}>
                <input type="checkbox" checked={form.own_vehicle} onChange={e => set("own_vehicle", e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: "absolute", inset: 0, background: form.own_vehicle ? INDIGO : "#D1D5DB", borderRadius: 99, transition: "background 0.18s" }}>
                  <span style={{ position: "absolute", width: 14, height: 14, left: form.own_vehicle ? 19 : 3, top: 3, background: "#fff", borderRadius: "50%", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </span>
              </label>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>I have my own vehicle</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Motorbike or car for field visits</div>
              </div>
            </div>

            {/* Why hire you */}
            <Field label="Why should we hire you? *" hint="Tell us about your motivation, skills, and what makes you a great salesperson.">
              <StyledTextarea
                placeholder="Share your story, motivation, and relevant skills..."
                value={form.why_hire}
                onChange={e => set("why_hire", e.target.value)}
                required
                rows={5}
              />
            </Field>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13.5, color: "#991B1B" }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "14px 20px",
                background: submitting ? "#94A3B8" : `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_DARK} 100%)`,
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 8px 24px rgba(79,110,247,0.3)",
                transition: "all 0.18s", letterSpacing: "-0.2px",
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
            >
              {submitting ? "Submitting…" : "Submit Application →"}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 14 }}>
              By applying, you agree to our partner terms. We&apos;ll contact you within 2–3 business days.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
