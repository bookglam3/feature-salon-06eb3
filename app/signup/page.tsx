"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  indigo: "#6366F1", indigoDark: "#4338CA", indigoSoft: "#EEF2FF",
  green: "#10B981", greenSoft: "#ECFDF5",
  text: "#0F172A", text2: "#475569", text3: "#94A3B8",
  border: "#E2E8F0", bg: "#F8F9FC", surface: "#FFFFFF",
};

const FEATURES = [
  "Online booking page in minutes",
  "Automated WhatsApp & SMS reminders",
  "Staff management & scheduling",
  "Stripe payments & deposits",
  "Client CRM & history",
  "Revenue analytics dashboard",
];

const STEPS = ["Your Account", "Salon Details", "You're Live!"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", fontSize: 12, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: i < step ? C.green : i === step ? C.indigo : C.border,
                color: i <= step ? "#fff" : C.text3,
                transition: "all 0.3s",
                boxShadow: i === step ? `0 4px 12px ${C.indigo}40` : "none",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: i === step ? 700 : 500, color: i === step ? C.indigo : C.text3, whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 20, background: i < step ? C.green : C.border, transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder, required, hint }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
        {label} {required && <span style={{ color: C.indigo }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px", fontSize: 14, color: C.text,
          border: `1.5px solid ${focused ? C.indigo : C.border}`,
          borderRadius: 10, outline: "none", boxSizing: "border-box",
          background: focused ? "#fff" : C.bg, transition: "all 0.15s",
          boxShadow: focused ? `0 0 0 3px ${C.indigo}18` : "none",
        }}
      />
      {hint && <div style={{ fontSize: 11.5, color: C.text3, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("hair");

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setStep(1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName) { setError("Salon name is required."); return; }
    setLoading(true); setError("");

    const { data, error: signupErr } = await supabase.auth.signUp({
      email, password,
      options: { data: { salon_name: salonName } },
    });
    if (signupErr) {
      // Friendly message for already-registered accounts
      if (signupErr.message.toLowerCase().includes("already") || signupErr.message.toLowerCase().includes("registered")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(signupErr.message);
      }
      setLoading(false); return;
    }

    if (data.user) {
      const baseSlug = salonName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let slug = baseSlug; let attempt = 1;
      while (true) {
        const { data: ex } = await supabase.from("salons").select("id").eq("slug", slug).maybeSingle();
        if (!ex) break;
        slug = `${baseSlug}-${++attempt}`;
      }
      const { error: salonErr } = await supabase.from("salons").insert({
        name: salonName, slug, owner_id: data.user.id, owner_email: email,
        plan: "starter", phone: phone || null, city: city || null,
      });
      if (salonErr) { setError("Failed to create salon: " + salonErr.message); setLoading(false); return; }
      setStep(2);
    }
    setLoading(false);
  };

  // ── Step 2: Success ─────────────────────────────────────────
  if (step === 2) {
    return (
      <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F0F4FF,#EEF2FF)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 24px 64px rgba(99,102,241,0.15)", border: "1px solid #E0E7FF" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#10B981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(16,185,129,0.3)" }}>
            ✓
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.5px", marginBottom: 10 }}>
            {salonName} is ready!
          </h1>
          <p style={{ fontSize: 14.5, color: C.text2, lineHeight: 1.7, marginBottom: 24 }}>
            We&apos;ve sent a verification link to <strong style={{ color: C.text }}>{email}</strong>.<br />
            Verify your email then sign in to start your free trial.
          </p>
          <div style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#4338CA", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span>Check your <strong>spam folder</strong> if you don&apos;t see it within 2 minutes.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["Online booking page ready to share", "WhatsApp reminders configured", "14-day free trial started", "Zero setup fees"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.text2, padding: "8px 12px", background: C.greenSoft, borderRadius: 8 }}>
                <span style={{ color: C.green, fontSize: 16, fontWeight: 800 }}>✓</span> {f}
              </div>
            ))}
          </div>
          <a href="/login" style={{ display: "block", marginTop: 28, padding: "14px", background: `linear-gradient(135deg,${C.indigo},${C.indigoDark})`, color: "#fff", borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>
            Go to Login →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: C.bg, display: "flex" }}>

      {/* ── Left panel (desktop) ── */}
      <div style={{
        width: 400, background: "linear-gradient(160deg,#0F0B2D 0%,#1E1B4B 40%,#3730A3 70%,#6366F1 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px",
        flexShrink: 0,
      }} className="signup-left">
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, color: "#fff", letterSpacing: "-0.5px", marginBottom: 8 }}>feature</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "3px", textTransform: "uppercase" }}>Salon Management Platform</div>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.25, marginBottom: 12 }}>
          The last salon software you&apos;ll ever need.
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 36 }}>
          Join salons across the UK managing their bookings, staff, and payments — all in one place.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13.5, color: "rgba(255,255,255,0.8)" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.25)", border: "1.5px solid rgba(16,185,129,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#10B981", fontWeight: 800, flexShrink: 0 }}>✓</div>
              {f}
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>{"★★★★★".split("").map((s, i) => <span key={i} style={{ color: "#F59E0B", fontSize: 14 }}>{s}</span>)}</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: 0 }}>
            &ldquo;Switched from Fresha. Saves £90/month and the WhatsApp reminders cut our no-shows in half.&rdquo;
          </p>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>James T. · The Barber Collective, Birmingham</div>
        </div>
      </div>

      {/* ── Right panel: Form ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.indigo, letterSpacing: "2px", textTransform: "uppercase", background: C.indigoSoft, padding: "3px 10px", borderRadius: 99, border: "1px solid #C7D2FE" }}>
                14-Day Free Trial
              </div>
              <div style={{ fontSize: 11, color: C.text3 }}>No credit card required</div>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: "-0.8px", marginBottom: 6, lineHeight: 1.2 }}>
              {step === 0 ? "Create your account" : "Tell us about your salon"}
            </h1>
            <p style={{ fontSize: 14, color: C.text2 }}>
              {step === 0 ? "Start your free trial in under 60 seconds." : "Help us personalise your dashboard."}
            </p>
          </div>

          <ProgressBar step={step} />

          {error && (
            <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "11px 16px", marginBottom: 20, fontSize: 13, color: "#DC2626" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: error.includes("already exists") ? 8 : 0 }}>
                <span>⚠</span> {error}
              </div>
              {error.includes("already exists") && (
                <Link href="/login" style={{ display: "inline-block", marginTop: 4, fontSize: 13, fontWeight: 700, color: C.indigo, textDecoration: "none", background: C.indigoSoft, padding: "6px 14px", borderRadius: 8, border: `1px solid #C7D2FE` }}>
                  → Sign in to your account
                </Link>
              )}
            </div>
          )}

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <form onSubmit={handleStep1}>
              <InputField label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@yoursalon.co.uk" required />
              <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" required hint="Use a strong password with letters, numbers & symbols." />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24, padding: "12px 14px", background: C.indigoSoft, border: "1.5px solid #C7D2FE", borderRadius: 10 }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>🔒</span>
                <span style={{ fontSize: 12.5, color: "#4338CA", lineHeight: 1.6 }}>Your data is encrypted and never shared. We comply with GDPR &amp; UK data protection law.</span>
              </div>

              <button type="submit" style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg,${C.indigo},${C.indigoDark})`, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.2px", boxShadow: "0 6px 20px rgba(99,102,241,0.35)", transition: "all 0.15s" }}>
                Continue →
              </button>

              <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: C.text3 }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: C.indigo, fontWeight: 700, textDecoration: "none" }}>Sign in →</Link>
              </div>
            </form>
          )}

          {/* ── Step 1: Salon Details ── */}
          {step === 1 && (
            <form onSubmit={handleSignup}>
              <InputField label="Salon name" value={salonName} onChange={setSalonName} placeholder="The Cut Studio" required hint="This appears on your public booking page." />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="salon-grid">
                <InputField label="Phone (optional)" type="tel" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" />
                <InputField label="City (optional)" value={city} onChange={setCity} placeholder="New York" />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Salon type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { key: "hair", label: "💇 Hair Salon" },
                    { key: "barber", label: "✂️ Barbershop" },
                    { key: "beauty", label: "💅 Beauty Salon" },
                    { key: "spa", label: "🧖 Spa / Wellness" },
                    { key: "nail", label: "💎 Nail Studio" },
                    { key: "other", label: "🏠 Other" },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => setCategory(opt.key)}
                      style={{
                        padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", textAlign: "left",
                        border: `1.5px solid ${category === opt.key ? C.indigo : C.border}`,
                        background: category === opt.key ? C.indigoSoft : "#fff",
                        color: category === opt.key ? C.indigoDark : C.text2,
                        transition: "all 0.15s",
                        boxShadow: category === opt.key ? `0 0 0 3px ${C.indigo}18` : "none",
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setStep(0)}
                  style={{ flex: "0 0 auto", padding: "14px 20px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "#fff", color: C.text2, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: "14px", background: loading ? C.text3 : `linear-gradient(135deg,${C.indigo},${C.indigoDark})`, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 6px 20px rgba(99,102,241,0.35)", transition: "all 0.15s" }}>
                  {loading ? "Creating your salon…" : "Create Free Account →"}
                </button>
              </div>

              <p style={{ fontSize: 11.5, color: C.text3, textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                By creating an account you agree to our{" "}
                <a href="#" style={{ color: C.indigo, textDecoration: "none" }}>Terms of Service</a> and{" "}
                <a href="#" style={{ color: C.indigo, textDecoration: "none" }}>Privacy Policy</a>.
              </p>
            </form>
          )}

          {/* Trust badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 28, flexWrap: "wrap" }}>
            {[{ icon: "🔒", text: "SSL Encrypted" }, { icon: "🌍", text: "Global Servers" }, { icon: "✓", text: "GDPR Compliant" }].map(b => (
              <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.text3 }}>
                <span>{b.icon}</span> {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .signup-left { display: none !important; }
          .salon-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}