"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: salonData } = await supabase.from("salons").select("*").eq("owner_id", user.id).single();
      setSalon(salonData);
      setSalonName(salonData?.name || "");
      if (salonData) {
        const { data: servicesData } = await supabase.from("services").select("*").eq("salon_id", salonData.id);
        setServices(servicesData || []);
      }
      setLoading(false);
    };
    loadData();
  }, [router]);

  const handleSaveBrand = async () => {
    if (!salon) return;
    setSaving(true);
    await supabase.from("salons").update({ name: salonName }).eq("id", salon.id);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    await supabase.from("services").insert({ salon_id: salon.id, name: newService.name, price: parseFloat(newService.price), duration: parseInt(newService.duration) });
    setNewService({ name: "", price: "", duration: "" });
    const { data } = await supabase.from("services").select("*").eq("salon_id", salon.id);
    setServices(data || []);
  };

  const handleDeleteService = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#F2F4F7", minHeight: "100vh", padding: "28px 24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>Manage your salon</p>
        <h1 style={{ margin: 0, fontSize: "28px", color: "#0F172A" }}>Settings</h1>
      </div>

      {/* Salon Brand */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "0.5px solid #E8EAF0", padding: "24px", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "16px" }}>Salon Brand</div>
        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>This will appear on your booking page.</p>
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "12px", color: "#64748B", display: "block", marginBottom: "6px" }}>Salon Name</label>
          <input value={salonName} onChange={e => setSalonName(e.target.value)} style={{ padding: "10px 14px", fontSize: "14px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "100%", maxWidth: "320px", boxSizing: "border-box" as const }} />
        </div>
        <button onClick={handleSaveBrand} disabled={saving} style={{ padding: "10px 20px", background: saved ? "#059669" : "#4F6EF7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>
          {saved ? "Saved ✓" : saving ? "Saving..." : "Save Brand"}
        </button>
      </div>

      {/* Services */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "0.5px solid #E8EAF0", padding: "24px", marginBottom: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "4px" }}>Services</div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "16px" }}>{services.length} service{services.length !== 1 ? "s" : ""}</div>

        {services.map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #F1F5F9" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#0F172A" }}>{s.name}</div>
              <div style={{ fontSize: "12px", color: "#94A3B8" }}>{s.duration} min · £{s.price}</div>
            </div>
            <button onClick={() => handleDeleteService(s.id)} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px" }}>Delete</button>
          </div>
        ))}

        <form onSubmit={handleAddService} style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
          <input placeholder="Service name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", flex: "1 1 140px" }} />
          <input placeholder="Price (£)" type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "100px" }} />
          <input placeholder="Duration (min)" type="number" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "120px" }} />
          <button type="submit" style={{ padding: "8px 16px", background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Add</button>
        </form>
      </div>

      {/* Account */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "0.5px solid #E8EAF0", padding: "24px" }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "12px" }}>Account</div>
        <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>{salon?.name}</div>
        <button onClick={handleLogout} style={{ padding: "10px 20px", background: "#FEF2F2", color: "#EF4444", border: "0.5px solid #FECACA", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Sign out</button>
      </div>
    </div>
  );
}