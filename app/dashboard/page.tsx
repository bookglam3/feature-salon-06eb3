"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
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

const TIME_SLOTS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00"];

const PLAN_FEATURES: Record<string, { color: string; bg: string; border: string; badge: string; features: string[]; limit: string }> = {
  Starter:      { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", badge: "STARTER",      features: ["Up to 50 bookings/mo","1 staff member","Basic analytics","Email notifications","Public booking page"],            limit: "50 bookings/month" },
  Professional: { color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", badge: "PROFESSIONAL", features: ["Unlimited bookings","Up to 5 staff","Advanced analytics","SMS + Email","Custom offers","Priority support"],        limit: "Unlimited bookings" },
  Growth:       { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", badge: "GROWTH",       features: ["Unlimited bookings","Up to 15 staff","Revenue reports","SMS + Email + WhatsApp","Staff performance","API access"], limit: "Unlimited bookings" },
  Enterprise:   { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", badge: "ENTERPRISE",   features: ["Unlimited everything","Unlimited staff","White-label option","Dedicated support","Custom integrations","SLA 99.9%"], limit: "Unlimited everything" },
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    confirmed: ["var(--green-light)", "var(--green)", "var(--green-pale)"],
    pending:   ["var(--indigo-light)", "var(--indigo)", "var(--indigo-pale)"],
    cancelled: ["var(--red-light)", "var(--red)", "var(--red-pale)"],
  };
  const [bg, color, border] = map[status] || map.pending;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: bg, color, border: `1px solid ${border}`, letterSpacing: "0.3px", textTransform: "capitalize" }}>{status}</span>;
}

function QuickAction({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-md)", cursor: "pointer", transition: "all 0.16s", flex: 1, minWidth: 72, fontFamily: "var(--font)" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ width: 42, height: 42, borderRadius: "var(--r-sm)", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

function MiniStat({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px 14px", position: "relative", overflow: "hidden", transition: "all 0.16s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "var(--r-lg) var(--r-lg) 0 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</div>
    </div>
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
  const [formData, setFormData] = useState({ client_name:"", client_email:"", client_phone:"", service_id:"", staff_id:"", date:"", time:"" });
  const [offerForm, setOfferForm] = useState({ title:"", description:"", discount_type:"percentage", discount_value:"", valid_until:"", active:true });

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile?.salon) { router.push("/login"); return; }
      setSalon(profile.salon);
      const id = profile.salon.id;
      const today = new Date().toISOString().slice(0,10);
      const [{ data: appts },{ data: staffData },{ data: svcs },{ data: ofrs }] = await Promise.all([
        supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id",id).order("date_time",{ascending:true}),
        supabase.from("staff").select("id,name").eq("salon_id",id),
        supabase.from("services").select("*").eq("salon_id",id),
        supabase.from("offers").select("*").eq("salon_id",id).eq("active",true).or(`valid_until.is.null,valid_until.gte.${today}`).order("created_at",{ascending:false}),
      ]);
      setAppointments(appts||[]); setStaff(staffData||[]); setServices(svcs||[]); setOffers(ofrs||[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const reloadAppts = useCallback(async () => {
    if (!salon) return;
    const { data } = await supabase.from("appointments").select("*, services(name,price), staff(name)").eq("salon_id",salon.id).order("date_time",{ascending:true});
    setAppointments(data||[]);
  }, [salon]);

  const handleNewBooking = useCallback(async () => {
    if (!salon||!formData.client_name||!formData.date||!formData.time) { toast.error("Fill required fields"); return; }
    const date_time = new Date(formData.date+"T"+formData.time).toISOString();
    const { error } = await supabase.from("appointments").insert({ salon_id:salon.id, client_name:formData.client_name, client_email:formData.client_email, client_phone:formData.client_phone, service_id:formData.service_id||null, staff_id:formData.staff_id||null, date_time, status:"confirmed" });
    if (error) { toast.error("Failed to create booking"); return; }
    const svc = services.find(s=>s.id===formData.service_id);
    const stf = staff.find(s=>s.id===formData.staff_id);
    await fetch("/api/send-booking-emails",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ clientEmail:formData.client_email, clientName:formData.client_name, clientPhone:formData.client_phone, serviceName:svc?.name||"Service", dateTime:date_time, staffName:stf?.name, salonName:salon.name, salonOwnerEmail:salon.owner_email }) });
    toast.success("Booking created successfully!");
    setShowModal(false);
    setFormData({ client_name:"", client_email:"", client_phone:"", service_id:"", staff_id:"", date:"", time:"" });
    await reloadAppts();
  }, [salon,formData,services,staff,toast,reloadAppts]);

  const handleAddOffer = useCallback(async () => {
    if (!salon||!offerForm.title) { toast.error("Title required"); return; }
    const { data,error } = await supabase.from("offers").insert({ salon_id:salon.id, title:offerForm.title, description:offerForm.description, discount_type:offerForm.discount_type, discount_value:parseFloat(offerForm.discount_value)||0, valid_until:offerForm.valid_until||null, active:offerForm.active }).select();
    if (error) { toast.error("Failed to add offer"); return; }
    if (data) setOffers(p=>[data[0],...p]);
    toast.success("Offer added!");
    setShowOfferModal(false);
    setOfferForm({ title:"", description:"", discount_type:"percentage", discount_value:"", valid_until:"", active:true });
  }, [salon,offerForm,toast]);

  const handleToggleOffer = useCallback(async (id:string,current:boolean) => {
    await supabase.from("offers").update({active:!current}).eq("id",id);
    setOffers(p=>p.map(o=>o.id===id?{...o,active:!current}:o));
    toast.success(current?"Offer paused":"Offer activated");
  }, [toast]);

  const handleDeleteOffer = useCallback(async (id:string) => {
    await supabase.from("offers").delete().eq("id",id);
    setOffers(p=>p.filter(o=>o.id!==id));
    toast.success("Offer removed");
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`${origin}/book/${salon?.slug}`);
    setCopied(true);
    toast.success("Booking link copied!");
    setTimeout(()=>setCopied(false),2500);
  }, [origin,salon,toast]);

  const now = new Date();
  const todayStr = now.toDateString();
  const todayAppts = useMemo(()=>appointments.filter(a=>new Date(a.date_time).toDateString()===todayStr),[appointments,todayStr]);
  const upcomingAppts = useMemo(()=>appointments.filter(a=>new Date(a.date_time)>now),[appointments]);
  const revenue = useMemo(()=>todayAppts.reduce((s,a)=>s+(a.services?.price||0),0),[todayAppts]);
  const totalRevenue = useMemo(()=>appointments.filter(a=>a.status==="confirmed").reduce((s,a)=>s+(a.services?.price||0),0),[appointments]);
  const filteredAppts = useMemo(()=>{
    if (activeTab==="Today") return todayAppts;
    if (activeTab==="Upcoming") return upcomingAppts;
    return appointments;
  },[activeTab,appointments,todayAppts,upcomingAppts]);

  const greeting = useMemo(()=>{ const h=now.getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; },[]);
  const bookingLink = `${origin}/book/${salon?.slug}`;
  const plan = salon?.plan||"Starter";
  const planInfo = PLAN_FEATURES[plan]||PLAN_FEATURES.Starter;

  if (loading) return (
    <DashboardShell salonName="" topbar={<header style={{background:"#fff",borderBottom:"1px solid var(--border)",height:58,display:"flex",alignItems:"center",padding:"0 20px",gap:14}}><div style={{width:36,height:12,borderRadius:6}} className="skeleton"/><div style={{width:140,height:12,borderRadius:6}} className="skeleton"/></header>}>
      <SkeletonDashboard/>
    </DashboardShell>
  );

  const Topbar = (
    <header style={{background:"#fff",borderBottom:"1px solid var(--border)",padding:"0 20px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:30,gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <HamburgerBtn onClick={()=>{}}/>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.3px"}}>{greeting}, {salon?.name?.split(" ")[0]} 👋</div>
          <div style={{fontSize:11.5,color:"var(--text-3)"}}>{now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{padding:"5px 12px",borderRadius:99,background:planInfo.bg,border:`1px solid ${planInfo.border}`,fontSize:10.5,fontWeight:800,color:planInfo.color,letterSpacing:"0.8px"}}>{planInfo.badge}</div>
        <button onClick={()=>setShowModal(true)} style={{display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,var(--indigo) 0%,var(--indigo-dark) 100%)",color:"#fff",fontSize:13,fontWeight:700,padding:"9px 18px",borderRadius:99,border:"none",cursor:"pointer",boxShadow:"var(--shadow-indigo)",whiteSpace:"nowrap",letterSpacing:"-0.2px",transition:"all 0.16s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(99,102,241,0.4)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="var(--shadow-indigo)";}}
        >＋ New Booking</button>
      </div>
    </header>
  );

  return (
    <DashboardShell salonName={salon?.name} topbar={Topbar}>
      <div style={{padding:"24px 20px",maxWidth:1280,margin:"0 auto"}}>

        {/* Welcome banner */}
        <div style={{background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 40%,#4338CA 70%,#6366F1 100%)",borderRadius:"var(--r-xl)",padding:"28px 28px",marginBottom:24,position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(99,102,241,0.35)"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
          <div style={{position:"absolute",bottom:-60,right:80,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
          <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:18}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:"2px",textTransform:"uppercase",marginBottom:6}}>Salon Dashboard</div>
              <h1 style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-0.8px",margin:0,lineHeight:1.2}}>{salon?.name}</h1>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.6)",margin:0,marginTop:6}}>Here is your salon performance overview for today</p>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={handleCopyLink} style={{padding:"9px 18px",background:copied?"rgba(16,185,129,0.25)":"rgba(255,255,255,0.12)",color:"#fff",border:`1px solid ${copied?"rgba(16,185,129,0.5)":"rgba(255,255,255,0.2)"}`,borderRadius:99,fontSize:12.5,fontWeight:600,cursor:"pointer",transition:"all 0.14s",backdropFilter:"blur(8px)",letterSpacing:"-0.1px"}}>
                {copied?"✓ Link Copied!":"🔗 Copy Booking Link"}
              </button>
              <button onClick={()=>window.open(`/book/${salon?.slug}`,"_blank")} style={{padding:"9px 18px",background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",borderRadius:99,fontSize:12.5,fontWeight:600,cursor:"pointer",transition:"all 0.14s",backdropFilter:"blur(8px)"}}>
                Preview Page ↗
              </button>
              <a href="/dashboard/reports" style={{padding:"9px 18px",background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.15)",borderRadius:99,fontSize:12.5,fontWeight:600,cursor:"pointer",transition:"all 0.14s",textDecoration:"none",backdropFilter:"blur(8px)"}}>
                View Reports 📊
              </a>
            </div>
          </div>
        </div>

        {/* 6 Stat cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
          <MiniStat label="Today Bookings" value={todayAppts.length} color="var(--indigo)" icon="📅"/>
          <MiniStat label="Revenue Today" value={`£${revenue}`} color="var(--green)" icon="💷"/>
          <MiniStat label="Upcoming" value={upcomingAppts.length} color="#8B5CF6" icon="⏰"/>
          <MiniStat label="Total Revenue" value={`£${totalRevenue}`} color="#F59E0B" icon="💰"/>
          <MiniStat label="Total Bookings" value={appointments.length} color="#06B6D4" icon="📋"/>
          <MiniStat label="Staff Members" value={staff.length} color="#EC4899" icon="✂️"/>
        </div>
        {/* Quick Actions */}
        <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"18px 20px",marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--text-3)",letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:14}}>Quick Actions</div>
          <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:2}}>
            <QuickAction icon="📅" label="New Booking"  color="var(--indigo)" onClick={()=>setShowModal(true)}/>
            <QuickAction icon="🎁" label="Add Offer"    color="var(--green)"  onClick={()=>setShowOfferModal(true)}/>
            <QuickAction icon="👤" label="Add Client"   color="#8B5CF6"        onClick={()=>router.push("/dashboard/clients")}/>
            <QuickAction icon="✂️" label="Add Staff"    color="#EC4899"        onClick={()=>router.push("/dashboard/staff")}/>
            <QuickAction icon="📊" label="Reports"      color="#F59E0B"        onClick={()=>router.push("/dashboard/reports")}/>
            <QuickAction icon="⚙️" label="Settings"    color="#06B6D4"        onClick={()=>router.push("/dashboard/settings")}/>
          </div>
        </div>

        {/* Two column layout on desktop */}
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>
          <style>{`@media(min-width:900px){.dash-cols{grid-template-columns:3fr 2fr!important}}`}</style>
          <div className="dash-cols" style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>

            {/* LEFT column */}
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* Upcoming appointments */}
              <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid var(--border)"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.25px"}}>Upcoming Appointments</div>
                    <div style={{fontSize:12,color:"var(--text-3)",marginTop:1}}>{upcomingAppts.length} scheduled</div>
                  </div>
                  <a href="/dashboard/bookings" style={{fontSize:12,fontWeight:600,color:"var(--indigo)",textDecoration:"none"}}>View all →</a>
                </div>
                {upcomingAppts.length===0 ? (
                  <EmptyState icon="📅" title="No upcoming appointments" description="Share your booking link to get clients" action={{label:"Copy Link",onClick:handleCopyLink}}/>
                ):(
                  <div>
                    {upcomingAppts.slice(0,6).map((a,i)=>(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",borderBottom:i<Math.min(upcomingAppts.length,6)-1?"1px solid var(--slate-100)":"none",transition:"background 0.1s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="var(--slate-50)";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
                      >
                        <div style={{width:46,height:46,borderRadius:"var(--r-sm)",background:"var(--indigo-light)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid var(--indigo-pale)"}}>
                          <div style={{fontSize:13,fontWeight:800,color:"var(--indigo)",lineHeight:1}}>{new Date(a.date_time).getDate()}</div>
                          <div style={{fontSize:9,fontWeight:700,color:"var(--indigo)",textTransform:"uppercase",letterSpacing:"0.5px"}}>{new Date(a.date_time).toLocaleDateString("en-GB",{month:"short"})}</div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13.5,fontWeight:700,color:"var(--text-1)",letterSpacing:"-0.2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.client_name}</div>
                          <div style={{fontSize:12,color:"var(--text-3)",marginTop:1}}>{a.services?.name||"No service"}{a.staff?.name?` · ${a.staff.name}`:""}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                          <div style={{fontSize:12.5,fontWeight:700,color:"var(--text-1)"}}>{new Date(a.date_time).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
                          {a.services?.price?<div style={{fontSize:11.5,color:"var(--green)",fontWeight:700}}>£{a.services.price}</div>:null}
                          <StatusPill status={a.status}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Appointments table */}
              <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:10}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text-1)"}}>All Appointments</div>
                  <div style={{display:"flex",gap:2,background:"var(--slate-100)",padding:3,borderRadius:8}}>
                    {["All","Today","Upcoming"].map(t=>(
                      <button key={t} onClick={()=>setActiveTab(t)} style={{fontSize:12,padding:"5px 12px",borderRadius:6,border:"none",background:activeTab===t?"#fff":"transparent",color:activeTab===t?"var(--indigo)":"var(--text-3)",cursor:"pointer",fontWeight:activeTab===t?700:500,boxShadow:activeTab===t?"var(--shadow-xs)":"none",transition:"all 0.12s"}}>{t}</button>
                    ))}
                  </div>
                </div>
                {filteredAppts.length===0?(
                  <EmptyState icon="📋" title="No appointments" description="No appointments match this filter"/>
                ):(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
                      <thead>
                        <tr style={{background:"var(--slate-50)"}}>
                          {["Status","Client","Service","Staff","Date & Time","Amount"].map(h=>(
                            <th key={h} style={{fontSize:10,fontWeight:700,color:"var(--text-3)",textAlign:"left",padding:"10px 16px",letterSpacing:"0.6px",textTransform:"uppercase",borderBottom:"1px solid var(--border)"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppts.map(a=>(
                          <tr key={a.id} style={{transition:"background 0.1s"}}
                            onMouseEnter={e=>{(e.currentTarget as HTMLTableRowElement).style.background="var(--slate-50)";}}
                            onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background="transparent";}}
                          >
                            <td style={{padding:"11px 16px",borderBottom:"1px solid var(--slate-100)"}}><StatusPill status={a.status}/></td>
                            <td style={{padding:"11px 16px",borderBottom:"1px solid var(--slate-100)",fontSize:13,fontWeight:600,color:"var(--text-1)"}}>{a.client_name}</td>
                            <td style={{padding:"11px 16px",borderBottom:"1px solid var(--slate-100)",fontSize:13,color:"var(--text-2)"}}>{a.services?.name||"—"}</td>
                            <td style={{padding:"11px 16px",borderBottom:"1px solid var(--slate-100)",fontSize:13,color:"var(--text-3)"}}>{a.staff?.name||"—"}</td>
                            <td style={{padding:"11px 16px",borderBottom:"1px solid var(--slate-100)",fontSize:12.5,color:"var(--text-2)"}}>{new Date(a.date_time).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</td>
                            <td style={{padding:"11px 16px",borderBottom:"1px solid var(--slate-100)",fontSize:13,fontWeight:700,color:"var(--green)"}}>{a.services?.price?`£${a.services.price}`:"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            {/* RIGHT column */}
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* Subscription Plan Card */}
              <div style={{background:`linear-gradient(135deg,${planInfo.bg} 0%,#fff 100%)`,border:`2px solid ${planInfo.border}`,borderRadius:"var(--r-lg)",overflow:"hidden"}}>
                <div style={{padding:"16px 18px",borderBottom:`1px solid ${planInfo.border}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:"1.5px",color:planInfo.color,textTransform:"uppercase"}}>Current Plan</div>
                    <div style={{padding:"3px 10px",borderRadius:99,background:planInfo.color,color:"#fff",fontSize:9.5,fontWeight:800,letterSpacing:"1px"}}>{planInfo.badge}</div>
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:"var(--text-1)",letterSpacing:"-0.5px"}}>{plan} Plan</div>
                  <div style={{fontSize:12,color:"var(--text-3)",marginTop:2}}>{planInfo.limit}</div>
                </div>
                <div style={{padding:"14px 18px"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                    {planInfo.features.map((f:string,i:number)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12.5,color:"var(--text-2)"}}>
                        <span style={{width:18,height:18,borderRadius:"50%",background:planInfo.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,flexShrink:0}}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                  {plan!=="Enterprise"&&(
                    <a href="/dashboard/settings" style={{display:"block",textAlign:"center",padding:"10px",background:"linear-gradient(135deg,var(--indigo) 0%,var(--indigo-dark) 100%)",color:"#fff",borderRadius:"var(--r-sm)",fontSize:13,fontWeight:700,textDecoration:"none",letterSpacing:"-0.2px",boxShadow:"var(--shadow-indigo)"}}>
                      Upgrade Plan ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Special Offers */}
              <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--border)"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--text-1)"}}>Special Offers</div>
                    <div style={{fontSize:12,color:"var(--text-3)",marginTop:1}}>{offers.length} active offers</div>
                  </div>
                  <button onClick={()=>setShowOfferModal(true)} style={{padding:"6px 12px",background:"var(--green-light)",color:"var(--green-dark)",border:"1px solid var(--green-pale)",borderRadius:"var(--r-sm)",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.12s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--green-pale)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="var(--green-light)";}}
                  >+ Add</button>
                </div>
                {offers.length===0?(
                  <EmptyState icon="🎁" title="No offers" description="Attract clients with special offers" action={{label:"+ Create Offer",onClick:()=>setShowOfferModal(true)}}/>
                ):(
                  <div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
                    {offers.map(offer=>{
                      const label=offer.discount_type==="percentage"?`${offer.discount_value}% off`:`£${offer.discount_value} off`;
                      const expired=offer.valid_until&&new Date(offer.valid_until)<new Date();
                      return (
                        <div key={offer.id} style={{border:"1px solid var(--border)",borderRadius:"var(--r-md)",padding:"12px 14px",opacity:offer.active?1:0.55,transition:"all 0.14s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--indigo-pale)";e.currentTarget.style.boxShadow="var(--shadow-sm)";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="none";}}
                        >
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                            <div style={{fontSize:13,fontWeight:700,color:"var(--text-1)",lineHeight:1.3}}>{offer.title}</div>
                            <label style={{position:"relative",width:30,height:16,cursor:"pointer",flexShrink:0,marginTop:2}}>
                              <input type="checkbox" checked={offer.active} onChange={()=>handleToggleOffer(offer.id,offer.active)} style={{opacity:0,width:0,height:0}}/>
                              <span style={{position:"absolute",inset:0,background:offer.active?"var(--green)":"var(--slate-300)",borderRadius:99,transition:"background 0.18s"}}>
                                <span style={{position:"absolute",width:10,height:10,left:offer.active?17:3,top:3,background:"#fff",borderRadius:"50%",transition:"left 0.18s"}}/>
                              </span>
                            </label>
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                            <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"var(--green-light)",color:"var(--green)",border:"1px solid var(--green-pale)"}}>🎉 {label}</span>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:11,color:expired?"var(--red)":"var(--text-3)"}}>{expired?"Expired":offer.valid_until?`Until ${new Date(offer.valid_until).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`:"No expiry"}</span>
                              <button onClick={()=>handleDeleteOffer(offer.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-3)",fontSize:13,padding:0,transition:"color 0.12s"}}
                                onMouseEnter={e=>{e.currentTarget.style.color="var(--red)";}}
                                onMouseLeave={e=>{e.currentTarget.style.color="var(--text-3)";}}
                              >🗑</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Staff overview */}
              <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text-1)"}}>Team Overview</div>
                  <a href="/dashboard/staff" style={{fontSize:12,fontWeight:600,color:"var(--indigo)",textDecoration:"none"}}>Manage →</a>
                </div>
                {staff.length===0?(
                  <EmptyState icon="✂️" title="No staff" description="Add team members to assign bookings" action={{label:"Add Staff",onClick:()=>router.push("/dashboard/staff")}}/>
                ):(
                  <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
                    {staff.slice(0,5).map(s=>{
                      const colors=["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6"];
                      const bg=colors[s.name.charCodeAt(0)%colors.length];
                      const initials=s.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
                      const staffAppts=appointments.filter(a=>a.staff_id===s.id&&a.status==="confirmed");
                      return (
                        <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:"var(--r-sm)",border:"1px solid var(--border)",transition:"all 0.12s"}}
                          onMouseEnter={e=>{e.currentTarget.style.background="var(--slate-50)";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
                        >
                          <div style={{width:36,height:36,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{initials}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:"var(--text-1)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                            <div style={{fontSize:11.5,color:"var(--text-3)"}}>{staffAppts.length} bookings</div>
                          </div>
                          <div style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:99,background:"var(--green-light)",color:"var(--green)",border:"1px solid var(--green-pale)"}}>Active</div>
                        </div>
                      );
                    })}
                    {staff.length>5&&<div style={{fontSize:12,color:"var(--text-3)",textAlign:"center",padding:"6px 0"}}>+{staff.length-5} more staff members</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Booking Modal */}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="New Booking">
        <FormGroup label="Client Name *"><Input placeholder="Sarah Johnson" value={formData.client_name} onChange={e=>setFormData({...formData,client_name:e.target.value})}/></FormGroup>
        <FormGroup label="Email"><Input type="email" placeholder="sarah@email.com" value={formData.client_email} onChange={e=>setFormData({...formData,client_email:e.target.value})}/></FormGroup>
        <FormGroup label="Phone"><Input placeholder="+44 7700 900000" value={formData.client_phone} onChange={e=>setFormData({...formData,client_phone:e.target.value})}/></FormGroup>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FormGroup label="Date *"><Input type="date" value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})}/></FormGroup>
          <FormGroup label="Time *"><Select value={formData.time} onChange={e=>setFormData({...formData,time:e.target.value})}><option value="">Select time</option>{TIME_SLOTS.map(t=><option key={t} value={t}>{t}</option>)}</Select></FormGroup>
        </div>
        <FormGroup label="Service"><Select value={formData.service_id} onChange={e=>setFormData({...formData,service_id:e.target.value})}><option value="">Select service</option>{services.map(s=><option key={s.id} value={s.id}>{s.name} — £{s.price}</option>)}</Select></FormGroup>
        <FormGroup label="Staff Member"><Select value={formData.staff_id} onChange={e=>setFormData({...formData,staff_id:e.target.value})}><option value="">Assign staff (optional)</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></FormGroup>
        <ModalActions><BtnSecondary onClick={()=>setShowModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleNewBooking} disabled={!formData.client_name||!formData.date||!formData.time}>Create Booking</BtnPrimary></ModalActions>
      </Modal>

      {/* Add Offer Modal */}
      <Modal open={showOfferModal} onClose={()=>setShowOfferModal(false)} title="Add Special Offer">
        <FormGroup label="Offer Title *"><Input placeholder="e.g. Summer Special" value={offerForm.title} onChange={e=>setOfferForm({...offerForm,title:e.target.value})}/></FormGroup>
        <FormGroup label="Description"><textarea placeholder="Describe your offer..." value={offerForm.description} onChange={e=>setOfferForm({...offerForm,description:e.target.value})} rows={2} style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border-2)",borderRadius:"var(--r-sm)",fontSize:14,resize:"vertical",fontFamily:"var(--font)",outline:"none"}}/></FormGroup>
        <FormGroup label="Discount">
          <div style={{display:"flex",gap:8}}>
            <Select value={offerForm.discount_type} onChange={e=>setOfferForm({...offerForm,discount_type:e.target.value})} style={{flex:"0 0 150px"}}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (£)</option></Select>
            <Input type="number" min="0" placeholder={offerForm.discount_type==="percentage"?"e.g. 20":"e.g. 10"} value={offerForm.discount_value} onChange={e=>setOfferForm({...offerForm,discount_value:e.target.value})}/>
          </div>
        </FormGroup>
        <FormGroup label="Valid Until (optional)"><Input type="date" value={offerForm.valid_until} onChange={e=>setOfferForm({...offerForm,valid_until:e.target.value})}/></FormGroup>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"var(--slate-50)",borderRadius:"var(--r-sm)",border:"1px solid var(--border)",marginBottom:4}}>
          <div><div style={{fontSize:13,fontWeight:600,color:"var(--text-1)"}}>Publish on booking page</div><div style={{fontSize:11.5,color:"var(--text-3)",marginTop:1}}>Clients see this immediately</div></div>
          <label style={{position:"relative",width:32,height:17,cursor:"pointer"}}>
            <input type="checkbox" checked={offerForm.active} onChange={e=>setOfferForm({...offerForm,active:e.target.checked})} style={{opacity:0,width:0,height:0}}/>
            <span style={{position:"absolute",inset:0,background:offerForm.active?"var(--green)":"var(--slate-300)",borderRadius:99,transition:"background 0.18s"}}>
              <span style={{position:"absolute",width:11,height:11,left:offerForm.active?18:3,top:3,background:"#fff",borderRadius:"50%",transition:"left 0.18s"}}/>
            </span>
          </label>
        </div>
        <ModalActions><BtnSecondary onClick={()=>setShowOfferModal(false)}>Cancel</BtnSecondary><BtnPrimary onClick={handleAddOffer} disabled={!offerForm.title}>Save Offer</BtnPrimary></ModalActions>
      </Modal>
    </DashboardShell>
  );
}