"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

const PLANS = [
  {
    id:          "starter",
    name:        "Starter",
    price:       29,
    color:       "#6366F1",
    gradient:    "linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)",
    badge:       "MOST POPULAR",
    showBadge:   false,
    features:    ["Up to 50 bookings/month","1 staff member","Basic analytics","Email notifications","Public booking page","Online payments"],
    icon:        "✂️",
  },
  {
    id:          "pro",
    name:        "Pro",
    price:       59,
    color:       "#8B5CF6",
    gradient:    "linear-gradient(135deg,#8B5CF6 0%,#7C3AED 100%)",
    badge:       "MOST POPULAR",
    showBadge:   true,
    features:    ["Unlimited bookings","Up to 5 staff members","Advanced analytics","SMS + Email reminders","Custom offers & promotions","Priority support","Stripe online payments"],
    icon:        "💎",
  },
  {
    id:          "business",
    name:        "Business",
    price:       99,
    color:       "#EC4899",
    gradient:    "linear-gradient(135deg,#EC4899 0%,#BE185D 100%)",
    badge:       "",
    showBadge:   false,
    features:    ["Unlimited bookings","Up to 15 staff members","Revenue reports & exports","SMS + Email + reminders","Staff performance tracking","API access","Dedicated account manager","SLA 99.9% uptime"],
    icon:        "🚀",
  },
];

function SubscribeContent() {
  const router       = useRouter();
  const params       = useSearchParams();
  const cancelled    = params.get("cancelled") === "true";
  const [salonId,  setSalonId]  = useState<string | null>(null);
  const [email,    setEmail]    = useState<string>("");
  const [salonName, setSalonName] = useState<string>("");
  const [loading,  setLoading]  = useState<string | null>(null); // plan id that's loading

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email || "");
      const { data: salon } = await supabase.from("salons").select("id,name,subscription_status").eq("owner_id", user.id).single();
      if (!salon) { router.push("/login"); return; }
      // Already active — skip to dashboard
      if (salon.subscription_status === "active" || salon.subscription_status === "trialing") {
        router.push("/dashboard");
        return;
      }
      setSalonId(salon.id);
      setSalonName(salon.name);
    };
    init();
  }, [router]);

  const handleSelect = async (planId: string) => {
    if (!salonId) return;
    setLoading(planId);
    const res = await fetch("/api/subscription/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, salonId, email, salonName }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error: " + (data.error || "Could not start checkout"));
      setLoading(null);
    }
  };

  const handleSkip = () => router.push("/dashboard");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }
        .plan-card { transition: transform 0.22s, box-shadow 0.22s; }
        .plan-card:hover { transform: translateY(-6px); }
        .cta-btn { transition: all 0.18s; }
        .cta-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        .cta-btn:active:not(:disabled) { transform: scale(0.98); }
      `}</style>

      <main style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0F0C29 0%,#302B63 50%,#24243e 100%)", display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px 80px" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:48, animation:"fadeUp 0.5s ease" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.5)", letterSpacing:"3px", textTransform:"uppercase", marginBottom:12 }}>
            feature · salon management
          </div>
          <h1 style={{ fontSize:"clamp(28px,5vw,48px)", fontWeight:900, color:"#fff", letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:16 }}>
            Choose your plan
          </h1>
          <p style={{ fontSize:16, color:"rgba(255,255,255,0.6)", maxWidth:480, margin:"0 auto", lineHeight:1.7 }}>
            Start your <strong style={{ color:"#A78BFA" }}>14-day free trial</strong> today. No credit card required upfront. Cancel anytime.
          </p>

          {/* Trial badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:20, background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:999, padding:"8px 20px" }}>
            <span style={{ fontSize:16 }}>🎁</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#A78BFA" }}>14 days free — then pay monthly. Cancel anytime.</span>
          </div>

          {cancelled && (
            <div style={{ marginTop:16, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 20px", color:"#FCA5A5", fontSize:13, fontWeight:600 }}>
              ⚠️ Checkout was cancelled. Choose a plan below to continue.
            </div>
          )}
        </div>

        {/* Plan Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:24, width:"100%", maxWidth:960, animation:"fadeUp 0.6s ease 0.1s both" }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="plan-card"
              style={{
                background: plan.showBadge ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                border: plan.showBadge ? "2px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius:20,
                overflow:"hidden",
                position:"relative",
                backdropFilter:"blur(12px)",
              }}
            >
              {plan.showBadge && (
                <div style={{ background:"linear-gradient(90deg,#8B5CF6,#EC4899)", textAlign:"center", padding:"6px", fontSize:10, fontWeight:800, color:"#fff", letterSpacing:"2px" }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Plan header */}
              <div style={{ background:plan.gradient, padding:"28px 24px" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{plan.icon}</div>
                <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>{plan.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontSize:42, fontWeight:900, color:"#fff", letterSpacing:"-2px" }}>£{plan.price}</span>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>/month</span>
                </div>
                <div style={{ marginTop:8, fontSize:12, color:"rgba(255,255,255,0.7)", background:"rgba(0,0,0,0.2)", borderRadius:99, padding:"4px 12px", display:"inline-block" }}>
                  Free for 14 days
                </div>
              </div>

              {/* Features */}
              <div style={{ padding:"20px 24px" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13.5, color:"rgba(255,255,255,0.8)" }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:plan.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff", flexShrink:0 }}>✓</div>
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  id={`subscribe-${plan.id}`}
                  className="cta-btn"
                  disabled={loading !== null}
                  onClick={() => handleSelect(plan.id)}
                  style={{
                    width:"100%", padding:"14px", borderRadius:12, border:"none", cursor: loading ? "not-allowed" : "pointer",
                    background: loading === plan.id ? "rgba(255,255,255,0.2)" : plan.gradient,
                    color:"#fff", fontSize:15, fontWeight:800, letterSpacing:"-0.3px",
                    animation: loading === plan.id ? "pulse 1s infinite" : "none",
                  }}
                >
                  {loading === plan.id ? "Opening Checkout..." : `Start Free Trial →`}
                </button>
                <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:10 }}>
                  No charge for 14 days · Cancel anytime
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Skip / compare link */}
        <div style={{ marginTop:36, textAlign:"center", animation:"fadeUp 0.6s ease 0.2s both" }}>
          <button onClick={handleSkip} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:13, cursor:"pointer", textDecoration:"underline" }}>
            Skip for now — use free trial without card
          </button>
        </div>

        {/* Trust badges */}
        <div style={{ display:"flex", gap:24, marginTop:40, flexWrap:"wrap", justifyContent:"center", animation:"fadeUp 0.6s ease 0.3s both" }}>
          {["🔒 SSL Secured","💳 Stripe Payments","🇬🇧 UK-based","✓ Cancel anytime"].map(t => (
            <div key={t} style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.4)" }}>{t}</div>
          ))}
        </div>
      </main>
    </>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", background:"#0F0C29" }} />}>
      <SubscribeContent />
    </Suspense>
  );
}
