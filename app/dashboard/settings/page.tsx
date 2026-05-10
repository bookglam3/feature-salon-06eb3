"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// ─── Types ────────────────────────────────────────────────────
interface PaymentMethods {
  full_online: boolean;
  deposit_online: boolean;
  pay_at_salon: boolean;
  custom_deposit: boolean;
  deposit_percent: number;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethods = {
  full_online: true,
  deposit_online: true,
  pay_at_salon: false,
  custom_deposit: false,
  deposit_percent: 50,
};

// ─── Toggle switch ────────────────────────────────────────────
function Toggle({
  id, checked, onChange, disabled,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      id={id} type="button" role="switch" aria-checked={checked}
      disabled={disabled} onClick={() => onChange(!checked)}
      style={{
        position: "relative", display: "inline-flex", width: 44, height: 24,
        borderRadius: 999, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "#4F6EF7" : "#CBD5E1", transition: "background 0.2s",
        flexShrink: 0, padding: 0, opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.18)", transition: "left 0.2s",
      }} />
    </button>
  );
}

// ─── Payment Method Row ───────────────────────────────────────
function PaymentMethodRow({
  icon, title, description, checked, id, onChange, children,
}: {
  icon: string; title: string; description: string;
  checked: boolean; id: string; onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      border: `1.5px solid ${checked ? "#4F6EF7" : "#E8EAF0"}`,
      borderRadius: 12, padding: "16px 18px", marginBottom: 10,
      background: checked ? "#F5F7FF" : "#FAFAFA",
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{title}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{description}</div>
          </div>
        </div>
        <Toggle id={id} checked={checked} onChange={onChange} />
      </div>
      {checked && children && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #E8EAF0" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Booking Page Preview ─────────────────────────────────────
function BookingPreview({ pm, price = 65 }: { pm: PaymentMethods; price?: number }) {
  const depositPct = pm.custom_deposit ? pm.deposit_percent : 50;
  const depositAmt = ((price * depositPct) / 100).toFixed(2);

  const options = [
    pm.full_online    && { label: "Pay Full Amount",     sub: "Pay 100% now — nothing due at the salon", amount: `£${price}`, color: "#667eea" },
    pm.deposit_online && { label: "50% Deposit",          sub: "Pay half now, remainder at salon",         amount: `£${(price * 0.5).toFixed(2)}`, color: "#10B981" },
    pm.custom_deposit && { label: `${depositPct}% Deposit`, sub: `Pay ${depositPct}% now, remainder at salon`, amount: `£${depositAmt}`, color: "#F59E0B" },
    pm.pay_at_salon   && { label: "Pay at Salon",         sub: "No payment required now",                  amount: "£0",    color: "#94A3B8" },
  ].filter(Boolean) as { label: string; sub: string; amount: string; color: string }[];

  if (!options.length) {
    return (
      <div style={{ padding: "16px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FECACA", fontSize: 12, color: "#DC2626" }}>
        ⚠️ No payment methods enabled — clients won't be able to complete bookings.
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFF", borderRadius: 12, padding: 16, border: "1px solid #E0E7FF" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#4F6EF7", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>
        Preview — How clients see it
      </div>
      {options.map((opt, i) => (
        <div key={i} style={{
          border: `2px solid ${i === 0 ? "#667eea" : "#E2E8F0"}`,
          borderRadius: 12, padding: "12px 14px", marginBottom: 8,
          background: i === 0 ? "rgba(102,126,234,0.04)" : "white",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{opt.sub}</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: opt.color }}>{opt.amount}</div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, textAlign: "center" }}>
        Example service price: £{price}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Main Settings Page
// ═════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [description, setDescription] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({ name: "", price: "", duration_minutes: "", description: "" });
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({ name: "", price: "", duration_minutes: "", description: "" });
  const [serviceError, setServiceError] = useState("");

  // Booking link copy
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const handleCopyLink = useCallback(() => {
    if (!salon) return;
    navigator.clipboard.writeText(`${origin}/book/${salon.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [origin, salon]);

  // Reminder settings
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reviewLink, setReviewLink] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  // WhatsApp settings
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waSaved, setWaSaved] = useState(false);

  // Payment methods
  const [pm, setPm] = useState<PaymentMethods>(DEFAULT_PAYMENT_METHODS);
  const [pmSaving, setPmSaving] = useState(false);
  const [pmSaved, setPmSaved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: salonData } = await supabase
        .from("salons").select("*").eq("owner_id", user.id).single();

      setSalon(salonData);
      setSalonName(salonData?.name || "");
      setLogoUrl(salonData?.logo_url || "");
      setLogoUrlInput(salonData?.logo_url || "");
      setDescription(salonData?.description || "");
      setRemindersEnabled(salonData?.reminders_enabled ?? true);
      setReviewLink(salonData?.review_link || "");
      setWhatsappEnabled(salonData?.whatsapp_enabled ?? false);

      // Load payment methods — fall back to defaults if column missing
      if (salonData?.payment_methods) {
        setPm({ ...DEFAULT_PAYMENT_METHODS, ...salonData.payment_methods });
      }

      if (salonData) {
        const { data: servicesData } = await supabase
          .from("services").select("*").eq("salon_id", salonData.id);
        setServices(servicesData || []);
      }
      setLoading(false);
    };
    loadData();
  }, [router]);

  const handleSaveBrand = async () => {
    if (!salon) return;
    setSaving(true);
    // Use storage URL first, then manual URL input, then null
    const finalLogoUrl = (logoUrl && !logoUrl.startsWith("data:")) ? logoUrl
      : (logoUrlInput.trim() || null);
    // Auto-update slug when name changes
    const newSlug = salonName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const slugChanged = newSlug !== salon.slug && salonName !== salon.name;
    await supabase.from("salons").update({
      name: salonName,
      logo_url: finalLogoUrl,
      description: description || null,
      ...(slugChanged ? { slug: newSlug } : {}),
    }).eq("id", salon.id);
    if (finalLogoUrl) setLogoUrl(finalLogoUrl);
    if (slugChanged) setSalon((prev: any) => ({ ...prev, slug: newSlug }));
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = async (file: File) => {
    if (!salon) return;
    if (!file.type.startsWith("image/")) { setLogoError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setLogoError("Image must be less than 5MB."); return; }
    setLogoError("");
    setLogoUploading(true);
    const ext = file.name.split(".").pop();
    const path = `salon-logos/${salon.id}/logo.${ext}`;
    const { error: upErr } = await supabase.storage.from("salon-assets").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setLogoUploading(false);
      setLogoError("Storage upload failed. Please create the 'salon-assets' bucket in Supabase Storage, or paste your logo URL below.");
      return;
    }
    const { data: urlData } = supabase.storage.from("salon-assets").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();
    setLogoUrl(publicUrl);
    setLogoUrlInput(publicUrl);
    setLogoUploading(false);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    const price = parseFloat(newService.price);
    if (!newService.name.trim()) { setServiceError("Service name is required."); return; }
    if (isNaN(price) || price <= 0) { setServiceError("Price must be greater than 0."); return; }
    setServiceError("");
    const { error } = await supabase.from("services").insert({
      salon_id: salon.id,
      name: newService.name.trim(),
      price,
      duration_minutes: parseInt(newService.duration_minutes) || null,
      description: newService.description.trim() || null,
    });
    if (error) { setServiceError("Failed to add: " + error.message); return; }
    setNewService({ name: "", price: "", duration_minutes: "", description: "" });
    const { data } = await supabase.from("services").select("*").eq("salon_id", salon.id);
    setServices(data || []);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const price = parseFloat(editServiceForm.price);
    if (!editServiceForm.name.trim()) { setServiceError("Service name is required."); return; }
    if (isNaN(price) || price <= 0) { setServiceError("Price must be greater than 0."); return; }
    setServiceError("");
    const { error } = await supabase.from("services").update({
      name: editServiceForm.name.trim(),
      price,
      duration_minutes: parseInt(editServiceForm.duration_minutes) || null,
      description: editServiceForm.description?.trim() || null,
    }).eq("id", editingService.id);
    if (error) { setServiceError("Failed to update: " + error.message); return; }
    setEditingService(null);
    const { data } = await supabase.from("services").select("*").eq("salon_id", salon?.id);
    setServices(data || []);
  };

  const handleDeleteService = async (id: string) => {
    // Check for linked appointments first
    const { data: linked } = await supabase.from("appointments").select("id").eq("service_id", id).limit(1);
    const hasBookings = linked && linked.length > 0;
    const msg = hasBookings
      ? "This service has existing bookings. Deleting it will not remove those bookings, but they will show no service. Continue?"
      : "Delete this service? This cannot be undone.";
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) { setServiceError("Delete failed: " + error.message); return; }
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    if (!salon) return;
    await supabase.from("salons").update({ reminders_enabled: value }).eq("id", salon.id);
  };

  const handleSaveReminders = async () => {
    if (!salon) return;
    setReminderSaving(true);
    await supabase.from("salons").update({
      reminders_enabled: remindersEnabled, review_link: reviewLink || null,
    }).eq("id", salon.id);
    setReminderSaved(true); setReminderSaving(false);
    setTimeout(() => setReminderSaved(false), 2000);
  };

  const handleToggleWhatsApp = async (value: boolean) => {
    setWhatsappEnabled(value);
    if (!salon) return;
    setWaSaving(true);
    await supabase.from("salons").update({ whatsapp_enabled: value }).eq("id", salon.id);
    setWaSaved(true); setWaSaving(false);
    setTimeout(() => setWaSaved(false), 1500);
  };

  const handleSavePaymentMethods = async () => {
    if (!salon) return;
    // Validate deposit percent
    const pct = Math.min(100, Math.max(1, pm.deposit_percent || 50));
    const sanitised = { ...pm, deposit_percent: pct };
    setPm(sanitised);
    setPmSaving(true);
    await supabase.from("salons").update({ payment_methods: sanitised }).eq("id", salon.id);
    setPmSaved(true); setPmSaving(false);
    setTimeout(() => setPmSaved(false), 2000);
  };

  const updatePm = (key: keyof PaymentMethods, value: boolean | number) =>
    setPm(prev => ({ ...prev, [key]: value }));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#4F6EF7" }}>feature</div>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff", borderRadius: "16px",
    border: "0.5px solid #E8EAF0", padding: "24px", marginBottom: "20px",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "12px", color: "#64748B", display: "block", marginBottom: "6px", fontWeight: 500,
  };
  const inputStyle: React.CSSProperties = {
    padding: "10px 14px", fontSize: "14px", border: "0.5px solid #E8EAF0",
    borderRadius: "8px", width: "100%", maxWidth: "360px",
    boxSizing: "border-box", outline: "none", color: "#0F172A",
  };
  const saveBtn = (isSaved: boolean, isSaving: boolean, label: string) => ({
    style: {
      padding: "10px 20px",
      background: isSaved ? "#059669" : "#4F6EF7",
      color: "#fff", border: "none", borderRadius: "8px",
      fontSize: "13px", cursor: "pointer", fontWeight: 600,
      transition: "background 0.2s",
    } as React.CSSProperties,
    children: isSaved ? "Saved ✓" : isSaving ? "Saving…" : label,
  });

  return (
    <div style={{ backgroundColor: "#F2F4F7", minHeight: "100vh", padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>Manage your salon</p>
        <h1 style={{ margin: 0, fontSize: "28px", color: "#0F172A", fontWeight: 700 }}>Settings</h1>
      </div>

      {/* ── Booking Link ── */}
      <div style={{ ...cardStyle, background: "linear-gradient(135deg,#0F0B2D 0%,#3730A3 60%,#6366F1 100%)", border: "none", marginBottom: 20 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>🔗 Your Booking Page</div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{salon?.name}</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginBottom: 18, wordBreak: "break-all" }}>{origin}/book/{salon?.slug}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleCopyLink}
            style={{ padding: "10px 20px", background: copied ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.12)", color: "#fff", border: `1.5px solid ${copied ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.25)"}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(8px)" }}
          >
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>
          <button
            onClick={() => window.open(`/book/${salon?.slug}`, "_blank")}
            style={{ padding: "10px 20px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
          >
            Preview ↗
          </button>
        </div>
      </div>

      {/* ── Salon Brand ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>🎨 Salon Brand</div>
        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
          Your logo and name appear on the public booking page.
        </p>

        {/* Logo upload area */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Salon Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>

            {/* Logo preview circle */}
            <div
              onClick={() => logoInputRef.current?.click()}
              style={{ width: 96, height: 96, borderRadius: 22, overflow: "hidden", border: "2.5px dashed #CBD5E1", flexShrink: 0, background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", transition: "border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#4F6EF7"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#4F6EF7"; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); }}
            >
              {logoUploading ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 4px" }} />
                  <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>Uploading...</span>
                </div>
              ) : logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { (e.target as HTMLImageElement).src = ""; }} />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>📸</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 4, fontWeight: 600 }}>Upload</div>
                </div>
              )}
              {logoUrl && !logoUploading && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "0"; }}>
                  <span style={{ color: "#fff", fontSize: 22 }}>✏️</span>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{salonName || "Your Salon"}</div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                style={{ padding: "9px 18px", background: "#EEF2FF", border: "1.5px solid #C7D2FE", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#4F46E5", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
              >
                {logoUploading ? "⏳ Uploading..." : "📤 Upload Logo"}
              </button>
              {logoUrl && (
                <button type="button" onClick={() => { setLogoUrl(""); setLogoUrlInput(""); }} style={{ fontSize: 12, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕ Remove logo</button>
              )}
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "8px 0 0", lineHeight: 1.5 }}>PNG, JPG, WEBP · Max 5MB<br />Click or drag & drop on the circle</p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }}
          />

          {/* Error message */}
          {logoError && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, fontSize: 12.5, color: "#DC2626", lineHeight: 1.6 }}>
              ⚠️ {logoError}
            </div>
          )}

          {/* Fallback: paste logo URL directly */}
          <div style={{ marginTop: 14 }}>
            <label style={{ ...labelStyle, marginBottom: 4 }}>
              Or paste logo URL directly <span style={{ color: "#94A3B8", fontWeight: 400 }}>(if upload doesn't work)</span>
            </label>
            <input
              id="logo-url-input"
              type="url"
              placeholder="https://example.com/your-logo.png"
              value={logoUrlInput}
              onChange={e => {
                setLogoUrlInput(e.target.value);
                if (e.target.value.trim()) setLogoUrl(e.target.value.trim());
              }}
              style={{ ...inputStyle, maxWidth: "420px" }}
            />
          </div>
        </div>


        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="salon-name" style={labelStyle}>Salon Name</label>
          <input id="salon-name" value={salonName} onChange={e => setSalonName(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="salon-desc" style={labelStyle}>Description <span style={{ color: "#94A3B8", fontWeight: 400 }}>(shows under salon name on booking page)</span></label>
          <input
            id="salon-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Premium hair salon in Manchester city centre"
            style={{ ...inputStyle, maxWidth: "420px" }}
          />
        </div>

        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        <button onClick={handleSaveBrand} disabled={saving || logoUploading} {...saveBtn(saved, saving, "Save Brand")} />
      </div>

      {/* ── Payment Methods ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>
          💳 Payment Methods
        </div>
        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
          Choose which payment options clients can use when booking. Changes apply instantly on your booking page.
        </p>

        {/* Method toggles */}
        <PaymentMethodRow
          id="pm-full"
          icon="💷"
          title="Full Payment Online"
          description="Client pays 100% now via Stripe. Nothing due at salon."
          checked={pm.full_online}
          onChange={v => updatePm("full_online", v)}
        />

        <PaymentMethodRow
          id="pm-deposit"
          icon="💰"
          title="50% Deposit Online"
          description="Client pays half now, remaining 50% due at salon."
          checked={pm.deposit_online}
          onChange={v => updatePm("deposit_online", v)}
        />

        <PaymentMethodRow
          id="pm-custom"
          icon="✏️"
          title="Custom % Deposit Online"
          description="Set your own deposit percentage."
          checked={pm.custom_deposit}
          onChange={v => updatePm("custom_deposit", v)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label htmlFor="deposit-pct" style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
              Deposit Percentage
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                id="deposit-pct"
                type="number"
                min={1} max={99} step={1}
                value={pm.deposit_percent}
                onChange={e => updatePm("deposit_percent", Math.min(99, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{
                  width: 72, padding: "8px 10px", fontSize: 14, fontWeight: 700,
                  border: "1.5px solid #4F6EF7", borderRadius: 8, color: "#0F172A",
                  textAlign: "center", outline: "none",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#4F6EF7" }}>%</span>
            </div>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              Client pays {pm.deposit_percent}% now, {100 - pm.deposit_percent}% at salon
            </span>
          </div>
        </PaymentMethodRow>

        <PaymentMethodRow
          id="pm-salon"
          icon="🏪"
          title="Pay at Salon"
          description="No online payment required. Client pays in full at appointment."
          checked={pm.pay_at_salon}
          onChange={v => updatePm("pay_at_salon", v)}
        />

        {/* Warning if only pay_at_salon */}
        {pm.pay_at_salon && !pm.full_online && !pm.deposit_online && !pm.custom_deposit && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            background: "#FFFBF0", border: "0.5px solid #FDE68A",
            borderRadius: 8, padding: "12px 14px", marginBottom: 16,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div style={{ fontSize: "12px", color: "#92400E", lineHeight: 1.6 }}>
              <strong>Pay at Salon only</strong> — Stripe payment will be skipped entirely.
              Clients will confirm their booking without any upfront payment.
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: "0.5px solid #E8EAF0", margin: "20px 0" }} />

        {/* Live Preview */}
        <div style={{ marginBottom: 20 }}>
          <BookingPreview pm={pm} price={services[0]?.price || 65} />
        </div>

        <button
          id="save-payment-methods-btn"
          onClick={handleSavePaymentMethods}
          disabled={pmSaving}
          {...saveBtn(pmSaved, pmSaving, "Save Payment Settings")}
        />
      </div>

      {/* ── Automated Reminders ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>Automated Reminders</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "12px", color: remindersEnabled ? "#059669" : "#94A3B8", fontWeight: 600 }}>
              {remindersEnabled ? "On" : "Off"}
            </span>
            <Toggle id="reminders-toggle" checked={remindersEnabled} onChange={handleToggleReminders} />
          </div>
        </div>
        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
          Automatically send SMS &amp; email reminders to clients via Twilio + Resend.
          All messages include a GDPR opt-out link. Timezone: <strong>Europe/London</strong> (GMT/BST auto).
        </p>
        <div style={{ background: "#F8FAFF", border: "0.5px solid #E0E7FF", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#4F6EF7", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px" }}>
            Message Schedule
          </div>
          {[
            { icon: "📅", time: "24 hours before", msg: "\"Your appointment is tomorrow at [time]\"", channel: "SMS + Email" },
            { icon: "⏰", time: "2 hours before",  msg: "\"Your appointment is in 2 hours\"",          channel: "SMS + Email" },
            { icon: "💕", time: "1 hour after",   msg: "\"Thank you for visiting! [review link]\"",  channel: "SMS + Email" },
            { icon: "🔄", time: "6 weeks after",  msg: "\"Ready for your next appointment?\"",        channel: "SMS + Email" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "0.5px solid #EEF0F8" : "none" }}>
              <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{row.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{row.time}</div>
                <div style={{ fontSize: "12px", color: "#64748B", margin: "2px 0" }}>{row.msg}</div>
                <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, color: "#4F6EF7", background: "#EEF2FF", padding: "2px 8px", borderRadius: 6, marginTop: 4 }}>{row.channel}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="review-link" style={labelStyle}>
            Google Reviews Link <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="review-link" type="url"
            placeholder="https://g.page/r/your-salon/review"
            value={reviewLink} onChange={e => setReviewLink(e.target.value)}
            style={{ ...inputStyle, maxWidth: "400px" }}
          />
          <p style={{ fontSize: "11.5px", color: "#94A3B8", margin: "6px 0 0" }}>
            Sent in the 1h post-visit thank-you SMS &amp; email.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#F0FDF4", border: "0.5px solid #BBF7D0", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px" }}>
          <span style={{ fontSize: 16 }}>🛡️</span>
          <div style={{ fontSize: "12px", color: "#15803D", lineHeight: 1.6 }}>
            <strong>GDPR Compliant</strong> — Every SMS includes "Reply STOP to opt out" and every email includes an unsubscribe link.
          </div>
        </div>
        <button id="save-reminders-btn" onClick={handleSaveReminders} disabled={reminderSaving} {...saveBtn(reminderSaved, reminderSaving, "Save Reminder Settings")} />
      </div>

      {/* ── WhatsApp Reminders ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>💚</span>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>WhatsApp Reminders</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "12px", color: whatsappEnabled ? "#059669" : "#94A3B8", fontWeight: 600 }}>
              {waSaved ? "Saved ✓" : whatsappEnabled ? "On" : "Off"}
            </span>
            <Toggle id="whatsapp-toggle" checked={whatsappEnabled} onChange={handleToggleWhatsApp} />
          </div>
        </div>
        <p style={{ fontSize: "13px", color: "#64748B", margin: "6px 0 20px" }}>
          Send automated WhatsApp messages via Twilio. Clients must have WhatsApp and their number must be active.
          Messages are sent in <strong>English</strong> with GDPR opt-out included.
        </p>

        {/* Setup guide: Sandbox + Production */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>

          {/* Sandbox panel */}
          <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#92400E", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>🧪 Testing (Sandbox)</div>
            <div style={{ fontSize: "12px", color: "#78350F", lineHeight: 1.8 }}>
              <div>1. Go to <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" style={{ color: "#4F6EF7" }}>Twilio Console</a></div>
              <div>2. Messaging → Try it Out → WhatsApp</div>
              <div>3. Your client texts <code style={{ background: "#FEF3C7", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>join &lt;code&gt;</code> to <strong>+1 415 523 8886</strong></div>
              <div style={{ marginTop: 6, color: "#B45309", fontStyle: "italic" }}>⚠️ Only pre-joined numbers receive messages</div>
            </div>
          </div>

          {/* Production panel */}
          <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#14532D", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>🚀 Production (All Clients)</div>
            <div style={{ fontSize: "12px", color: "#15803D", lineHeight: 1.8 }}>
              <div>1. <a href="https://www.twilio.com/en-us/whatsapp/request-access" target="_blank" rel="noopener noreferrer" style={{ color: "#4F6EF7" }}>Apply for WhatsApp Business</a></div>
              <div>2. Verify your Meta Business Account</div>
              <div>3. Set your Twilio WhatsApp sender</div>
              <div>4. Update <code style={{ background: "#DCFCE7", padding: "1px 5px", borderRadius: 4 }}>TWILIO_WHATSAPP_FROM</code> in Vercel env</div>
              <div style={{ marginTop: 6, color: "#059669", fontWeight: 600 }}>✅ Then ALL clients get messages</div>
            </div>
          </div>
        </div>

        {/* Message schedule */}
        <div style={{ background: "#F0FDF4", border: "0.5px solid #BBF7D0", borderRadius: 10, padding: "16px", marginBottom: 18 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#15803D", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 12 }}>
            WhatsApp Message Schedule
          </div>
          {[
            { icon: "✅", time: "Instantly",       msg: "Booking confirmation with date, time, service & cancel link" },
            { icon: "📅", time: "24 hours before", msg: "\"Your appointment is tomorrow at [time]\"" },
            { icon: "⏰", time: "2 hours before",  msg: "\"Your appointment is in 2 hours at [time]\"" },
            { icon: "🔄", time: "6 weeks after",   msg: "\"Time for your next appointment! Book now: [link]\"" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "0.5px solid #D1FAE5" : "none" }}>
              <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{row.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{row.time}</div>
                <div style={{ fontSize: "12px", color: "#64748B", margin: "2px 0" }}>{row.msg}</div>
                <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, color: "#059669", background: "#D1FAE5", padding: "2px 8px", borderRadius: 6, marginTop: 4 }}>WhatsApp</span>
              </div>
            </div>
          ))}
        </div>

        {/* Country support */}
        <div style={{ background: "#F8FAFF", border: "0.5px solid #E0E7FF", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#4F6EF7", marginBottom: 6 }}>🌍 Supported Countries (Auto-detected)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { flag: "🇬🇧", label: "UK", fmt: "+44" },
              { flag: "🇵🇰", label: "Pakistan", fmt: "+92" },
              { flag: "🇦🇪", label: "UAE", fmt: "+971" },
              { flag: "🇸🇦", label: "Saudi Arabia", fmt: "+966" },
            ].map(c => (
              <span key={c.label} style={{ fontSize: "12px", background: "#EEF2FF", color: "#4338CA", padding: "4px 10px", borderRadius: 20, fontWeight: 500 }}>
                {c.flag} {c.label} <span style={{ color: "#6366F1", fontWeight: 400 }}>({c.fmt})</span>
              </span>
            ))}
          </div>
          <div style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: 8 }}>
            Country code is auto-detected from the phone number entered at booking.
          </div>
        </div>

        {/* GDPR */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#F0FDF4", border: "0.5px solid #BBF7D0", borderRadius: "8px", padding: "12px 14px" }}>
          <span style={{ fontSize: 16 }}>🛡️</span>
          <div style={{ fontSize: "12px", color: "#15803D", lineHeight: 1.6 }}>
            <strong>GDPR Compliant</strong> — Every WhatsApp message includes a STOP opt-out link.
            Configure the webhook in Twilio Console → Messaging → Senders → WhatsApp sandbox →
            <code style={{ background: "#D1FAE5", padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>https://feature-saas.vercel.app/api/whatsapp-optout</code>
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>Services</div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "16px" }}>{services.length} service{services.length !== 1 ? "s" : ""}</div>

        {serviceError && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#DC2626", fontWeight: 500 }}>
            ⚠️ {serviceError}
          </div>
        )}

        {services.map(s => (
          <div key={s.id}>
            {editingService?.id === s.id ? (
              /* Inline edit form */
              <form onSubmit={handleUpdateService} style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 0", borderBottom: "0.5px solid #E0E7FF", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
                  <input value={editServiceForm.name} onChange={e => setEditServiceForm({ ...editServiceForm, name: e.target.value })} required placeholder="Service name" style={{ padding: "7px 10px", fontSize: "13px", border: "1.5px solid #4F6EF7", borderRadius: "8px", flex: "1 1 140px", color: "#0F172A", outline: "none" }} />
                  <input type="number" value={editServiceForm.price} onChange={e => setEditServiceForm({ ...editServiceForm, price: e.target.value })} required placeholder="Price" min="0.01" step="0.01" style={{ padding: "7px 10px", fontSize: "13px", border: "1.5px solid #4F6EF7", borderRadius: "8px", width: 90, color: "#0F172A", outline: "none" }} />
                  <input type="number" value={editServiceForm.duration_minutes} onChange={e => setEditServiceForm({ ...editServiceForm, duration_minutes: e.target.value })} placeholder="Mins" min="1" style={{ padding: "7px 10px", fontSize: "13px", border: "1.5px solid #4F6EF7", borderRadius: "8px", width: 80, color: "#0F172A", outline: "none" }} />
                  <input value={editServiceForm.description} onChange={e => setEditServiceForm({ ...editServiceForm, description: e.target.value })} placeholder="Description (optional)" style={{ padding: "7px 10px", fontSize: "13px", border: "1.5px solid #4F6EF7", borderRadius: "8px", flex: "1 1 200px", color: "#0F172A", outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: 6, alignSelf: "center" }}>
                  <button type="submit" style={{ padding: "7px 14px", background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>✓ Save</button>
                  <button type="button" onClick={() => { setEditingService(null); setServiceError(""); }} style={{ padding: "7px 12px", background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            ) : (
              /* Normal row */
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "0.5px solid #F1F5F9" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#0F172A", fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                    {(s.duration_minutes > 0 || s.duration > 0) ? `${s.duration_minutes || s.duration} min · ` : ""}£{s.price}
                  </div>
                  {s.description && (
                    <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: 2, fontStyle: "italic" }}>{s.description}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditingService(s); setEditServiceForm({ name: s.name, price: String(s.price), duration_minutes: String(s.duration_minutes || s.duration || ""), description: s.description || "" }); setServiceError(""); }} style={{ color: "#4F6EF7", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>✏️ Edit</button>
                  <button onClick={() => handleDeleteService(s.id)} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add service form */}
        <form onSubmit={handleAddService} style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px dashed #E0E7FF" }}>
          <input placeholder="Service name *" value={newService.name} onChange={e => { setNewService({ ...newService, name: e.target.value }); setServiceError(""); }} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", flex: "1 1 140px", color: "#0F172A" }} />
          <input placeholder="Price £ *" type="number" min="0.01" step="0.01" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "100px", color: "#0F172A" }} />
          <input placeholder="Duration (min)" type="number" min="1" value={newService.duration_minutes} onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })} style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "120px", color: "#0F172A" }} />
          <input placeholder="Description (optional)" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", flex: "1 1 180px", color: "#0F172A" }} />
          <button type="submit" style={{ padding: "8px 18px", background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>+ Add Service</button>
        </form>
      </div>

      {/* ── Account ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "12px" }}>Account</div>
        <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>{salon?.name}</div>
        <button onClick={handleLogout} style={{ padding: "10px 20px", background: "#FEF2F2", color: "#EF4444", border: "0.5px solid #FECACA", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}>Sign out</button>
      </div>
    </div>
  );
}