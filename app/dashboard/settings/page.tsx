"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// ─── Toggle switch component ───────────────────────────────
function Toggle({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        width: 44,
        height: 24,
        borderRadius: 999,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "#4F6EF7" : "#CBD5E1",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });

  // Reminder settings
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reviewLink, setReviewLink] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: salonData } = await supabase
        .from("salons")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      setSalon(salonData);
      setSalonName(salonData?.name || "");
      setRemindersEnabled(salonData?.reminders_enabled ?? true);
      setReviewLink(salonData?.review_link || "");

      if (salonData) {
        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .eq("salon_id", salonData.id);
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
    await supabase.from("services").insert({
      salon_id: salon.id,
      name: newService.name,
      price: parseFloat(newService.price),
      duration: parseInt(newService.duration),
    });
    setNewService({ name: "", price: "", duration: "" });
    const { data } = await supabase.from("services").select("*").eq("salon_id", salon.id);
    setServices(data || []);
  };

  const handleDeleteService = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // ── Toggle reminder on/off (saves instantly) ──
  const handleToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    if (!salon) return;
    await supabase.from("salons").update({ reminders_enabled: value }).eq("id", salon.id);
  };

  // ── Save reminder settings ──
  const handleSaveReminders = async () => {
    if (!salon) return;
    setReminderSaving(true);
    await supabase.from("salons").update({
      reminders_enabled: remindersEnabled,
      review_link: reviewLink || null,
    }).eq("id", salon.id);
    setReminderSaved(true);
    setReminderSaving(false);
    setTimeout(() => setReminderSaved(false), 2000);
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

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "0.5px solid #E8EAF0",
    padding: "24px",
    marginBottom: "20px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#64748B",
    display: "block",
    marginBottom: "6px",
    fontWeight: 500,
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: "14px",
    border: "0.5px solid #E8EAF0",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "360px",
    boxSizing: "border-box",
    outline: "none",
    color: "#0F172A",
  };

  const saveBtn = (saved: boolean, saving: boolean, label: string) => ({
    style: {
      padding: "10px 20px",
      background: saved ? "#059669" : "#4F6EF7",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "13px",
      cursor: "pointer",
      fontWeight: 600,
      transition: "background 0.2s",
    } as React.CSSProperties,
    children: saved ? "Saved ✓" : saving ? "Saving…" : label,
  });

  return (
    <div style={{ backgroundColor: "#F2F4F7", minHeight: "100vh", padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>Manage your salon</p>
        <h1 style={{ margin: 0, fontSize: "28px", color: "#0F172A", fontWeight: 700 }}>Settings</h1>
      </div>

      {/* ── Salon Brand ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>
          Salon Brand
        </div>
        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>
          This will appear on your booking page and in all client communications.
        </p>
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="salon-name" style={labelStyle}>Salon Name</label>
          <input
            id="salon-name"
            value={salonName}
            onChange={e => setSalonName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <button
          onClick={handleSaveBrand}
          disabled={saving}
          {...saveBtn(saved, saving, "Save Brand")}
        />
      </div>

      {/* ── Automated Reminders ── */}
      <div style={cardStyle}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
            Automated Reminders
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "12px", color: remindersEnabled ? "#059669" : "#94A3B8", fontWeight: 600 }}>
              {remindersEnabled ? "On" : "Off"}
            </span>
            <Toggle
              id="reminders-toggle"
              checked={remindersEnabled}
              onChange={handleToggleReminders}
            />
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>
          Automatically send SMS &amp; email reminders to clients via Twilio + Resend.
          All messages include a GDPR opt-out link. Timezone: <strong>Europe/London</strong> (GMT/BST auto).
        </p>

        {/* Schedule overview */}
        <div style={{
          background: "#F8FAFF",
          border: "0.5px solid #E0E7FF",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "20px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#4F6EF7", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px" }}>
            Message Schedule
          </div>
          {[
            { icon: "📅", time: "24 hours before", msg: "\"Your appointment is tomorrow at [time]\"", channel: "SMS + Email" },
            { icon: "⏰", time: "2 hours before",  msg: "\"Your appointment is in 2 hours\"",          channel: "SMS + Email" },
            { icon: "💕", time: "1 hour after",   msg: "\"Thank you for visiting! [review link]\"",  channel: "SMS + Email" },
            { icon: "🔄", time: "6 weeks after",  msg: "\"Ready for your next appointment?\"",        channel: "SMS + Email" },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < 3 ? "0.5px solid #EEF0F8" : "none",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{row.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{row.time}</div>
                <div style={{ fontSize: "12px", color: "#64748B", margin: "2px 0" }}>{row.msg}</div>
                <span style={{
                  display: "inline-block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#4F6EF7",
                  background: "#EEF2FF",
                  padding: "2px 8px",
                  borderRadius: 6,
                  marginTop: 4,
                }}>{row.channel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Review link field */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="review-link" style={labelStyle}>
            Google Reviews Link <span style={{ color: "#94A3B8", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="review-link"
            type="url"
            placeholder="https://g.page/r/your-salon/review"
            value={reviewLink}
            onChange={e => setReviewLink(e.target.value)}
            style={{ ...inputStyle, maxWidth: "400px" }}
          />
          <p style={{ fontSize: "11.5px", color: "#94A3B8", margin: "6px 0 0" }}>
            Sent in the 1h post-visit thank-you SMS &amp; email. Leave blank to omit the review prompt.
          </p>
        </div>

        {/* GDPR note */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "#F0FDF4",
          border: "0.5px solid #BBF7D0",
          borderRadius: "8px",
          padding: "12px 14px",
          marginBottom: "20px",
        }}>
          <span style={{ fontSize: 16 }}>🛡️</span>
          <div style={{ fontSize: "12px", color: "#15803D", lineHeight: 1.6 }}>
            <strong>GDPR Compliant</strong> — Every SMS includes "Reply STOP to opt out" and every email
            includes an unsubscribe link. Opt-outs are stored in your database and honoured automatically.
          </div>
        </div>

        <button
          id="save-reminders-btn"
          onClick={handleSaveReminders}
          disabled={reminderSaving}
          {...saveBtn(reminderSaved, reminderSaving, "Save Reminder Settings")}
        />
      </div>

      {/* ── Services ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>Services</div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "16px" }}>
          {services.length} service{services.length !== 1 ? "s" : ""}
        </div>

        {services.map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #F1F5F9" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#0F172A" }}>{s.name}</div>
              <div style={{ fontSize: "12px", color: "#94A3B8" }}>{s.duration} min · £{s.price}</div>
            </div>
            <button
              onClick={() => handleDeleteService(s.id)}
              style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
            >
              Delete
            </button>
          </div>
        ))}

        <form onSubmit={handleAddService} style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
          <input
            placeholder="Service name"
            value={newService.name}
            onChange={e => setNewService({ ...newService, name: e.target.value })}
            required
            style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", flex: "1 1 140px", color: "#0F172A" }}
          />
          <input
            placeholder="Price (£)"
            type="number"
            value={newService.price}
            onChange={e => setNewService({ ...newService, price: e.target.value })}
            required
            style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "100px", color: "#0F172A" }}
          />
          <input
            placeholder="Duration (min)"
            type="number"
            value={newService.duration}
            onChange={e => setNewService({ ...newService, duration: e.target.value })}
            required
            style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "120px", color: "#0F172A" }}
          />
          <button
            type="submit"
            style={{ padding: "8px 16px", background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
          >
            Add
          </button>
        </form>
      </div>

      {/* ── Account ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "12px" }}>Account</div>
        <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>{salon?.name}</div>
        <button
          onClick={handleLogout}
          style={{ padding: "10px 20px", background: "#FEF2F2", color: "#EF4444", border: "0.5px solid #FECACA", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}