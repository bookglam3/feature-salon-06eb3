"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

interface Appointment {
  id: string;
  client_name: string;
  client_email: string;
  date_time: string;
  status: string;
  services: { name: string; price: number } | null;
  salon: { name: string; slug: string } | null;
}

export default function ReschedulePage({ params }: { params: { id: string } }) {
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [status, setStatus] = useState<"idle" | "rescheduled" | "cancelled" | "error">("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("appointments").select("*, services(name,price), salon:salons(name,slug)").eq("id", params.id).single();
      setAppt(data);
      if (data?.date_time) {
        const d = new Date(data.date_time);
        setNewDate(d.toISOString().slice(0, 10));
        setNewTime(d.toTimeString().slice(0, 5));
      }
      setLoading(false);
    };
    load();
  }, [params.id]);

  const handleReschedule = async () => {
    if (!newDate || !newTime) return;
    const newDateTime = new Date(`${newDate}T${newTime}`).toISOString();
    const { error } = await supabase.from("appointments").update({ date_time: newDateTime, status: "pending", notes: `Rescheduled by client. ${note}` }).eq("id", params.id);
    if (error) { setStatus("error"); return; }
    setStatus("rescheduled");
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    const { error } = await supabase.from("appointments").update({ status: "cancelled", notes: `Cancelled by client. ${note}` }).eq("id", params.id);
    if (error) { setStatus("error"); return; }
    setStatus("cancelled");
  };

  const salonName = (appt?.salon as any)?.name || "the salon";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", color: "#94A3B8" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Loading your appointment…</div>
      </div>
    </div>
  );

  if (!appt) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", color: "#94A3B8", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Appointment Not Found</div>
        <div style={{ fontSize: 14, color: "#64748B" }}>This link may be invalid or expired.</div>
      </div>
    </div>
  );

  if (status === "rescheduled") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#F0FDF4,#ECFDF5)", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 24, boxShadow: "0 16px 60px rgba(0,0,0,0.1)", maxWidth: 420, width: "100%" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginBottom: 8 }}>Rescheduled!</div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>Your appointment has been rescheduled. The salon will confirm your new time shortly.</div>
        <div style={{ marginTop: 20, padding: "14px 20px", background: "#F0FDF4", borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#059669" }}>
          📅 {new Date(`${newDate}T${newTime}`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at {newTime}
        </div>
      </div>
    </div>
  );

  if (status === "cancelled") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#FEF2F2,#FFF1F2)", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 24, boxShadow: "0 16px 60px rgba(0,0,0,0.1)", maxWidth: 420, width: "100%" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😢</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", marginBottom: 8 }}>Appointment Cancelled</div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>Your appointment has been cancelled. We hope to see you again soon!</div>
        <a href={`/book/${(appt?.salon as any)?.slug || ""}`} style={{ display: "block", marginTop: 20, padding: "12px", background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Book Again →</a>
      </div>
    </div>
  );

  const apptDate = new Date(appt.date_time);
  const isPast = apptDate < new Date();
  const isCancelled = appt.status === "cancelled";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F8FAFC,#EEF2FF)", fontFamily: "system-ui,sans-serif", padding: "40px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>Manage Your Appointment</div>
          <div style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>{salonName}</div>
        </div>

        {/* Current appointment */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 }}>Your Appointment</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13.5, color: "#64748B" }}>Client</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{appt.client_name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13.5, color: "#64748B" }}>Service</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{(appt.services as any)?.name || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13.5, color: "#64748B" }}>Current Date</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{apptDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13.5, color: "#64748B" }}>Time</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{apptDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13.5, color: "#64748B" }}>Status</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: isCancelled ? "#FEF2F2" : "#ECFDF5", color: isCancelled ? "#DC2626" : "#059669" }}>
                {appt.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {!isPast && !isCancelled ? (
          <>
            {/* Reschedule form */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>🔄 Reschedule</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>New Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().slice(0, 10)}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>New Time</label>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Note (optional)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any reason or special request…" rows={2}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <button onClick={handleReschedule} disabled={!newDate || !newTime}
                style={{ marginTop: 16, width: "100%", padding: 14, background: "linear-gradient(135deg,#6366F1,#4F46E5)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
                Confirm Reschedule →
              </button>
            </div>

            {/* Cancel */}
            <div style={{ textAlign: "center" }}>
              <button onClick={handleCancel}
                style={{ padding: "10px 24px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 12, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                ✕ Cancel Appointment
              </button>
            </div>
          </>
        ) : (
          <div style={{ background: "#F1F5F9", borderRadius: 16, padding: "20px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
            {isPast ? "⏰ This appointment has already passed and cannot be changed." : "This appointment has been cancelled."}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#94A3B8" }}>
          Powered by <strong>Feature Salon</strong>
        </div>
      </div>
    </div>
  );
}
