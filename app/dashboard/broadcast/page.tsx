"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentUserProfile } from "@/app/lib/auth";
import DashboardShell, { HamburgerBtn } from "../components/DashboardShell";
import { useToast } from "../components/Toast";
import FeatureGate from "../components/FeatureGate";

interface BroadcastMsg {
  id: string;
  title: string;
  message: string;
  channel: "whatsapp" | "sms" | "email";
  recipient_count: number;
  status: string;
  created_at: string;
}

const TEMPLATES = [
  { label: "🎉 Special Offer", message: "Hi {name}! 🌟 We have a special offer just for you at {salon}. Book this week and get 20% off any service. Book now: {link}" },
  { label: "🎂 Birthday Wish", message: "Happy Birthday {name}! 🎂 As our valued client, enjoy a FREE birthday treatment this month at {salon}. Call us to book!" },
  { label: "📅 Appointment Reminder", message: "Hi {name}, just a reminder that {salon} is open and ready to serve you. Book your next appointment: {link}" },
  { label: "⭐ Review Request", message: "Hi {name}! Thank you for visiting {salon}. We'd love to hear your feedback. Please leave us a review: {link}" },
  { label: "🎁 Loyalty Reward", message: "Hi {name}! 🎁 You've earned enough loyalty points for a free reward at {salon}. Come in and claim it today!" },
];

function BroadcastContent() {
  const router = useRouter();
  const toast = useToast();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonName, setSalonName] = useState("");
  const [salonSlug, setSalonSlug] = useState("");
  const [history, setHistory] = useState<BroadcastMsg[]>([]);
  const [clients, setClients] = useState<{ name: string; phone: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "", channel: "whatsapp" as "whatsapp"|"sms"|"email", filter: "all" as "all"|"vip"|"new"|"inactive" });
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile?.salon) { router.push("/login"); return; }
      setSalonId(profile.salon.id);
      setSalonName(profile.salon.name);
      setSalonSlug(profile.salon.slug || "");

      const [{ data: hist }, { data: appts }] = await Promise.all([
        supabase.from("broadcast_messages").select("*").eq("salon_id", profile.salon.id).order("created_at", { ascending: false }),
        supabase.from("appointments").select("client_name, client_email, client_phone, date_time, status").eq("salon_id", profile.salon.id),
      ]);
      setHistory(hist || []);

      // Build unique clients
      const map: Record<string, { name: string; phone: string; email: string; count: number; last: string }> = {};
      (appts || []).forEach((a: any) => {
        const key = a.client_email || a.client_name;
        if (!map[key]) map[key] = { name: a.client_name, phone: a.client_phone || "", email: a.client_email || "", count: 0, last: a.date_time };
        map[key].count++;
        if (a.date_time > map[key].last) map[key].last = a.date_time;
      });
      setClients(Object.values(map));
      setLoading(false);
    };
    load();
  }, [router]);

  const filteredClients = clients.filter(c => {
    if (form.filter === "all") return true;
    return true; // could add vip/new/inactive filters
  });

  const recipientCount = filteredClients.length;

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    const msg = t.message
      .replace(/{salon}/g, salonName)
      .replace(/{link}/g, `${typeof window !== "undefined" ? window.location.origin : ""}/book/${salonSlug}`);
    setForm(f => ({ ...f, message: msg, title: t.label.replace(/[^\w\s]/g, "").trim() }));
  };

  const handleSend = async () => {
    if (!salonId || !form.message || !form.title) { toast.error("Title and message required"); return; }
    if (!confirm(`Send to ${recipientCount} clients via ${form.channel.toUpperCase()}?`)) return;
    setSending(true);
    const { data, error } = await supabase.from("broadcast_messages").insert({
      salon_id: salonId, title: form.title, message: form.message,
      channel: form.channel, recipient_count: recipientCount, status: "sent",
    }).select().single();
    if (error) { toast.error("Failed to log broadcast"); setSending(false); return; }
    setHistory(p => [data, ...p]);
    toast.success(`Broadcast logged for ${recipientCount} clients!`);
    setForm({ title: "", message: "", channel: "whatsapp", filter: "all" });
    setSending(false);
  };

  const channelIcon = { whatsapp: "📱", sms: "💬", email: "📧" };
  const channelColor = { whatsapp: "#25D366", sms: "#6366F1", email: "#F59E0B" };

  const Topbar = (
    <header style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <HamburgerBtn onClick={() => {}} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>📢 Broadcast Messages</div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 1 }}>Send bulk messages to all clients</div>
        </div>
      </div>
    </header>
  );

  if (loading) return <DashboardShell salonName={salonName} topbar={Topbar}><div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Loading…</div></DashboardShell>;

  return (
    <DashboardShell salonName={salonName} topbar={Topbar}>
      <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>

        {/* Compose */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, padding: "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>✍️ Compose Message</div>

            {/* Channel selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Channel</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["whatsapp", "sms", "email"] as const).map(ch => (
                  <button key={ch} onClick={() => setForm(f => ({ ...f, channel: ch }))}
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 12, border: `2px solid ${form.channel === ch ? channelColor[ch] : "#E2E8F0"}`, background: form.channel === ch ? `${channelColor[ch]}12` : "#fff", cursor: "pointer", transition: "all 0.12s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 22 }}>{channelIcon[ch]}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: form.channel === ch ? channelColor[ch] : "#64748B", textTransform: "capitalize" }}>{ch}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "#F8FAFC", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>Recipients</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8" }}>All {recipientCount} clients</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#6366F1" }}>{recipientCount}</div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Campaign Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Discount Campaign"
                style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Message *</label>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{form.message.length} chars</span>
              </div>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Type your message… Use {name} for client name, {salon} for salon name" rows={5}
                style={{ width: "100%", padding: "10px 13px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 13.5, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Variables: {"{"}<b>name</b>{"}"}, {"{"}<b>salon</b>{"}"}, {"{"}<b>link</b>{"}"}</div>
            </div>

            {/* Preview */}
            {form.message && (
              <div style={{ marginBottom: 16, padding: "14px 16px", background: "#F8FAFC", borderRadius: 12, border: "1.5px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Preview (for "Sarah")</div>
                <div style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.7 }}>
                  {form.message.replace(/{name}/g, "Sarah").replace(/{salon}/g, salonName).replace(/{link}/g, "featuresalon.com/book")}
                </div>
              </div>
            )}

            <button onClick={handleSend} disabled={sending || !form.message || !form.title}
              style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg,${channelColor[form.channel]},${channelColor[form.channel]}cc)`, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, color: "#fff", cursor: "pointer", opacity: !form.message || !form.title ? 0.5 : 1, boxShadow: `0 4px 14px ${channelColor[form.channel]}40`, transition: "all 0.15s" }}>
              {sending ? "Sending…" : `${channelIcon[form.channel]} Send to ${recipientCount} clients`}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Templates */}
          <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, padding: "20px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>⚡ Quick Templates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => applyTemplate(t)}
                  style={{ padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer", transition: "all 0.12s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#EEF2FF"; e.currentTarget.style.borderColor = "#C7D2FE"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          <div style={{ background: "#fff", border: "1.5px solid #F1F5F9", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", fontSize: 14, fontWeight: 800, color: "#0F172A" }}>📋 Sent History</div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>No broadcasts sent yet</div>
              ) : history.map(h => (
                <div key={h.id} style={{ padding: "14px 18px", borderBottom: "1px solid #F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{h.title}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${channelColor[h.channel as keyof typeof channelColor]}18`, color: channelColor[h.channel as keyof typeof channelColor] }}>
                      {channelIcon[h.channel as keyof typeof channelIcon]} {h.channel}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 4 }}>{h.recipient_count} recipients</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(h.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function BroadcastPage() {
  return (
    <FeatureGate feature="analytics_basic">
      <BroadcastContent />
    </FeatureGate>
  );
}
