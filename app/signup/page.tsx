"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { POPULAR_COUNTRIES, ALL_COUNTRIES, type Country } from "../lib/countries";
import { getDefaultServices } from "../lib/defaultServices";

const C = { indigo:"#C9A24B", indigoDark:"#C9A24B", indigoSoft:"rgba(201,162,75,0.10)", green:"#10B981", red:"#EF4444", text:"#F7F5EF", text2:"#aab1c4", text3:"#aab1c4", border:"#2a3350", bg:"#1C2438" };
const STEPS = ["Account", "Your Business", "Done!"];

const BUSINESS_TYPES = [
  { key:"hair",       label:"💇 Hair Salon"            },
  { key:"barber",     label:"✂️ Barbershop"             },
  { key:"beauty",     label:"💅 Beauty Salon"           },
  { key:"spa",        label:"🌿 Spa / Wellness"         },
  { key:"nail",       label:"💎 Nail Studio"            },
  { key:"gym",        label:"🏋️ Gym & Fitness Studio"  },
  { key:"yoga",       label:"🧘 Yoga & Pilates"         },
  { key:"physio",     label:"🤸 Physiotherapy"          },
  { key:"massage",    label:"💆 Massage Therapy"        },
  { key:"dental",     label:"🦷 Dental & Aesthetic"     },
  { key:"pt",         label:"🏃 Personal Trainer"       },
  { key:"other",      label:"🏠 Other"                  },
];

function pwStrength(p: string) {
  if (p.length < 6) return { label:"Weak", color:"#EF4444", w:"30%" };
  if (p.length < 10 || !/[0-9]/.test(p)) return { label:"Fair", color:"#F59E0B", w:"60%" };
  return { label:"Strong", color:"#10B981", w:"100%" };
}

function Inp({ label, type="text", value, onChange, placeholder, required, hint, right }:
  { label:string; type?:string; value:string; onChange:(v:string)=>void; placeholder?:string; required?:boolean; hint?:string; right?: React.ReactNode }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12.5, fontWeight:700, color:C.text, display:"block", marginBottom:5 }}>{label}{required && <span style={{color:C.indigo}}> *</span>}</label>
      <div style={{ position:"relative" }}>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{ width:"100%", padding:"11px 14px", paddingRight: right?"44px":"14px", fontSize:14, color:C.text, border:`1.5px solid ${f?C.indigo:C.border}`, borderRadius:10, outline:"none", boxSizing:"border-box", background:C.bg, transition:"all .15s", boxShadow:f?`0 0 0 3px ${C.indigo}18`:"none" }} />
        {right && <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>{right}</div>}
      </div>
      {hint && <div style={{ fontSize:11, color:C.text3, marginTop:4 }}>{hint}</div>}
    </div>
  );
}

function CountryDropdown({ value, onChange }: { value: Country|null; onChange:(c:Country)=>void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = q ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.dial.includes(q)) : null;
  const Item = ({ c }: { c: Country }) => (
    <button type="button" onClick={() => { onChange(c); setOpen(false); setQ(""); }}
      style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"9px 14px", border:"none", cursor:"pointer", background: value?.code===c.code?"rgba(201,162,75,0.12)":"transparent", color:C.text, fontSize:13, textAlign:"left", transition:"background .1s" }}
      onMouseEnter={e=>{ if(value?.code!==c.code)(e.currentTarget as HTMLElement).style.background="#141A2E"; }}
      onMouseLeave={e=>{ if(value?.code!==c.code)(e.currentTarget as HTMLElement).style.background="transparent"; }}>
      <span style={{fontSize:18}}>{c.flag}</span>
      <span style={{flex:1}}>{c.name}</span>
      <span style={{fontSize:11.5, color:C.text3, fontWeight:600}}>{c.dial}</span>
    </button>
  );
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12.5, fontWeight:700, color:C.text, display:"block", marginBottom:5 }}>Country <span style={{color:C.indigo}}>*</span></label>
      <div ref={ref} style={{ position:"relative" }}>
        <button type="button" onClick={()=>setOpen(o=>!o)}
          style={{ width:"100%", padding:"11px 14px", border:`1.5px solid ${open?C.indigo:C.border}`, borderRadius:10, background:C.bg, display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, color: value?C.text:C.text3, boxShadow:open?`0 0 0 3px ${C.indigo}18`:"none", transition:"all .15s" }}>
          {value ? <><span style={{fontSize:18}}>{value.flag}</span><span style={{flex:1, textAlign:"left"}}>{value.name}</span><span style={{fontSize:12,color:C.text3}}>{value.dial}</span></> : <span>Select country…</span>}
          <span style={{fontSize:10, color:C.text3}}>{open?"▲":"▼"}</span>
        </button>
        {open && (
          <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:500, background:"#1C2438", border:`1.5px solid ${C.border}`, borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,0.4)", overflow:"hidden" }}>
            <div style={{ padding:"10px 12px", borderBottom:`1px solid ${C.border}` }}>
              <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search country or dial code…"
                style={{ width:"100%", padding:"8px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit", background:C.bg, color:C.text }} />
            </div>
            <div style={{ maxHeight:260, overflowY:"auto" }}>
              {filtered ? (
                filtered.length===0 ? <div style={{padding:"20px",textAlign:"center",color:C.text3,fontSize:13}}>No results</div>
                : filtered.map(c=><Item key={c.code} c={c}/>)
              ) : <>
                <div style={{ padding:"7px 14px 3px", fontSize:10, fontWeight:800, color:C.text3, letterSpacing:"1px", textTransform:"uppercase" }}>⭐ Popular</div>
                {POPULAR_COUNTRIES.map(c=><Item key={"p-"+c.code} c={c}/>)}
                <div style={{ height:1, background:C.border, margin:"4px 0" }}/>
                <div style={{ padding:"7px 14px 3px", fontSize:10, fontWeight:800, color:C.text3, letterSpacing:"1px", textTransform:"uppercase" }}>🌍 All Countries</div>
                {ALL_COUNTRIES.map(c=><Item key={c.code} c={c}/>)}
              </>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  // Step 0
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  // Step 1
  const [salonName, setSalonName] = useState("");
  const [country, setCountry] = useState<Country|null>(null);
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [terms, setTerms] = useState(false);
  const [category, setCategory] = useState("hair");

  // Auto-detect country
  useEffect(() => {
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) })
      .then(r=>r.json()).then(d => {
        const cc = d.country_code;
        const found = [...POPULAR_COUNTRIES, ...ALL_COUNTRIES].find(c=>c.code===cc);
        if (found) { setCountry(found); setPhone(found.dial+" "); }
      }).catch(()=>{});
  }, []);

  const pw = pwStrength(password);

  const step0 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    setError(""); setStep(1);
  };

  const step1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) { setError("Business name is required."); return; }
    if (!country) { setError("Please select your country."); return; }
    if (!terms) { setError("Please accept the Terms & Conditions."); return; }
    setLoading(true); setError("");

    const { data, error: signupErr } = await supabase.auth.signUp({ email, password,
      options: { data: { full_name: fullName, salon_name: salonName, business_type: category } } });

    if (signupErr) {
      const msg = signupErr.message;
      setError(msg.includes("already") || msg.includes("registered")
        ? "An account with this email already exists. Please sign in."
        : msg);
      setLoading(false); return;
    }

    if (data.user) {
      const baseSlug = salonName.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
      let slug = baseSlug, attempt = 1;
      while (true) {
        const { data: ex } = await supabase.from("salons").select("id").eq("slug",slug).maybeSingle();
        if (!ex) break;
        slug = `${baseSlug}-${++attempt}`;
      }
      const { data: newSalon } = await supabase
        .from("salons")
        .insert({ name: salonName, slug, owner_id: data.user.id, owner_email: email, plan:"starter", business_type: category })
        .select("id")
        .single();

      // Seed vertical-appropriate default services — silent fallback if anything fails
      try {
        const defaults = getDefaultServices(category);
        if (defaults.length > 0 && newSalon?.id) {
          await supabase.from("services").insert(
            defaults.map(svc => ({ salon_id: newSalon.id, ...svc }))
          );
        }
      } catch { /* non-fatal — signup always completes */ }

      // Notify founder — fire-and-forget, never blocks signup
      fetch("/api/notify-founder/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonName,
          email,
          businessType: category,
          signedUpAt: new Date().toISOString(),
        }),
      }).catch(() => { /* silent — notification failure must never affect signup */ });

      setStep(2);
    }
    setLoading(false);
  };

  const EyeBtn = ({ show, toggle }: { show:boolean; toggle:()=>void }) => (
    <button type="button" onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, padding:0, lineHeight:1 }}>
      {show ? "🙈" : "👁"}
    </button>
  );

  if (step === 2) return (
    <main style={{ minHeight:"100vh", background:"#141A2E", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1C2438", borderRadius:24, padding:"48px 40px", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.4)", border:"1px solid #2a3350" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#10B981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px", boxShadow:"0 8px 24px rgba(16,185,129,0.3)" }}>✓</div>
        <h1 style={{ fontSize:24, fontWeight:900, color:C.text, letterSpacing:"-0.5px", marginBottom:8 }}>{salonName} is ready!</h1>
        <p style={{ fontSize:14, color:C.text2, lineHeight:1.7, marginBottom:20 }}>
          Verification link sent to <strong>{email}</strong>.<br/>Check spam if not received within 2 mins.
        </p>
        <div style={{ background:"rgba(201,162,75,0.10)", border:"1.5px solid rgba(201,162,75,0.30)", borderRadius:12, padding:"12px 16px", marginBottom:24, fontSize:13, color:"#C9A24B" }}>
          💡 Verify your email then sign in to access your dashboard.
        </div>
        {["Online booking page ready","WhatsApp reminders configured","14-day free trial started","Zero setup fees"].map(f=>(
          <div key={f} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:C.text2, padding:"7px 12px", background:"rgba(16,185,129,0.10)", borderRadius:8, marginBottom:8 }}>
            <span style={{color:C.green, fontWeight:800}}>✓</span> {f}
          </div>
        ))}
        <a href="/login" style={{ display:"block", marginTop:24, padding:"14px", background:`linear-gradient(135deg,${C.indigo},${C.indigoDark})`, color:"#fff", borderRadius:12, fontWeight:800, fontSize:15, textDecoration:"none" }}>
          Go to Login →
        </a>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight:"100vh", background:C.bg, display:"flex" }}>
      {/* Left Panel */}
      <div style={{ width:380, background:"linear-gradient(160deg,#0E1320,#141A2E 50%,#1C2438)", display:"flex", flexDirection:"column", justifyContent:"center", padding:"48px 40px", flexShrink:0, borderRight:"1px solid #2a3350" }} className="signup-left">
        <div style={{ marginBottom:40 }}>
          <img src="/brand/logo-dark.svg" alt="Feature Salon" style={{ height: 40, width: "auto", display: "block", marginBottom: 6, opacity: 0.95 }} />
        </div>
        <h2 style={{ fontSize:24, fontWeight:900, color:"#fff", lineHeight:1.3, marginBottom:10 }}>The last booking software you&apos;ll ever need.</h2>
        <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.55)", lineHeight:1.7, marginBottom:32 }}>Join Health &amp; Wellbeing businesses worldwide managing bookings, staff, and payments — all in one place.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:36 }}>
          {["Online booking page in minutes","Automated WhatsApp & SMS reminders","Staff management & scheduling","Stripe payments & deposits","Client CRM & history","Revenue analytics dashboard"].map(f=>(
            <div key={f} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"rgba(255,255,255,0.8)" }}>
              <div style={{ width:18, height:18, borderRadius:"50%", background:"rgba(16,185,129,0.25)", border:"1.5px solid rgba(16,185,129,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#10B981", fontWeight:800, flexShrink:0 }}>✓</div>
              {f}
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 18px", border:"1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ fontSize:12.5, color:"rgba(255,255,255,0.7)", lineHeight:1.65, margin:0 }}>Be one of the first UK salons on Feature — no commission, no contracts, just straightforward software at a flat monthly price.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <div style={{ width:"100%", maxWidth:460 }}>

          {/* Progress */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
              {STEPS.map((s,i)=>(
                <div key={s} style={{ display:"flex", alignItems:"center", flex: i<STEPS.length-1?1:0 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", background: i<step?C.green:i===step?C.indigo:C.border, color: i<=step?"#fff":C.text3, transition:"all .3s", boxShadow: i===step?`0 4px 12px ${C.indigo}40`:"none" }}>
                      {i<step?"✓":i+1}
                    </div>
                    <span style={{ fontSize:9.5, fontWeight:i===step?700:500, color:i===step?C.indigo:C.text3, whiteSpace:"nowrap" }}>{s}</span>
                  </div>
                  {i<STEPS.length-1 && <div style={{ flex:1, height:2, margin:"0 6px", marginBottom:18, background:i<step?C.green:C.border, transition:"background .3s" }}/>}
                </div>
              ))}
            </div>
          </div>

          {/* Badge */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:800, color:C.indigo, letterSpacing:"2px", textTransform:"uppercase", background:C.indigoSoft, padding:"3px 10px", borderRadius:99, border:"1px solid rgba(201,162,75,0.30)" }}>14-Day Free Trial</div>
            <div style={{ fontSize:11, color:C.text3 }}>No credit card required</div>
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, color:C.text, letterSpacing:"-0.8px", marginBottom:4, lineHeight:1.2 }}>
            {step===0?"Create your account":"Tell us about your business"}
          </h1>
          <p style={{ fontSize:13.5, color:C.text2, marginBottom:24 }}>
            {step===0?"Start your free trial in under 60 seconds.":"Help us personalise your experience."}
          </p>

          {/* Error */}
          {error && (
            <div style={{ background:"rgba(239,68,68,0.10)", border:"1.5px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:13, color:"#F87171" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: error.includes("already exists")?8:0 }}>⚠ {error}</div>
              {error.includes("already exists") && <Link href="/login" style={{ fontSize:13, fontWeight:700, color:C.indigo, textDecoration:"none", background:C.indigoSoft, padding:"5px 12px", borderRadius:7, display:"inline-block", marginTop:4, border:"1px solid rgba(201,162,75,0.30)" }}>→ Sign in</Link>}
            </div>
          )}

          {/* Step 0 */}
          {step===0 && (
            <form onSubmit={step0}>
              <Inp label="Full Name" value={fullName} onChange={setFullName} placeholder="Sarah Johnson" required />
              <Inp label="Email Address" type="email" value={email} onChange={setEmail} placeholder="sarah@yoursalon.com" required />
              <div>
                <Inp label="Password" type={showPw?"text":"password"} value={password} onChange={setPassword} placeholder="Min. 8 characters" required
                  right={<EyeBtn show={showPw} toggle={()=>setShowPw(p=>!p)} />} />
                {password && (
                  <div style={{ marginTop:-10, marginBottom:14 }}>
                    <div style={{ height:3, background:"#2a3350", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:pw.w, background:pw.color, transition:"all .3s", borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:11, color:pw.color, fontWeight:700, marginTop:4 }}>{pw.label}</div>
                  </div>
                )}
              </div>
              <Inp label="Confirm Password" type={showCpw?"text":"password"} value={confirmPw} onChange={setConfirmPw} placeholder="Repeat password" required
                right={<EyeBtn show={showCpw} toggle={()=>setShowCpw(p=>!p)} />} />
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:20, padding:"11px 14px", background:C.indigoSoft, border:`1.5px solid rgba(201,162,75,0.30)`, borderRadius:10 }}>
                <span style={{ fontSize:15, marginTop:1 }}>🔒</span>
                <span style={{ fontSize:12, color:"#C9A24B", lineHeight:1.6 }}>Your data is encrypted and never shared. We comply with GDPR &amp; global data protection law.</span>
              </div>
              <button type="submit" style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg,${C.indigo},${C.indigoDark})`, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:"0 6px 20px rgba(201,162,75,0.35)", transition:"all .15s" }}>
                Continue →
              </button>
              <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:C.text3 }}>
                Already have an account? <Link href="/login" style={{ color:C.indigo, fontWeight:700, textDecoration:"none" }}>Sign in →</Link>
              </div>
            </form>
          )}

          {/* Step 1 */}
          {step===1 && (
            <form onSubmit={step1}>
              <Inp label="Business Name" value={salonName} onChange={setSalonName} placeholder="e.g. The Cut Studio, Serenity Physio…" required hint="Appears on your public booking page." />
              <CountryDropdown value={country} onChange={c=>{ setCountry(c); if(!phone || phone.startsWith("+")) setPhone(c.dial+" "); }} />
              <Inp label="Phone Number (optional)" type="tel" value={phone} onChange={setPhone} placeholder={country ? country.dial+" 000 000 0000" : "+44 000 000 0000"} />
              <Inp label="Company Name (optional)" value={company} onChange={setCompany} placeholder="Your registered company name" />
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12.5, fontWeight:700, color:C.text, display:"block", marginBottom:8 }}>Business Type</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }} className="salon-grid">
                  {BUSINESS_TYPES.map(o=>(
                    <button key={o.key} type="button" onClick={()=>setCategory(o.key)}
                      style={{ padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", border:`1.5px solid ${category===o.key?C.indigo:C.border}`, background:category===o.key?C.indigoSoft:C.bg, color:category===o.key?C.indigo:C.text2, transition:"all .15s" }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <label style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:20, cursor:"pointer" }}>
                <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} style={{ width:16, height:16, marginTop:2, accentColor:C.indigo, flexShrink:0 }} />
                <span style={{ fontSize:12.5, color:C.text2, lineHeight:1.6 }}>
                  I agree to the <Link href="/terms" style={{ color:C.indigo, textDecoration:"none", fontWeight:700 }}>Terms of Service</Link> and <Link href="/privacy" style={{ color:C.indigo, textDecoration:"none", fontWeight:700 }}>Privacy Policy</Link>
                </span>
              </label>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>{ setStep(0); setError(""); }} style={{ padding:"13px 20px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, color:C.text2, fontSize:14, fontWeight:700, cursor:"pointer" }}>← Back</button>
                <button type="submit" disabled={loading} style={{ flex:1, padding:"13px", background: loading?C.text3:`linear-gradient(135deg,${C.indigo},${C.indigoDark})`, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:800, cursor: loading?"not-allowed":"pointer", boxShadow: loading?"none":"0 6px 20px rgba(201,162,75,0.35)", transition:"all .15s" }}>
                  {loading ? <span>Creating… <span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span></span> : "Create Free Account →"}
                </button>
              </div>
            </form>
          )}

          {/* Trust */}
          <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:24, flexWrap:"wrap" }}>
            {[{icon:"🔒",text:"SSL Encrypted"},{icon:"🌍",text:"Global Servers"},{icon:"✓",text:"GDPR Compliant"}].map(b=>(
              <div key={b.text} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.text3 }}><span>{b.icon}</span>{b.text}</div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){.signup-left{display:none!important;}.salon-grid{grid-template-columns:1fr!important;}}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>
    </main>
  );
}
