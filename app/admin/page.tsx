"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "adilgill2008@gmail.com";
const PLAN_OPTIONS = ["starter", "pro", "premium"];

type Tab = "overview" | "salons" | "revenue" | "users" | "announcements" | "flags" | "settings" | "applications";
const PLAN_PRICE: Record<string,number> = { starter:29, pro:59, premium:99 };
const PLAN_COLOR: Record<string,string> = { starter:"#6366F1", pro:"#10B981", premium:"#F59E0B" };

interface SalonAdmin {
  id: string; name: string; slug: string; plan: string; created_at: string;
  owner_id: string; owner_email: string; appointmentCount: number;
  subscription_status?: string; subscription_plan?: string;
  trial_ends_at?: string; stripe_customer_id?: string;
  [key: string]: unknown;
}
interface UserAdmin { id: string; email: string; salon: string; plan: string; created_at: string; }

interface Agent {
  id: string; full_name: string; phone: string; whatsapp?: string; city: string;
  experience: string; own_vehicle?: boolean; daily_availability: string; why_hire?: string;
  status: "pending" | "approved" | "rejected";
  referral_code?: string; admin_notes?: string; reviewed_at?: string;
  country?: string; street_address?: string; postcode?: string;
  id_card_number?: string; id_card_photo_url?: string; selfie_photo_url?: string;
  referred_salons?: number; created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [salons, setSalons] = useState<SalonAdmin[]>([]);
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [error, setError] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [annSaving, setAnnSaving] = useState(false);
  const [searchSalon, setSearchSalon] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [extendDays, setExtendDays] = useState<Record<string,string>>({});
  const [extendMsg, setExtendMsg] = useState<Record<string,string>>({});
  // Applications tab state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentFilter, setAgentFilter] = useState<"all"|"pending"|"approved"|"rejected">("all");
  const [agentSearch, setAgentSearch] = useState("");
  const [agentSort, setAgentSort] = useState<"latest"|"oldest">("latest");
  const [agentPage, setAgentPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<Agent|null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    const loadAdmin = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
        return;
      }

      const { data: salonData } = await supabase
        .from("salons")
        .select("id, name, slug, plan, created_at, owner_id, owner_email")
        .order("created_at", { ascending: false });

      const { data: appointmentData } = await supabase
        .from("appointments")
        .select("id, salon_id, services(price)");

      const bookingsBySalon: Record<string, number> = {};
      (appointmentData || []).forEach((a: { salon_id: string; services?: { price?: number }[] | { price?: number } | null }) => {
        bookingsBySalon[a.salon_id] = (bookingsBySalon[a.salon_id] || 0) + 1;
      });

      const salonsWithCounts = (salonData || []).map(salon => ({
        ...salon,
        appointmentCount: bookingsBySalon[salon.id] || 0,
      }));

      setSalons(salonsWithCounts as SalonAdmin[]);
      setTotalBookings((appointmentData || []).length);

      const userList: UserAdmin[] = (salonData || []).map(s => ({
        id: s.owner_id,
        email: s.owner_email,
        salon: s.name,
        plan: s.plan,
        created_at: s.created_at,
      }));
      setUsers(userList);
      setLoading(false);
    };

    loadAdmin();
  }, [router]);

  // ── Load agents when Applications tab is opened ──
  const loadAgents = async () => {
    setAgentsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || "";
    try {
      const res = await fetch("/api/partners", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) setAgents(json.agents || []);
    } catch { /* silent */ }
    finally { setAgentsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "applications" && agents.length === 0) loadAgents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const applyAgentAction = async (id: string, status: "approved"|"rejected", notes: string) => {
    setActionLoading(id + status);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || "";
    try {
      const res = await fetch("/api/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ id, status, admin_notes: notes }),
      });
      const json = await res.json();
      if (res.ok && json.agent) {
        setAgents(p => p.map(a => a.id === id ? json.agent : a));
        setSelectedAgent(json.agent);
      }
    } catch { /* silent */ }
    finally { setActionLoading(""); }
  };

  const updateSalonPlan = async (salonId: string, plan: string) => {
    const { error: e } = await supabase.from("salons").update({ plan }).eq("id", salonId);
    if (e) { setError(e.message); return; }
    setSalons(p => p.map(s => s.id === salonId ? { ...s, plan } : s));
  };

  const updateSalonStatus = async (salonId: string, status: string) => {
    const { error: e } = await supabase.from("salons").update({ subscription_status: status }).eq("id", salonId);
    if (e) { setError(e.message); return; }
    setSalons(p => p.map(s => s.id === salonId ? { ...s, subscription_status: status } : s));
  };

  const extendTrial = async (salonId: string) => {
    const days = parseInt(extendDays[salonId] || "7");
    const newDate = new Date(Date.now() + days * 86400000).toISOString();
    const { error: e } = await supabase.from("salons").update({ trial_ends_at: newDate, subscription_status: "trial" }).eq("id", salonId);
    if (e) { setError(e.message); return; }
    setSalons(p => p.map(s => s.id === salonId ? { ...s, trial_ends_at: newDate, subscription_status: "trial" } : s));
    setExtendMsg(p => ({ ...p, [salonId]: `✓ Extended by ${days} days` }));
    setTimeout(() => setExtendMsg(p => { const n={...p}; delete n[salonId]; return n; }), 3000);
  };

  const deleteSalon = async (salonId: string) => {
    if (!confirm("Delete this salon and all its records?")) return;
    const { error: e } = await supabase.from("salons").delete().eq("id", salonId);
    if (e) { setError(e.message); return; }
    setSalons(p => p.filter(s => s.id !== salonId));
  };

  const saveAnnouncement = async () => {
    setAnnSaving(true);
    // Store in a platform_settings table or use a simple approach
    // Broadcast announcement to all salons via a platform_settings pattern
    await supabase.from("salons").update({ announcement } as Record<string, unknown>).neq("id", "00000000-0000-0000-0000-000000000000");
    setTimeout(() => setAnnSaving(false), 1000);
  };

  const mrr = salons.filter(s => s.subscription_status === "active").reduce((sum: number, s: SalonAdmin) => sum + (PLAN_PRICE[s.subscription_plan || s.plan] || 0), 0);
  const trialCount = salons.filter(s => s.subscription_status === "trial" || s.subscription_status === "trialing").length;
  const activeCount = salons.filter(s => s.subscription_status === "active").length;
  const cancelledCount = salons.filter(s => s.subscription_status === "cancelled").length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredSalons = salons.filter(s =>
    s.name?.toLowerCase().includes(searchSalon.toLowerCase()) ||
    s.owner_email?.toLowerCase().includes(searchSalon.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.salon?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const planCounts = PLAN_OPTIONS.reduce((acc, plan) => {
    acc[plan] = salons.filter(s => s.plan === plan).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature admin</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", display: "flex", fontFamily: "system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: "240px", background: "#111", borderRight: "0.5px solid #222", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 20px", borderBottom: "0.5px solid #222" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "18px", color: "#fff" }}>feature</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "4px", letterSpacing: "2px" }}>SUPER ADMIN</div>
        </div>
        <div style={{ padding: "12px 0", flex: 1 }}>
          {([
            { key: "overview", label: "Overview", icon: "📊" },
            { key: "salons", label: "Salons", icon: "💈" },
            { key: "revenue", label: "Revenue", icon: "💰" },
            { key: "users", label: "Users", icon: "👥" },
            { key: "applications", label: "Applications", icon: "🧑‍💼" },
            { key: "announcements", label: "Announcements", icon: "📣" },
            { key: "flags", label: "Feature Flags", icon: "🚩" },
            { key: "settings", label: "Settings", icon: "⚙️" },
          ] as { key: Tab; label: string; icon: string }[]).map((item) => (
            <div key={item.key} onClick={() => setActiveTab(item.key)}
              style={{ padding: "10px 20px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: activeTab === item.key ? "#4F6EF7" : "#666", background: activeTab === item.key ? "#1A1A2E" : "transparent", borderLeft: activeTab === item.key ? "2px solid #4F6EF7" : "2px solid transparent" }}>
              <span>{item.icon}</span>{item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "0.5px solid #222" }}>
          <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px" }}>{ADMIN_EMAIL}</div>
          <button onClick={handleLogout} style={{ fontSize: "12px", color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ background: "#111", borderBottom: "0.5px solid #222", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#fff" }}>
              {activeTab === "overview" && "Platform Overview"}
              {activeTab === "salons" && "Salons Management"}
              {activeTab === "revenue" && "Revenue & Billing"}
              {activeTab === "users" && "Users Management"}
              {activeTab === "applications" && "Employee Applications"}
              {activeTab === "announcements" && "Announcements"}
              {activeTab === "flags" && "Feature Flags"}
              {activeTab === "settings" && "Platform Settings"}
            </div>
            <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>Super Admin Panel</div>
          </div>
          {maintenanceMode && (
            <div style={{ background: "#FEF2F2", color: "#DC2626", fontSize: "12px", padding: "6px 14px", borderRadius: "20px", border: "1px solid #FECACA" }}>
              🔴 Maintenance Mode ON
            </div>
          )}
        </div>

        <div style={{ padding: "28px" }}>
          {error && (
            <div style={{ marginBottom: "20px", padding: "14px 18px", backgroundColor: "#1A0000", border: "0.5px solid #7F1D1D", borderRadius: "10px", color: "#FCA5A5", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {activeTab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "28px" }}>
                {([
                  { label: "MRR", value: `£${mrr}`, icon: "💰", sub: `ARR £${mrr*12}` },
                  { label: "Active Salons", value: activeCount, icon: "✅", sub: "paying" },
                  { label: "On Trial", value: trialCount, icon: "⏳", sub: "free trial" },
                  { label: "Cancelled", value: cancelledCount, icon: "❌", sub: "churned" },
                  { label: "Total Salons", value: salons.length, icon: "💈", sub: "all time" },
                  { label: "Total Bookings", value: totalBookings, icon: "📅", sub: "all salons" },
                ] satisfies { label: string; value: string | number; icon: string; sub: string }[]).map((s) => (
                  <div key={s.label} style={{ background: "#111", border: "0.5px solid #222", borderRadius: "12px", padding: "20px" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>{s.value}</div>
                    <div style={{ fontSize: "12px", color: "#555" }}>{s.label}</div>
                    {s.sub && <div style={{ fontSize: "11px", color: "#444", marginTop: 2 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "16px" }}>Plan Distribution</div>
                  {PLAN_OPTIONS.map((plan) => {
                    const count = planCounts[plan] || 0;
                    const pct = salons.length > 0 ? (count / salons.length) * 100 : 0;
                    return (
                      <div key={plan} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#aaa", textTransform: "capitalize" }}>{plan}</span>
                          <span style={{ fontSize: "12px", color: "#fff" }}>{count} salons</span>
                        </div>
                        <div style={{ height: "6px", background: "#222", borderRadius: "3px" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: plan === "starter" ? "#4F6EF7" : plan === "pro" ? "#10B981" : "#F59E0B", borderRadius: "3px" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#fff", marginBottom: "16px" }}>Recent Salons</div>
                  {salons.slice(0, 5).map((s) => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #1A1A1A" }}>
                      <div>
                        <div style={{ fontSize: "13px", color: "#fff" }}>{s.name}</div>
                        <div style={{ fontSize: "11px", color: "#555" }}>{s.owner_email}</div>
                      </div>
                      <span style={{ fontSize: "11px", background: "#1A1A2E", color: "#4F6EF7", padding: "3px 8px", borderRadius: "20px", textTransform: "capitalize" }}>{s.plan}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "salons" && (
            <div>
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "#555" }}>{filteredSalons.length} salons</div>
                <input type="text" placeholder="Search salons..." value={searchSalon}
                  onChange={(e) => setSearchSalon(e.target.value)}
                  style={{ padding: "8px 14px", background: "#111", border: "0.5px solid #333", borderRadius: "8px", color: "#fff", fontSize: "13px", width: "220px", outline: "none" }} />
              </div>
              <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0A0A0A" }}>
                      {["Salon","Owner","Plan","Status","Bookings","Created","Actions"].map(h => (
                        <th key={h} style={{ fontSize:"11px", color:"#555", textAlign:"left", padding:"12px 18px", fontWeight:500, borderBottom:"0.5px solid #222", letterSpacing:"1px" }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalons.map((salon) => (
                      <tr key={salon.id} style={{ borderBottom:"0.5px solid #1A1A1A" }}>
                        <td style={{ padding:"13px 18px" }}>
                          <div style={{ fontSize:"13px", color:"#fff", fontWeight:500 }}>{salon.name}</div>
                          <div style={{ fontSize:"11px", color:"#555" }}>{salon.slug}</div>
                        </td>
                        <td style={{ padding:"13px 18px", fontSize:"12px", color:"#666" }}>{salon.owner_email || salon.owner_id?.slice(0,8)+"..."}</td>
                        <td style={{ padding:"13px 18px" }}>
                          <select value={salon.plan||"starter"} onChange={e=>updateSalonPlan(salon.id, e.target.value)}
                            style={{ padding:"6px 10px", background:"#1A1A1A", border:"0.5px solid #333", borderRadius:"6px", color:"#fff", fontSize:"12px", cursor:"pointer" }}>
                            {PLAN_OPTIONS.map(plan=><option key={plan} value={plan}>{plan}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:"13px 18px" }}>
                          <select value={salon.subscription_status||"trial"} onChange={e=>updateSalonStatus(salon.id, e.target.value)}
                            style={{ padding:"6px 10px", background:"#1A1A1A", border:"0.5px solid #333", borderRadius:"6px", fontSize:"11px", cursor:"pointer",
                              color: salon.subscription_status==="active"?"#10B981":salon.subscription_status==="trial"?"#F59E0B":"#EF4444" }}>
                            {["trial","trialing","active","past_due","cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:"13px 18px", fontSize:"13px", color:"#fff" }}>{salon.appointmentCount}</td>
                        <td style={{ padding:"13px 18px", fontSize:"12px", color:"#555" }}>{new Date(salon.created_at).toLocaleDateString("en-GB")}</td>
                        <td style={{ padding:"13px 18px" }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                              <input type="number" placeholder="7" value={extendDays[salon.id]||""} onChange={e=>setExtendDays(p=>({...p,[salon.id]:e.target.value}))}
                                style={{ width:44, padding:"4px 6px", background:"#0A0A0A", border:"0.5px solid #333", borderRadius:6, color:"#fff", fontSize:11, outline:"none" }}/>
                              <button onClick={()=>extendTrial(salon.id)}
                                style={{ background:"#1A2040", color:"#4F6EF7", border:"0.5px solid #4F6EF7", borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>
                                +days trial
                              </button>
                            </div>
                            {extendMsg[salon.id] && <span style={{ fontSize:11, color:"#10B981" }}>{extendMsg[salon.id]}</span>}
                            <button onClick={()=>deleteSalon(salon.id)}
                              style={{ background:"#1A0000", color:"#EF4444", border:"0.5px solid #7F1D1D", borderRadius:6, padding:"4px 12px", fontSize:11, cursor:"pointer" }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "#555" }}>{filteredUsers.length} users</div>
                <input type="text" placeholder="Search users..." value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  style={{ padding: "8px 14px", background: "#111", border: "0.5px solid #333", borderRadius: "8px", color: "#fff", fontSize: "13px", width: "220px", outline: "none" }} />
              </div>
              <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0A0A0A" }}>
                      {["User", "Salon", "Plan", "Joined"].map(h => (
                        <th key={h} style={{ fontSize: "11px", color: "#555", textAlign: "left", padding: "12px 18px", fontWeight: 500, borderBottom: "0.5px solid #222", letterSpacing: "1px" }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #1A1A1A" }}>
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1A1A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#4F6EF7", fontWeight: 700 }}>
                              {u.email?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: "13px", color: "#fff" }}>{u.email}</span>
                          </div>
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: "13px", color: "#666" }}>{u.salon}</td>
                        <td style={{ padding: "13px 18px" }}>
                          <span style={{ fontSize: "11px", background: "#1A1A2E", color: "#4F6EF7", padding: "3px 10px", borderRadius: "20px", textTransform: "capitalize" }}>{u.plan}</span>
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: "12px", color: "#555" }}>{new Date(u.created_at).toLocaleDateString("en-GB")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:28 }}>
                {[
                  { label:"MRR", value:`£${mrr}`, color:"#10B981", sub:"Monthly Recurring Revenue" },
                  { label:"ARR", value:`£${mrr*12}`, color:"#6366F1", sub:"Annual Recurring Revenue" },
                  { label:"Active Paying", value:activeCount, color:"#F59E0B", sub:"salons paying now" },
                  { label:"Churn Rate", value: salons.length ? `${Math.round((cancelledCount/salons.length)*100)}%` : "0%", color:"#EF4444", sub:"of all signups cancelled" },
                ].map(s => (
                  <div key={s.label} style={{ background:"#111", border:"0.5px solid #222", borderRadius:12, padding:20 }}>
                    <div style={{ fontSize:28, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{s.label}</div>
                    <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#111", border:"0.5px solid #222", borderRadius:12, padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:16 }}>Revenue by Plan</div>
                {PLAN_OPTIONS.map(plan => {
                  const count = salons.filter(s => (s.subscription_status === "active") && (s.subscription_plan === plan || s.plan === plan)).length;
                  const rev = count * (PLAN_PRICE[plan] || 0);
                  return (
                    <div key={plan} style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
                      <div style={{ width:80, fontSize:12, color:"#aaa", textTransform:"capitalize", textAlign:"right" }}>{plan}</div>
                      <div style={{ flex:1, height:8, background:"#1A1A1A", borderRadius:4 }}>
                        <div style={{ height:"100%", width:`${mrr>0?(rev/mrr*100):0}%`, background:PLAN_COLOR[plan], borderRadius:4, transition:"width 0.5s" }}/>
                      </div>
                      <div style={{ fontSize:12, color:"#fff", minWidth:60 }}>£{rev}/mo · {count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "announcements" && (
            <div style={{ maxWidth:600 }}>
              <div style={{ background:"#111", border:"0.5px solid #222", borderRadius:12, padding:24, marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:4 }}>📣 Send Announcement to All Salons</div>
                <div style={{ fontSize:12, color:"#555", marginBottom:16 }}>This message will appear as a banner on every salon&apos;s dashboard.</div>
                <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)}
                  placeholder="e.g. We're rolling out a new feature next week..." rows={4}
                  style={{ width:"100%", padding:"12px 14px", background:"#0A0A0A", border:"0.5px solid #333", borderRadius:8, color:"#fff", fontSize:13, resize:"vertical", fontFamily:"inherit", boxSizing:"border-box", outline:"none", marginBottom:12 }}/>
                <button onClick={saveAnnouncement} style={{ padding:"10px 22px", background: annSaving ? "#059669" : "#4F6EF7", color:"#fff", border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600 }}>
                  {annSaving ? "✓ Saved!" : "Send to All Salons"}
                </button>
              </div>
              <div style={{ background:"#111", border:"0.5px solid #222", borderRadius:12, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:12 }}>📧 Email Blast (coming soon)</div>
                <div style={{ fontSize:12, color:"#555" }}>Send an email to all registered salon owners. Integration with Resend required.</div>
              </div>
            </div>
          )}

          {activeTab === "flags" && (
            <div>
              <div style={{ fontSize:13, color:"#555", marginBottom:16 }}>Enable or disable features per salon. Changes apply immediately.</div>
              <div style={{ background:"#111", border:"0.5px solid #222", borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#0A0A0A" }}>
                      {["Salon","WhatsApp","Reminders","Online Bookings","Actions"].map(h=>(
                        <th key={h} style={{ fontSize:11, color:"#555", textAlign:"left", padding:"12px 18px", fontWeight:500, borderBottom:"0.5px solid #222", letterSpacing:"1px" }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salons.map(salon => (
                      <tr key={salon.id} style={{ borderBottom:"0.5px solid #1A1A1A" }}>
                        <td style={{ padding:"12px 18px" }}>
                          <div style={{ fontSize:13, color:"#fff", fontWeight:500 }}>{salon.name}</div>
                          <div style={{ fontSize:11, color:"#555" }}>{salon.owner_email}</div>
                        </td>
                        {["whatsapp_enabled","reminders_enabled"].map(flag=>(
                          <td key={flag} style={{ padding:"12px 18px" }}>
                            <button onClick={async()=>{
                              const newVal = !salon[flag];
                              await supabase.from("salons").update({[flag]:newVal}).eq("id",salon.id);
                              setSalons(p=>p.map(s=>s.id===salon.id?{...s,[flag]:newVal}:s));
                            }} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
                              background: salon[flag] ? "#0A2A1A" : "#1A1A1A",
                              color: salon[flag] ? "#10B981" : "#555" }}>
                              {salon[flag] ? "ON" : "OFF"}
                            </button>
                          </td>
                        ))}
                        <td style={{ padding:"12px 18px" }}>
                          <span style={{ fontSize:11, color:salon.subscription_status==="active"?"#10B981":salon.subscription_status==="trial"?"#F59E0B":"#EF4444", background:"#1A1A1A", padding:"3px 10px", borderRadius:20, fontWeight:600 }}>
                            {salon.subscription_status||"unknown"}
                          </span>
                        </td>
                        <td style={{ padding:"12px 18px" }}>
                          <a href={`/book/${salon.slug}`} target="_blank" rel="noopener" style={{ fontSize:11, color:"#4F6EF7", textDecoration:"none" }}>View Booking →</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "applications" && (() => {
            const PER_PAGE = 25;
            const statusColor: Record<string,{bg:string;color:string}> = {
              pending:  { bg:"#FFF7ED", color:"#C2410C" },
              approved: { bg:"#ECFDF5", color:"#065F46" },
              rejected: { bg:"#FEF2F2", color:"#991B1B" },
            };
            const filtered = agents
              .filter(a => agentFilter === "all" || a.status === agentFilter)
              .filter(a => {
                const q = agentSearch.toLowerCase();
                return !q || a.full_name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.phone.includes(q);
              })
              .sort((a,b) => agentSort === "latest"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
            const page = Math.min(agentPage, totalPages);
            const visible = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
            const counts = { all: agents.length, pending: agents.filter(a=>a.status==="pending").length, approved: agents.filter(a=>a.status==="approved").length, rejected: agents.filter(a=>a.status==="rejected").length };

            return (
              <div style={{ animation:"fadeIn 0.2s ease both" }}>
                {/* ── Stat Cards ── */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
                  {([
                    { label:"Total",    value:counts.all,      icon:"👥", accent:"#2D2E5F", light:"#EEEEF8" },
                    { label:"Pending",  value:counts.pending,  icon:"⏳", accent:"#D97706", light:"#FFFBEB" },
                    { label:"Approved", value:counts.approved, icon:"✅", accent:"#059669", light:"#ECFDF5" },
                    { label:"Rejected", value:counts.rejected, icon:"❌", accent:"#DC2626", light:"#FEF2F2" },
                  ]).map(s => (
                    <div key={s.label} onClick={() => { setAgentFilter(s.label.toLowerCase() as "all"|"pending"|"approved"|"rejected"); setAgentPage(1); }}
                      style={{ background:"#fff", borderRadius:16, padding:"18px 20px", boxShadow:"0 2px 12px rgba(45,46,95,0.08)", cursor:"pointer", border:`1.5px solid ${agentFilter===s.label.toLowerCase()?"#E8B4C4":"transparent"}`, transition:"all 0.18s" }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:s.light, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:12 }}>{s.icon}</div>
                      <div style={{ fontSize:28, fontWeight:800, color:s.accent, lineHeight:1 }}>{s.value}</div>
                      <div style={{ fontSize:12, color:"#64748B", marginTop:4, fontWeight:500 }}>{s.label} Applications</div>
                    </div>
                  ))}
                </div>

                {/* ── Toolbar ── */}
                <div style={{ background:"#fff", borderRadius:16, padding:"14px 18px", boxShadow:"0 2px 12px rgba(45,46,95,0.06)", marginBottom:16, display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {(["all","pending","approved","rejected"] as const).map(f => (
                      <button key={f} onClick={() => { setAgentFilter(f); setAgentPage(1); }}
                        style={{ padding:"6px 14px", borderRadius:99, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.15s",
                          background: agentFilter===f ? "#2D2E5F" : "#F1F5F9",
                          color: agentFilter===f ? "#fff" : "#64748B" }}>
                        {f.charAt(0).toUpperCase()+f.slice(1)} {f==="all"?"":"("+counts[f]+")"}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input type="text" placeholder="Search name, city, phone…" value={agentSearch} onChange={e=>{setAgentSearch(e.target.value);setAgentPage(1);}}
                      style={{ padding:"8px 14px", border:"1.5px solid #E2E8F0", borderRadius:99, fontSize:12.5, outline:"none", width:220, color:"#0F172A" }} />
                    <button onClick={() => setAgentSort(s => s==="latest"?"oldest":"latest")}
                      style={{ padding:"8px 14px", borderRadius:99, background:"#F1F5F9", border:"none", fontSize:12, cursor:"pointer", color:"#475569", fontWeight:600, whiteSpace:"nowrap" }}>
                      {agentSort==="latest" ? "⬇ Latest" : "⬆ Oldest"}
                    </button>
                    <button onClick={loadAgents} style={{ padding:"8px 14px", borderRadius:99, background:"#2D2E5F", border:"none", fontSize:12, cursor:"pointer", color:"#fff", fontWeight:600 }}>
                      ↻ Refresh
                    </button>
                  </div>
                </div>

                {/* ── Table ── */}
                <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 2px 12px rgba(45,46,95,0.07)", overflow:"hidden", marginBottom:16 }}>
                  {agentsLoading ? (
                    <div style={{ padding:48, textAlign:"center", color:"#94A3B8", fontSize:14 }}>Loading applications…</div>
                  ) : visible.length === 0 ? (
                    <div style={{ padding:48, textAlign:"center" }}>
                      <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                      <div style={{ fontSize:14, color:"#94A3B8" }}>No applications found</div>
                    </div>
                  ) : (
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"#F9E7EC" }}>
                          {["Applicant","City","Experience","Availability","Applied","Status","Actions"].map(h => (
                            <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#2D2E5F", letterSpacing:"0.8px", textTransform:"uppercase", borderBottom:"1.5px solid #F0D4DC" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((a,i) => (
                          <tr key={a.id} style={{ borderBottom:"1px solid #F8F0F3", background: i%2===0?"#fff":"#FDFAFA", transition:"background 0.12s" }}>
                            <td style={{ padding:"13px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#2D2E5F,#4F6EF7)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0 }}>
                                  {a.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{a.full_name}</div>
                                  <div style={{ fontSize:11, color:"#94A3B8" }}>{a.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:"13px 16px", fontSize:13, color:"#475569" }}>{a.city}</td>
                            <td style={{ padding:"13px 16px", fontSize:12.5, color:"#475569", textTransform:"capitalize" }}>{a.experience?.replace(/-/g," ")}</td>
                            <td style={{ padding:"13px 16px", fontSize:12.5, color:"#475569", textTransform:"capitalize" }}>{a.daily_availability?.replace(/-/g," ")}</td>
                            <td style={{ padding:"13px 16px", fontSize:12, color:"#94A3B8" }}>{new Date(a.created_at).toLocaleDateString("en-GB")}</td>
                            <td style={{ padding:"13px 16px" }}>
                              <span style={{ padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:700, background:statusColor[a.status]?.bg, color:statusColor[a.status]?.color }}>
                                {a.status.charAt(0).toUpperCase()+a.status.slice(1)}
                              </span>
                              {a.referral_code && <div style={{ fontSize:10, color:"#94A3B8", marginTop:3, fontFamily:"monospace" }}>{a.referral_code}</div>}
                            </td>
                            <td style={{ padding:"13px 16px" }}>
                              <button onClick={() => { setSelectedAgent(a); setModalNotes(a.admin_notes||""); }}
                                style={{ padding:"6px 14px", borderRadius:8, background:"#EEF2FF", color:"#2D2E5F", border:"none", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                                View →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div style={{ display:"flex", gap:6, justifyContent:"center", alignItems:"center" }}>
                    <button onClick={() => setAgentPage(p=>Math.max(1,p-1))} disabled={page===1}
                      style={{ padding:"6px 14px", borderRadius:8, background:page===1?"#F1F5F9":"#2D2E5F", color:page===1?"#94A3B8":"#fff", border:"none", cursor:page===1?"default":"pointer", fontSize:12, fontWeight:600 }}>← Prev</button>
                    <span style={{ fontSize:13, color:"#64748B" }}>Page {page} of {totalPages}</span>
                    <button onClick={() => setAgentPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                      style={{ padding:"6px 14px", borderRadius:8, background:page===totalPages?"#F1F5F9":"#2D2E5F", color:page===totalPages?"#94A3B8":"#fff", border:"none", cursor:page===totalPages?"default":"pointer", fontSize:12, fontWeight:600 }}>Next →</button>
                  </div>
                )}

                {/* ── Detail Modal ── */}
                {selectedAgent && (
                  <div onClick={e=>{if(e.target===e.currentTarget){setSelectedAgent(null);}}}
                    style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(45,46,95,0.45)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                    <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:680, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(45,46,95,0.25)" }}>
                      {/* Modal Header */}
                      <div style={{ background:"linear-gradient(135deg,#2D2E5F,#4F6EF7)", borderRadius:"24px 24px 0 0", padding:"24px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                          <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,255,255,0.2)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800 }}>
                            {selectedAgent.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize:18, fontWeight:700, color:"#fff" }}>{selectedAgent.full_name}</div>
                            <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:statusColor[selectedAgent.status]?.bg, color:statusColor[selectedAgent.status]?.color }}>
                              {selectedAgent.status.charAt(0).toUpperCase()+selectedAgent.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedAgent(null)}
                          style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"6px 12px", color:"#fff", cursor:"pointer", fontSize:16 }}>✕</button>
                      </div>

                      <div style={{ padding:"24px 28px" }}>
                        {/* Info grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                          {[
                            { label:"Phone",        value: selectedAgent.phone },
                            { label:"WhatsApp",     value: selectedAgent.whatsapp || "—" },
                            { label:"City",         value: selectedAgent.city },
                            { label:"Country",      value: selectedAgent.country || "GB" },
                            { label:"Experience",   value: selectedAgent.experience?.replace(/-/g," ") || "—" },
                            { label:"Availability", value: selectedAgent.daily_availability?.replace(/-/g," ") || "—" },
                            { label:"Vehicle",      value: selectedAgent.own_vehicle ? "Yes ✓" : "No" },
                            { label:"Applied",      value: new Date(selectedAgent.created_at).toLocaleDateString("en-GB") },
                          ].map(f => (
                            <div key={f.label} style={{ background:"#F8FAFC", borderRadius:10, padding:"12px 14px" }}>
                              <div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>{f.label}</div>
                              <div style={{ fontSize:13, color:"#0F172A", fontWeight:500, textTransform:"capitalize" }}>{f.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Why hire */}
                        {selectedAgent.why_hire && (
                          <div style={{ background:"#F0F4FF", borderRadius:12, padding:"14px 16px", marginBottom:20, border:"1px solid #C7D2FE" }}>
                            <div style={{ fontSize:11, color:"#4F6EF7", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Why They Should Be Hired</div>
                            <p style={{ fontSize:13, color:"#334155", lineHeight:1.7, margin:0 }}>{selectedAgent.why_hire}</p>
                          </div>
                        )}

                        {/* ID Info */}
                        {selectedAgent.id_card_number && (
                          <div style={{ background:"#FFFBEB", borderRadius:12, padding:"14px 16px", marginBottom:20, border:"1px solid #FDE68A" }}>
                            <div style={{ fontSize:11, color:"#D97706", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>🪪 Identity Verification</div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                              <div style={{ fontSize:12, color:"#92400E" }}>ID Number: <strong>{selectedAgent.id_card_number}</strong></div>
                            </div>
                            <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                              {selectedAgent.id_card_photo_url && <a href={selectedAgent.id_card_photo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:"#4F6EF7", fontWeight:600, textDecoration:"none", background:"#EEF2FF", padding:"5px 12px", borderRadius:6 }}>View ID Photo ↗</a>}
                              {selectedAgent.selfie_photo_url && <a href={selectedAgent.selfie_photo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:"#059669", fontWeight:600, textDecoration:"none", background:"#ECFDF5", padding:"5px 12px", borderRadius:6 }}>View Selfie ↗</a>}
                            </div>
                          </div>
                        )}

                        {/* Referral code (if approved) */}
                        {selectedAgent.referral_code && (
                          <div style={{ background:"#ECFDF5", borderRadius:12, padding:"14px 16px", marginBottom:20, border:"1px solid #6EE7B7", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div>
                              <div style={{ fontSize:11, color:"#065F46", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Referral Code</div>
                              <div style={{ fontSize:18, fontWeight:800, color:"#065F46", fontFamily:"monospace" }}>{selectedAgent.referral_code}</div>
                            </div>
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:11, color:"#94A3B8" }}>Referred Salons</div>
                              <div style={{ fontSize:24, fontWeight:800, color:"#059669" }}>{selectedAgent.referred_salons || 0}</div>
                            </div>
                          </div>
                        )}

                        {/* Admin Notes */}
                        <div style={{ marginBottom:20 }}>
                          <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Internal Admin Notes</label>
                          <textarea value={modalNotes} onChange={e=>setModalNotes(e.target.value)} rows={3} placeholder="Add notes visible only to admins…"
                            style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1.5px solid #E2E8F0", fontSize:13, color:"#0F172A", resize:"vertical", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
                        </div>

                        {/* Action Buttons */}
                        {selectedAgent.status === "pending" ? (
                          <div style={{ display:"flex", gap:10 }}>
                            <button
                              onClick={() => applyAgentAction(selectedAgent.id, "approved", modalNotes)}
                              disabled={!!actionLoading}
                              style={{ flex:1, padding:"13px", borderRadius:12, background: actionLoading ? "#94A3B8" : "linear-gradient(135deg,#059669,#10B981)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor: actionLoading?"not-allowed":"pointer", boxShadow:"0 4px 14px rgba(16,185,129,0.3)" }}>
                              {actionLoading===selectedAgent.id+"approved" ? "Approving…" : "✓ Approve & Generate Code"}
                            </button>
                            <button
                              onClick={() => applyAgentAction(selectedAgent.id, "rejected", modalNotes)}
                              disabled={!!actionLoading}
                              style={{ flex:1, padding:"13px", borderRadius:12, background: actionLoading ? "#94A3B8" : "linear-gradient(135deg,#DC2626,#EF4444)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor: actionLoading?"not-allowed":"pointer", boxShadow:"0 4px 14px rgba(239,68,68,0.3)" }}>
                              {actionLoading===selectedAgent.id+"rejected" ? "Rejecting…" : "✕ Reject Application"}
                            </button>
                          </div>
                        ) : (
                          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                            {selectedAgent.status === "approved" && (
                              <button onClick={() => applyAgentAction(selectedAgent.id, "rejected", modalNotes)} disabled={!!actionLoading}
                                style={{ padding:"10px 20px", borderRadius:10, background:"#FEF2F2", color:"#DC2626", border:"1.5px solid #FECACA", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                                Revoke Approval
                              </button>
                            )}
                            {selectedAgent.status === "rejected" && (
                              <button onClick={() => applyAgentAction(selectedAgent.id, "approved", modalNotes)} disabled={!!actionLoading}
                                style={{ padding:"10px 20px", borderRadius:10, background:"#ECFDF5", color:"#059669", border:"1.5px solid #6EE7B7", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                                Re-approve
                              </button>
                            )}
                            <button onClick={() => {
                              applyAgentAction(selectedAgent.id, selectedAgent.status as "approved"|"rejected", modalNotes);
                            }} style={{ padding:"10px 20px", borderRadius:10, background:"#EEF2FF", color:"#4F6EF7", border:"1.5px solid #C7D2FE", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                              Save Notes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === "settings" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:600 }}>
              <div style={{ background:"#111", border:"0.5px solid #222", borderRadius:12, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:"#fff", marginBottom:4 }}>Maintenance Mode</div>
                    <div style={{ fontSize:12, color:"#555" }}>Show maintenance page to all users</div>
                  </div>
                  <button onClick={() => setMaintenanceMode(!maintenanceMode)}
                    style={{ padding:"8px 18px", background: maintenanceMode?"#7F1D1D":"#1A2040", color: maintenanceMode?"#FCA5A5":"#4F6EF7", border:`1px solid ${maintenanceMode?"#991B1B":"#4F6EF7"}`, borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:500 }}>
                    {maintenanceMode?"Turn OFF":"Turn ON"}
                  </button>
                </div>
              </div>
              <div style={{ background:"#111", border:"0.5px solid #222", borderRadius:12, padding:20 }}>
                <div style={{ fontSize:14, fontWeight:500, color:"#fff", marginBottom:12 }}>Admin Access</div>
                <div style={{ fontSize:13, color:"#555", marginBottom:8 }}>Only this email can access admin panel:</div>
                <div style={{ fontSize:13, color:"#4F6EF7", background:"#0A0A1A", padding:"10px 14px", borderRadius:8, fontFamily:"monospace" }}>{ADMIN_EMAIL}</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}