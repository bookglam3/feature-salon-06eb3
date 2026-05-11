"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const ADMIN_EMAIL = "adilgill2008@gmail.com";
const PLAN_OPTIONS = ["starter", "pro", "premium"];

type Tab = "overview" | "salons" | "revenue" | "users" | "announcements" | "flags" | "settings";
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