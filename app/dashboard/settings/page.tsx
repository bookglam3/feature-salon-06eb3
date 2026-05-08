"use client";
import { useEffect, useState } from "react";
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
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" });

  // Reminder settings
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reviewLink, setReviewLink] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

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
      setRemindersEnabled(salonData?.reminders_enabled ?? true);
      setReviewLink(salonData?.review_link || "");

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
    await supabase.from("salons").update({ name: salonName }).eq("id", salon.id);
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    await supabase.from("services").insert({
      salon_id: salon.id, name: newService.name,
      price: parseFloat(newService.price), duration: parseInt(newService.duration),
    });
    setNewService({ name: "", price: "", duration: "" });
    const { data } = await supabase.from("services").select("*").eq("salon_id", salon.id);
    setServices(data || []);
  };

  const handleDeleteService = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
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

      {/* ── Salon Brand ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>Salon Brand</div>
        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "16px" }}>
          This will appear on your booking page and in all client communications.
        </p>
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="salon-name" style={labelStyle}>Salon Name</label>
          <input id="salon-name" value={salonName} onChange={e => setSalonName(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={handleSaveBrand} disabled={saving} {...saveBtn(saved, saving, "Save Brand")} />
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

      {/* ── Services ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>Services</div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "16px" }}>{services.length} service{services.length !== 1 ? "s" : ""}</div>
        {services.map(s => (
          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "0.5px solid #F1F5F9" }}>
            <div>
              <div style={{ fontSize: "13px", color: "#0F172A" }}>{s.name}</div>
              <div style={{ fontSize: "12px", color: "#94A3B8" }}>{s.duration} min · £{s.price}</div>
            </div>
            <button onClick={() => handleDeleteService(s.id)} style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>Delete</button>
          </div>
        ))}
        <form onSubmit={handleAddService} style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
          <input placeholder="Service name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", flex: "1 1 140px", color: "#0F172A" }} />
          <input placeholder="Price (£)" type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "100px", color: "#0F172A" }} />
          <input placeholder="Duration (min)" type="number" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} required style={{ padding: "8px 12px", fontSize: "13px", border: "0.5px solid #E8EAF0", borderRadius: "8px", width: "120px", color: "#0F172A" }} />
          <button type="submit" style={{ padding: "8px 16px", background: "#4F6EF7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Add</button>
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