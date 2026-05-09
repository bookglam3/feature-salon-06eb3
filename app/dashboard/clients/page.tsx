"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentUserProfile } from "../../lib/auth";

type SortKey = "name" | "bookings" | "spent" | "lastVisit";

export default function ClientsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastVisit");
  const [selected, setSelected] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMsg, setNoteMsg] = useState("");

  useEffect(() => {
    (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) { router.push("/login"); return; }
      setSalon(profile.salon);
      const { data: appts } = await supabase
        .from("appointments")
        .select("client_name,client_email,client_phone,id,date_time,status,services(name,price)")
        .eq("salon_id", profile.salon.id)
        .order("date_time", { ascending: false });

      const map = new Map<string, any>();
      (appts || []).forEach((a: any) => {
        const key = a.client_email || a.client_name;
        const price = Array.isArray(a.services)
          ? a.services.reduce((s: number, x: any) => s + Number(x?.price ?? 0), 0)
          : Number(a.services?.price ?? 0);
        const svcName = Array.isArray(a.services) ? a.services[0]?.name : a.services?.name;
        if (!map.has(key)) {
          map.set(key, {
            name: a.client_name, email: a.client_email, phone: a.client_phone,
            lastVisit: new Date(a.date_time), bookings: 1, spent: price,
            services: svcName ? { [svcName]: 1 } : {},
          });
        } else {
          const c = map.get(key)!;
          c.bookings += 1;
          c.spent += price;
          if (svcName) c.services[svcName] = (c.services[svcName] || 0) + 1;
        }
      });
      setClients(Array.from(map.values()));
      setLoading(false);
    })();
  }, [router]);

  const openClient = async (c: any) => {
    setSelected(c);
    setNote(c.note || "");
    setHistLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*,services(name,price),staff(name)")
      .eq("salon_id", salon.id)
      .eq("client_email", c.email)
      .order("date_time", { ascending: false });
    setHistory(data || []);
    setHistLoading(false);
  };

  const saveNote = async () => {
    if (!selected) return;
    setNoteSaving(true);
    // store note in a client_notes table or just keep in state for now
    setClients(p => p.map(c => c.email === selected.email ? { ...c, note } : c));
    setSelected((p: any) => ({ ...p, note }));
    setNoteMsg("✓ Saved");
    setTimeout(() => setNoteMsg(""), 2000);
    setNoteSaving(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients
      .filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q))
      .sort((a, b) => {
        if (sortKey === "name") return (a.name || "").localeCompare(b.name || "");
        if (sortKey === "bookings") return b.bookings - a.bookings;
        if (sortKey === "spent") return b.spent - a.spent;
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      });
  }, [clients, search, sortKey]);

  const topSpender = clients.reduce((max, c) => c.spent > (max?.spent || 0) ? c : max, null);
  const newThisMonth = clients.filter(c => {
    const d = new Date(c.lastVisit);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const avgSpend = clients.length ? Math.round(clients.reduce((s, c) => s + c.spent, 0) / clients.length) : 0;

  const favService = (c: any) => {
    if (!c.services || Object.keys(c.services).length === 0) return null;
    return Object.entries(c.services).sort((a: any, b: any) => b[1] - a[1])[0][0];
  };

  const daysSince = (d: Date) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  const statusColor = (s: string) =>
    s === "confirmed" ? { bg: "#ECFDF5", color: "#059669" }
    : s === "cancelled" ? { bg: "#FEF2F2", color: "#DC2626" }
    : { bg: "#FFF7ED", color: "#D97706" };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <div style={{ fontSize:24, color:"var(--indigo)", fontWeight:800 }}>feature</div>
    </div>
  );

  return (
    <div style={{ padding:"24px", maxWidth:1400, margin:"0 auto" }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Clients", value:clients.length, icon:"👤", color:"#6366F1" },
          { label:"New This Month", value:newThisMonth, icon:"✨", color:"#10B981" },
          { label:"Avg Spend", value:`£${avgSpend}`, icon:"💷", color:"#F59E0B" },
          { label:"Top Spender", value:topSpender ? `£${topSpender.spent}` : "—", icon:"🏆", color:"#EF4444" },
        ].map(s => (
          <div key={s.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)", padding:"18px 20px", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color, letterSpacing:"-0.5px" }}>{s.value}</div>
            <div style={{ fontSize:11.5, color:"var(--text-3)", marginTop:2, fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>

        {/* Client List */}
        <div style={{ flex: selected ? "0 0 52%" : "1", minWidth:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)", overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
          {/* Header */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <input type="text" placeholder="🔍 Search clients..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ flex:1, minWidth:140, padding:"9px 14px", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", fontSize:13, fontFamily:"inherit", outline:"none", background:"var(--surface-2)" }}/>
            <select value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)}
              style={{ padding:"9px 12px", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", fontSize:13, fontFamily:"inherit", background:"var(--surface-2)", cursor:"pointer", outline:"none" }}>
              <option value="lastVisit">Latest Visit</option>
              <option value="spent">Most Spent</option>
              <option value="bookings">Most Bookings</option>
              <option value="name">Name A–Z</option>
            </select>
            <span style={{ fontSize:12, color:"var(--text-3)", whiteSpace:"nowrap" }}>{filtered.length} clients</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding:"60px 24px", textAlign:"center", color:"var(--text-3)" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>👤</div>
              <div style={{ fontSize:14, fontWeight:600 }}>{search ? "No clients found" : "No clients yet"}</div>
              <div style={{ fontSize:12, marginTop:4 }}>Clients appear here after their first booking</div>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:520 }}>
                <thead>
                  <tr style={{ background:"var(--surface-2)" }}>
                    {["Client","Contact","Bookings","Spent","Last Visit",""].map(h=>(
                      <th key={h} style={{ fontSize:11, color:"var(--text-3)", textAlign:"left", padding:"10px 16px", fontWeight:700, borderBottom:"1px solid var(--border)", letterSpacing:"0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const ds = daysSince(c.lastVisit);
                    const isActive = selected?.email === c.email;
                    return (
                      <tr key={i} onClick={()=>openClient(c)}
                        style={{ cursor:"pointer", background: isActive ? "var(--indigo-light)" : "transparent", transition:"background 0.1s" }}
                        onMouseEnter={e=>{ if(!isActive) (e.currentTarget as HTMLElement).style.background="var(--slate-50)"; }}
                        onMouseLeave={e=>{ if(!isActive) (e.currentTarget as HTMLElement).style.background="transparent"; }}
                      >
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:"50%", background:"var(--indigo-light)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"var(--indigo)", flexShrink:0 }}>
                              {c.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:"var(--text-1)" }}>{c.name}</div>
                              {favService(c) && <div style={{ fontSize:10.5, color:"var(--text-3)", marginTop:1 }}>⭐ {favService(c)}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                          <div style={{ fontSize:12, color:"var(--text-2)" }}>{c.email || "—"}</div>
                          <div style={{ fontSize:11, color:"var(--text-3)", marginTop:1 }}>{c.phone || "—"}</div>
                        </td>
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                          <span style={{ background:"var(--indigo-light)", color:"var(--indigo)", fontSize:12, padding:"4px 10px", borderRadius:"var(--r-full)", fontWeight:700 }}>{c.bookings}</span>
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:"var(--text-1)", borderBottom:"1px solid var(--border)" }}>£{c.spent.toFixed(0)}</td>
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                          <div style={{ fontSize:12, color:"var(--text-2)" }}>{new Date(c.lastVisit).toLocaleDateString("en-GB")}</div>
                          <div style={{ fontSize:10.5, color: ds > 60 ? "var(--red)" : ds > 30 ? "var(--amber)" : "var(--green)", marginTop:1, fontWeight:600 }}>
                            {ds === 0 ? "Today" : `${ds}d ago`}
                          </div>
                        </td>
                        <td style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
                          <span style={{ fontSize:11, color:"var(--indigo)", fontWeight:600 }}>View →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ flex:"0 0 46%", minWidth:0, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)", overflow:"hidden", boxShadow:"var(--shadow-md)", display:"flex", flexDirection:"column", maxHeight:"80vh" }}>

            {/* Header */}
            <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,var(--indigo),var(--indigo-dark))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff" }}>
                  {selected.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--text-1)" }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-3)" }}>{selected.email}</div>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} style={{ background:"var(--slate-100)", border:"none", cursor:"pointer", width:28, height:28, borderRadius:"50%", fontSize:14, color:"var(--text-2)", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>

            {/* Quick Actions */}
            <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:8, flexShrink:0 }}>
              {selected.phone && (
                <a href={`https://wa.me/${selected.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener"
                  style={{ flex:1, background:"#ECFDF5", color:"#059669", border:"1px solid #A7F3D0", borderRadius:"var(--r-sm)", padding:"8px", fontSize:12, fontWeight:700, textAlign:"center", textDecoration:"none", display:"block" }}>
                  💬 WhatsApp
                </a>
              )}
              {selected.phone && (
                <a href={`tel:${selected.phone}`}
                  style={{ flex:1, background:"var(--indigo-light)", color:"var(--indigo)", border:"1px solid var(--indigo-pale)", borderRadius:"var(--r-sm)", padding:"8px", fontSize:12, fontWeight:700, textAlign:"center", textDecoration:"none", display:"block" }}>
                  📞 Call
                </a>
              )}
              {salon?.slug && (
                <a href={`/book/${salon.slug}`} target="_blank" rel="noopener"
                  style={{ flex:1, background:"var(--slate-100)", color:"var(--text-2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"8px", fontSize:12, fontWeight:700, textAlign:"center", textDecoration:"none", display:"block" }}>
                  📅 Book Again
                </a>
              )}
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"var(--border)", flexShrink:0 }}>
              {[
                { label:"Visits", value:selected.bookings },
                { label:"Total Spent", value:`£${selected.spent.toFixed(0)}` },
                { label:"Fav Service", value:favService(selected) || "—" },
              ].map(s=>(
                <div key={s.label} style={{ background:"var(--surface-2)", padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:800, color:"var(--text-1)", letterSpacing:"-0.3px" }}>{s.value}</div>
                  <div style={{ fontSize:10.5, color:"var(--text-3)", marginTop:2, fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:"var(--text-2)", marginBottom:6, letterSpacing:"0.5px" }}>NOTES</div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
                placeholder="Add notes about this client..."
                style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", fontSize:12.5, fontFamily:"inherit", resize:"none", outline:"none", background:"var(--surface-2)", color:"var(--text-1)", boxSizing:"border-box" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                <span style={{ fontSize:11, color:"var(--green)" }}>{noteMsg}</span>
                <button onClick={saveNote} disabled={noteSaving}
                  style={{ padding:"5px 14px", background:"var(--indigo)", color:"#fff", border:"none", borderRadius:"var(--r-sm)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  Save Note
                </button>
              </div>
            </div>

            {/* Booking History */}
            <div style={{ padding:"12px 20px 8px", flexShrink:0 }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:"var(--text-2)", letterSpacing:"0.5px" }}>BOOKING HISTORY</div>
            </div>
            <div style={{ flex:1, overflowY:"auto" }}>
              {histLoading ? (
                <div style={{ padding:32, textAlign:"center", color:"var(--text-3)", fontSize:13 }}>Loading...</div>
              ) : history.length === 0 ? (
                <div style={{ padding:32, textAlign:"center", color:"var(--text-3)", fontSize:13 }}>No bookings found</div>
              ) : history.map(b => {
                const sc = statusColor(b.status);
                return (
                  <div key={b.id} style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text-1)", marginBottom:2 }}>
                        {Array.isArray(b.services) ? b.services[0]?.name : b.services?.name || "Service"}
                      </div>
                      <div style={{ fontSize:11, color:"var(--text-3)" }}>
                        {new Date(b.date_time).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                        {b.staff?.name && ` · ${b.staff.name}`}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text-1)", marginBottom:3 }}>
                        £{Array.isArray(b.services) ? b.services[0]?.price : b.services?.price || 0}
                      </div>
                      <span style={{ background:sc.bg, color:sc.color, fontSize:10, padding:"2px 8px", borderRadius:"var(--r-full)", fontWeight:700 }}>{b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}