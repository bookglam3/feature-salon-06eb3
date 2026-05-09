"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentUserProfile } from "@/app/lib/auth";
import DashboardShell, { HamburgerBtn } from "../components/DashboardShell";
import { useToast } from "../components/Toast";

interface Photo { id: string; url: string; caption: string; category: string; is_featured: boolean; created_at: string; }

const CATEGORIES = ["general", "haircut", "color", "styling", "nails", "beard", "facial", "before-after"];

export default function GalleryPage() {
  const router = useRouter();
  const toast = useToast();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonName, setSalonName] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ url: "", caption: "", category: "general", is_featured: false });

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile?.salon) { router.push("/login"); return; }
      setSalonId(profile.salon.id);
      setSalonName(profile.salon.name);
      const { data } = await supabase.from("gallery_photos").select("*").eq("salon_id", profile.salon.id).order("created_at", { ascending: false });
      setPhotos(data || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleAdd = async () => {
    if (!salonId || !form.url) { toast.error("Image URL required"); return; }
    const { data, error } = await supabase.from("gallery_photos").insert({ salon_id: salonId, ...form }).select().single();
    if (error) { toast.error("Failed to add photo"); return; }
    setPhotos(p => [data, ...p]);
    toast.success("Photo added!");
    setShowModal(false);
    setForm({ url: "", caption: "", category: "general", is_featured: false });
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("gallery_photos").update({ is_featured: !current }).eq("id", id);
    setPhotos(p => p.map(ph => ph.id === id ? { ...ph, is_featured: !current } : ph));
    toast.success(current ? "Unfeatured" : "Featured!");
  };

  const deletePhoto = async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    await supabase.from("gallery_photos").delete().eq("id", id);
    setPhotos(p => p.filter(ph => ph.id !== id));
    toast.success("Photo deleted");
  };

  const filtered = filter === "all" ? photos : filter === "featured" ? photos.filter(p => p.is_featured) : photos.filter(p => p.category === filter);

  const Topbar = (
    <header style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HamburgerBtn onClick={() => {}} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>📸 Gallery</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 1 }}>Showcase your salon work</div>
        </div>
      </div>
      <button onClick={() => setShowModal(true)} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#EC4899,#DB2777)", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(236,72,153,0.3)" }}>+ Add Photo</button>
    </header>
  );

  if (loading) return <DashboardShell salonName={salonName} topbar={Topbar}><div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Loading…</div></DashboardShell>;

  return (
    <DashboardShell salonName={salonName} topbar={Topbar}>
      <div style={{ padding: "28px 24px", maxWidth: 1360, margin: "0 auto" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total Photos", value: photos.length, color: "#EC4899" },
            { label: "Featured", value: photos.filter(p => p.is_featured).length, color: "#F59E0B" },
            { label: "Categories", value: new Set(photos.map(p => p.category)).size, color: "#6366F1" },
            { label: "This Month", value: photos.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).length, color: "#10B981" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 16, padding: "18px 16px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {["all", "featured", ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filter === cat ? "#EC4899" : "#E2E8F0"}`, background: filter === cat ? "#FDF2F8" : "#fff", color: filter === cat ? "#DB2777" : "#64748B", fontSize: 12.5, fontWeight: filter === cat ? 800 : 500, cursor: "pointer", transition: "all 0.12s", textTransform: "capitalize" }}>
              {cat} {cat === "all" ? `(${photos.length})` : cat === "featured" ? `(${photos.filter(p => p.is_featured).length})` : `(${photos.filter(p => p.category === cat).length})`}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ fontWeight: 700 }}>No photos yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Add your salon portfolio photos</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
            {filtered.map(photo => (
              <div key={photo.id} style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", cursor: "pointer", transition: "transform 0.18s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
                <img src={photo.url} alt={photo.caption} onClick={() => setLightbox(photo)}
                  style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(photo.caption||"Photo")}&size=400&background=F1F5F9&color=94A3B8`; }} />
                {photo.is_featured && (
                  <div style={{ position: "absolute", top: 10, left: 10, background: "#F59E0B", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 99 }}>⭐ Featured</div>
                )}
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); toggleFeatured(photo.id, photo.is_featured); }}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>⭐</button>
                  <button onClick={e => { e.stopPropagation(); deletePhoto(photo.id); }}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
                </div>
                {photo.caption && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.7))", padding: "20px 12px 10px", color: "#fff", fontSize: 12, fontWeight: 600 }}>{photo.caption}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={lightbox.url} alt={lightbox.caption} style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 16, objectFit: "contain" }} />
          {lightbox.caption && <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center" }}>{lightbox.caption}</div>}
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Add Photo Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", marginBottom: 20 }}>📸 Add Photo</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Image URL *</label>
                <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com/photo.jpg"
                  style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                {form.url && <img src={form.url} alt="" style={{ marginTop: 8, width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Caption</label>
                <input value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="e.g. Balayage transformation"
                  style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit" }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: "capitalize" }}>{c}</option>)}
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "#475569" }}>⭐ Mark as featured</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: 13.5, fontWeight: 700, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAdd} disabled={!form.url} style={{ flex: 2, padding: 12, background: "linear-gradient(135deg,#EC4899,#DB2777)", border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: !form.url ? 0.5 : 1 }}>Add Photo</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
