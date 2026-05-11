"use client";
import { useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COUNTRIES = [
  { code: "GB", name: "United Kingdom", postal: "Postcode", flag: "🇬🇧" },
  { code: "PK", name: "Pakistan", postal: "Postal Code", flag: "🇵🇰" },
  { code: "US", name: "United States", postal: "ZIP Code", flag: "🇺🇸" },
  { code: "IN", name: "India", postal: "PIN Code", flag: "🇮🇳" },
  { code: "AE", name: "UAE", postal: "Postal Code", flag: "🇦🇪" },
  { code: "CA", name: "Canada", postal: "Postal Code", flag: "🇨🇦" },
  { code: "AU", name: "Australia", postal: "Postcode", flag: "🇦🇺" },
  { code: "NG", name: "Nigeria", postal: "Postal Code", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", postal: "Postal Code", flag: "🇬🇭" },
  { code: "DE", name: "Germany", postal: "PLZ", flag: "🇩🇪" },
  { code: "FR", name: "France", postal: "Code Postal", flag: "🇫🇷" },
];

const STEPS = ["Personal Info", "Address", "Work Details", "ID Verification"];
const INDIGO = "#4F6EF7";

interface FormState {
  // Step 1
  full_name: string; phone: string; whatsapp: string; country: string;
  // Step 2
  street_address: string; city: string; postcode: string;
  // Step 3
  experience: string; own_vehicle: boolean; daily_availability: string; why_hire: string;
  // Step 4
  id_card_number: string; id_issue_date: string; id_expiry_date: string;
  id_card_photo_url: string; selfie_photo_url: string;
}

const EMPTY: FormState = {
  full_name:"",phone:"",whatsapp:"",country:"GB",
  street_address:"",city:"",postcode:"",
  experience:"",own_vehicle:false,daily_availability:"",why_hire:"",
  id_card_number:"",id_issue_date:"",id_expiry_date:"",
  id_card_photo_url:"",selfie_photo_url:"",
};

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display:"block", fontSize:12.5, fontWeight:600, color:"#374151", marginBottom:5 }}>{children}</label>;
}

function SInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:14, color:"#111827", outline:"none", boxSizing:"border-box", fontFamily:"inherit", ...props.style }}
      onFocus={e=>{e.currentTarget.style.borderColor=INDIGO;e.currentTarget.style.boxShadow="0 0 0 3px rgba(79,110,247,0.12)";}}
      onBlur={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="none";}}
    />
  );
}

function SSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:14, color:"#111827", outline:"none", boxSizing:"border-box", fontFamily:"inherit", background:"#fff", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", paddingRight:38, ...props.style }}
      onFocus={e=>{e.currentTarget.style.borderColor=INDIGO;e.currentTarget.style.boxShadow="0 0 0 3px rgba(79,110,247,0.12)";}}
      onBlur={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="none";}}
    />
  );
}

function STextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:14, color:"#111827", outline:"none", resize:"vertical", minHeight:100, fontFamily:"inherit", boxSizing:"border-box", lineHeight:1.6, ...props.style }}
      onFocus={e=>{e.currentTarget.style.borderColor=INDIGO;e.currentTarget.style.boxShadow="0 0 0 3px rgba(79,110,247,0.12)";}}
      onBlur={e=>{e.currentTarget.style.borderColor="#E5E7EB";e.currentTarget.style.boxShadow="none";}}
    />
  );
}

function PhotoUpload({ label, hint, icon, value, onChange }: { label:string; hint:string; icon:string; value:string; onChange:(url:string)=>void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file: File) => {
    if (file.size > 5*1024*1024) { setErr("Max 5MB allowed"); return; }
    setUploading(true); setErr("");
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("partner-documents").upload(path, file, { upsert:true });
    if (error) { setErr("Upload failed: "+error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("partner-documents").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  return (
    <div style={{ marginBottom:18 }}>
      <Label>{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{ border:`2px dashed ${value ? "#6EE7B7" : "#C7D2FE"}`, borderRadius:12, padding:"20px 16px", textAlign:"center", cursor:"pointer", background: value ? "#ECFDF5" : "#F8FAFF", transition:"all 0.15s", position:"relative" }}
        onMouseEnter={e=>{if(!value)e.currentTarget.style.borderColor=INDIGO;}}
        onMouseLeave={e=>{if(!value)e.currentTarget.style.borderColor="#C7D2FE";}}
      >
        {value ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="uploaded" style={{ maxHeight:120, maxWidth:"100%", borderRadius:8, marginBottom:8 }} />
            <div style={{ fontSize:12.5, color:"#065F46", fontWeight:600 }}>✓ Uploaded successfully</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#374151", marginBottom:4 }}>{uploading ? "Uploading…" : "Click to upload"}</div>
            <div style={{ fontSize:12, color:"#9CA3AF" }}>{hint}</div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{const f=e.target.files?.[0];if(f)upload(f);}} />
      </div>
      {err && <p style={{ fontSize:12, color:"#DC2626", marginTop:4 }}>{err}</p>}
    </div>
  );
}

export default function PartnerPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = useCallback((k: keyof FormState, v: string|boolean) => setForm(p=>({...p,[k]:v})), []);

  const country = COUNTRIES.find(c=>c.code===form.country) || COUNTRIES[0];

  const validateStep = () => {
    if (step===0) {
      if (!form.full_name.trim()) return "Full name required";
      if (!form.phone.trim()) return "Phone required";
      if (!form.country) return "Country required";
    }
    if (step===1) {
      if (!form.street_address.trim()) return "Street address required";
      if (!form.city.trim()) return "City required";
      if (!form.postcode.trim()) return `${country.postal} required`;
    }
    if (step===2) {
      if (!form.experience) return "Experience required";
      if (!form.daily_availability) return "Availability required";
      if (!form.why_hire.trim()) return "Please tell us about yourself";
    }
    if (step===3) {
      if (!form.id_card_number.trim()) return "ID card number required";
      if (!form.id_issue_date) return "ID issue date required";
      if (!form.id_expiry_date) return "ID expiry date required";
      if (!form.id_card_photo_url) return "Please upload your ID card photo";
      if (!form.selfie_photo_url) return "Please upload your photo";
    }
    return "";
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(""); setStep(s=>s+1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/partners", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.error||"Submission failed"); return; }
      setSubmitted(true);
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#F0F4FF,#F8FAFF)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"48px 36px", textAlign:"center", maxWidth:480, width:"100%", boxShadow:"0 20px 60px rgba(79,110,247,0.12)" }}>
        <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:"#111827", letterSpacing:"-0.6px", marginBottom:10 }}>Application Submitted!</h2>
        <p style={{ fontSize:14.5, color:"#6B7280", lineHeight:1.7, marginBottom:24 }}>Your identity has been verified and your application is under review. We&apos;ll contact you within <strong>2–3 business days</strong>.</p>
        <div style={{ background:"#F0F4FF", borderRadius:12, padding:"14px 16px", textAlign:"left", marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:INDIGO, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Application Reference</div>
          <div style={{ fontSize:13, color:"#374151" }}>📱 You&apos;ll receive a WhatsApp/call from our team</div>
          <div style={{ fontSize:13, color:"#374151", marginTop:4 }}>🔒 Your documents are securely stored</div>
        </div>
        <a href="/" style={{ display:"inline-block", padding:"12px 28px", background:INDIGO, color:"#fff", borderRadius:10, fontWeight:700, textDecoration:"none", fontSize:14 }}>Back to Home</a>
      </div>
    </div>
  );

  return (
    <>
      <style>{`*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1E3A8A,#4F6EF7)", padding:"32px 24px 48px", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", borderRadius:99, padding:"6px 16px", marginBottom:16 }}>
          <span style={{ fontSize:14 }}>🤝</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#fff", letterSpacing:"0.5px", textTransform:"uppercase" }}>Partner Application</span>
        </div>
        <h1 style={{ fontSize:"clamp(24px,4vw,36px)", fontWeight:900, color:"#fff", letterSpacing:"-1px", marginBottom:8, lineHeight:1.2 }}>Become a Feature Partner</h1>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.75)", maxWidth:420, margin:"0 auto" }}>Complete all 4 steps including identity verification to apply.</p>

        {/* Progress */}
        <div style={{ display:"flex", justifyContent:"center", gap:0, marginTop:28, maxWidth:500, margin:"28px auto 0" }}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, position:"relative" }}>
              {i>0 && <div style={{ position:"absolute", top:14, right:"50%", left:"-50%", height:2, background: i<=step ? "#fff" : "rgba(255,255,255,0.3)", zIndex:0 }} />}
              <div style={{ width:28, height:28, borderRadius:"50%", background: i<step?"#6EE7B7": i===step?"#fff":"rgba(255,255,255,0.25)", border: i===step?`3px solid ${INDIGO}`:"none", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: i===step?INDIGO: i<step?"#065F46":"rgba(255,255,255,0.7)", zIndex:1, position:"relative", transition:"all 0.2s" }}>
                {i<step?"✓":i+1}
              </div>
              <div style={{ fontSize:10, fontWeight:600, color: i===step?"#fff":"rgba(255,255,255,0.55)", textAlign:"center", lineHeight:1.2 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{ background:"linear-gradient(180deg,#F0F4FF,#F8FAFF)", padding:"0 16px 60px", marginTop:-24 }}>
        <div style={{ maxWidth:560, margin:"0 auto", background:"#fff", borderRadius:20, boxShadow:"0 20px 60px rgba(79,110,247,0.1)", padding:"32px 28px", border:"1px solid #E8EDFF" }}>

          {/* Step 1: Personal Info */}
          {step===0 && (
            <div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:INDIGO, textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Step 1 of 4</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:4 }}>Personal Information</h2>
                <p style={{ fontSize:13.5, color:"#6B7280" }}>Tell us about yourself. This will be used for your partner account.</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <Label>Full Legal Name *</Label>
                  <SInput placeholder="As on ID card" value={form.full_name} onChange={e=>set("full_name",e.target.value)} />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <SInput placeholder="+44 7700 000000" value={form.phone} onChange={e=>set("phone",e.target.value)} />
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <SInput placeholder="If different" value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)} />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <Label>Country *</Label>
                  <SSelect value={form.country} onChange={e=>set("country",e.target.value)}>
                    {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </SSelect>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step===1 && (
            <div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:INDIGO, textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Step 2 of 4</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:4 }}>Home Address</h2>
                <p style={{ fontSize:13.5, color:"#6B7280" }}>Your current residential address for verification purposes.</p>
              </div>
              <div>
                <Label>Street Address *</Label>
                <SInput placeholder="House number and street name" value={form.street_address} onChange={e=>set("street_address",e.target.value)} style={{ marginBottom:14 }} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <Label>City / Town *</Label>
                    <SInput placeholder="e.g. London" value={form.city} onChange={e=>set("city",e.target.value)} />
                  </div>
                  <div>
                    <Label>{country.postal} *</Label>
                    <SInput placeholder={country.code==="GB"?"e.g. SW1A 1AA":country.code==="PK"?"e.g. 54000":"Postal code"} value={form.postcode} onChange={e=>set("postcode",e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div style={{ marginTop:14, padding:"12px 14px", background:"#F0F4FF", borderRadius:10, display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
                  <p style={{ fontSize:12.5, color:"#3730A3", margin:0, lineHeight:1.6 }}>Your address is stored securely and used only for partner verification. It will never be shared publicly.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Work Details */}
          {step===2 && (
            <div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:INDIGO, textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Step 3 of 4</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:4 }}>Work Details</h2>
                <p style={{ fontSize:13.5, color:"#6B7280" }}>Help us understand your experience and availability.</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <Label>Sales Experience *</Label>
                  <SSelect value={form.experience} onChange={e=>set("experience",e.target.value)}>
                    <option value="">Select…</option>
                    <option value="fresher">Fresher</option>
                    <option value="less-than-1">Less than 1 year</option>
                    <option value="1-2">1–2 years</option>
                    <option value="2-5">2–5 years</option>
                    <option value="5+">5+ years</option>
                  </SSelect>
                </div>
                <div>
                  <Label>Daily Availability *</Label>
                  <SSelect value={form.daily_availability} onChange={e=>set("daily_availability",e.target.value)}>
                    <option value="">Select…</option>
                    <option value="full-time">Full-time (8h+)</option>
                    <option value="part-time">Part-time (4h)</option>
                    <option value="mornings">Mornings only</option>
                    <option value="evenings">Evenings only</option>
                    <option value="weekends">Weekends only</option>
                  </SSelect>
                </div>
              </div>
              <div style={{ marginTop:14, padding:"14px 16px", background:"#F9FAFB", borderRadius:12, border:"1.5px solid #E5E7EB", display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                <label style={{ position:"relative", width:36, height:20, cursor:"pointer", flexShrink:0 }}>
                  <input type="checkbox" checked={form.own_vehicle} onChange={e=>set("own_vehicle",e.target.checked)} style={{ opacity:0, width:0, height:0 }} />
                  <span style={{ position:"absolute", inset:0, background:form.own_vehicle?INDIGO:"#D1D5DB", borderRadius:99, transition:"background 0.18s" }}>
                    <span style={{ position:"absolute", width:14, height:14, left:form.own_vehicle?19:3, top:3, background:"#fff", borderRadius:"50%", transition:"left 0.18s" }} />
                  </span>
                </label>
                <div><div style={{ fontSize:13.5, fontWeight:600, color:"#111827" }}>I have my own vehicle</div><div style={{ fontSize:12, color:"#9CA3AF" }}>Motorbike or car for field visits</div></div>
              </div>
              <Label>Why should we hire you? *</Label>
              <STextarea placeholder="Share your motivation, relevant skills, and what makes you a great salesperson…" value={form.why_hire} onChange={e=>set("why_hire",e.target.value)} rows={5} />
            </div>
          )}

          {/* Step 4: ID Verification */}
          {step===3 && (
            <div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:INDIGO, textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Step 4 of 4</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:4 }}>Identity Verification</h2>
                <p style={{ fontSize:13.5, color:"#6B7280" }}>Required for partner onboarding. All documents are encrypted and stored securely.</p>
              </div>

              {/* Security badges */}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {["🔒 256-bit Encrypted","🛡️ GDPR Compliant","🔏 Never Shared"].map(b=>(
                  <span key={b} style={{ fontSize:11.5, fontWeight:600, padding:"4px 12px", borderRadius:99, background:"#ECFDF5", color:"#065F46", border:"1px solid #6EE7B7" }}>{b}</span>
                ))}
              </div>

              {/* ID Card Number */}
              <Label>ID Card / Passport Number *</Label>
              <SInput placeholder="e.g. AB1234567" value={form.id_card_number} onChange={e=>set("id_card_number",e.target.value.toUpperCase())} style={{ marginBottom:14, letterSpacing:"1px", fontWeight:600 }} />

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
                <div>
                  <Label>Issue Date *</Label>
                  <SInput type="date" value={form.id_issue_date} onChange={e=>set("id_issue_date",e.target.value)} max={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <Label>Expiry Date *</Label>
                  <SInput type="date" value={form.id_expiry_date} onChange={e=>set("id_expiry_date",e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
              </div>

              <PhotoUpload label="ID Card / Passport Photo *" hint="JPG or PNG · Max 5MB · Both sides clearly visible" icon="🪪" value={form.id_card_photo_url} onChange={v=>set("id_card_photo_url",v)} />
              <PhotoUpload label="Your Photo (Selfie) *" hint="Clear face photo · No sunglasses · Good lighting" icon="🤳" value={form.selfie_photo_url} onChange={v=>set("selfie_photo_url",v)} />

              <div style={{ padding:"12px 14px", background:"#FFFBEB", borderRadius:10, border:"1px solid #FDE68A", fontSize:12.5, color:"#92400E", lineHeight:1.6 }}>
                ⚠️ By submitting, you confirm all documents are genuine. Fraudulent applications will be reported to relevant authorities.
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div style={{ margin:"16px 0 0", padding:"11px 14px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, fontSize:13.5, color:"#991B1B" }}>❌ {error}</div>}

          {/* Navigation buttons */}
          <div style={{ display:"flex", gap:10, marginTop:24 }}>
            {step>0 && (
              <button onClick={()=>{setError("");setStep(s=>s-1);}} style={{ flex:1, padding:"13px", background:"#fff", border:"1.5px solid #E5E7EB", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", color:"#374151" }}>← Back</button>
            )}
            {step<3 ? (
              <button onClick={next} style={{ flex:2, padding:"13px", background:`linear-gradient(135deg,${INDIGO},#3B55E0)`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 8px 24px rgba(79,110,247,0.28)" }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} style={{ flex:2, padding:"13px", background:submitting?"#94A3B8":`linear-gradient(135deg,${INDIGO},#3B55E0)`, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:submitting?"not-allowed":"pointer", boxShadow:submitting?"none":"0 8px 24px rgba(79,110,247,0.28)" }}>
                {submitting?"Submitting…":"Submit Application ✓"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
