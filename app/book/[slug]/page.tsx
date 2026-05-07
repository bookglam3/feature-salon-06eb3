"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Salon = {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  description?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes?: number;
  description?: string;
};

type Staff = {
  id: string;
  name: string;
  role?: string;
  avatar_url?: string;
};

type Offer = {
  id: string;
  title: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  valid_until?: string;
};

const STEPS = ["Service", "Staff", "Date & Time", "Your Details"];

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
];

const SERVICE_ICONS: Record<string, string> = {
  haircut: "✂️",
  cut: "✂️",
  hair: "💇",
  color: "🎨",
  colour: "🎨",
  highlights: "✨",
  blowout: "💨",
  styling: "💫",
  beard: "🧔",
  shave: "🪒",
  facial: "🧖",
  massage: "💆",
  nails: "💅",
  manicure: "💅",
  pedicure: "🦶",
  wax: "🌿",
  threading: "🧵",
  lash: "👁️",
  brow: "🪮",
  keratin: "✨",
  treatment: "🌿",
};

function getServiceIcon(name: string): string {
  const lower = name.toLowerCase();

  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon;
  }

  return "💈";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);

  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  return days;
}

const AVATAR_COLORS = [
  ["#EFF6FF", "#2563EB"],
  ["#ECFDF5", "#059669"],
  ["#FFF7ED", "#EA580C"],
  ["#F5F3FF", "#7C3AED"],
  ["#FDF2F8", "#DB2777"],
];

export default function BookingPage() {
  const { slug } = useParams() as { slug: string };

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(0);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [selectedStaff, setSelectedStaff] =
    useState<Staff | null>(null);

  const [staffConfirmed, setStaffConfirmed] = useState(false);

  const today = new Date();

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [selDate, setSelDate] = useState<Date | null>(null);
  const [selTime, setSelTime] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!slug) return;

    (async () => {
      const { data: s } = await supabase
        .from("salons")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSalon(s);

      const todayStr = new Date().toISOString().slice(0, 10);

      const [{ data: sv }, { data: st }, { data: of }] =
        await Promise.all([
          supabase
            .from("services")
            .select("*")
            .eq("salon_id", s.id)
            .order("price"),

          supabase
            .from("staff")
            .select("*")
            .eq("salon_id", s.id),

          supabase
            .from("offers")
            .select("*")
            .eq("salon_id", s.id)
            .eq("active", true)
            .or(`valid_until.is.null,valid_until.gte.${todayStr}`)
            .order("created_at", { ascending: false }),
        ]);

      setServices(sv || []);
      setStaffList(st || []);
      setOffers(of || []);
      setLoading(false);
    })();
  }, [slug]);

  const handleBook = async () => {
    if (
      !salon ||
      !selectedService ||
      !selDate ||
      !selTime ||
      !form.name
    )
      return;

    setSubmitting(true);

    const iso = new Date(
      `${selDate.getFullYear()}-${String(
        selDate.getMonth() + 1
      ).padStart(2, "0")}-${String(selDate.getDate()).padStart(
        2,
        "0"
      )}T${selTime}`
    ).toISOString();

    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("salon_id", salon.id)
      .eq("date_time", iso)
      .eq("staff_id", selectedStaff?.id || null)
      .maybeSingle();

    if (existing) {
      alert("This slot is already booked.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .insert({
        salon_id: salon.id,
        client_name: form.name,
        client_email: form.email,
        client_phone: form.phone,
        service_id: selectedService.id,
        staff_id: selectedStaff?.id || null,
        date_time: iso,
        status: "pending",
      });

    if (error) {
      alert("Booking failed. Please try again.");
      setSubmitting(false);
      return;
    }

    try {
      await fetch("/api/send-booking-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientEmail: form.email,
          clientName: form.name,
          clientPhone: form.phone,
          serviceName: selectedService.name,
          dateTime: iso,
          staffName: selectedStaff?.name,
          salonName: salon.name,
          salonOwnerEmail: salon.owner_email,
        }),
      });
    } catch (err) {
      console.log(err);
    }

    setSubmitting(false);
    setStep(4);
  };

  const calDays = getDaysInMonth(calYear, calMonth);

  const firstDow = new Date(
    calYear,
    calMonth,
    1
  ).getDay();

  const monthLabel = new Date(
    calYear,
    calMonth
  ).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const isPast = (d: Date) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const canNext0 = !!selectedService;
  const canNext1 = staffConfirmed;
  const canNext2 = !!selDate && !!selTime;
  const canSubmit = !!form.name.trim();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        Booking page not found.
      </div>
    );
  }

  if (step === 4) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
          padding: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
          }}
        >
          ✓
        </div>

        <h1>Booking Confirmed 🎉</h1>

        <p>
          Your appointment request has been submitted.
        </p>

        <div
          style={{
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 12,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <p>
            <strong>Service:</strong>{" "}
            {selectedService?.name}
          </p>

          <p>
            <strong>Staff:</strong>{" "}
            {selectedStaff?.name || "Any available"}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {selDate?.toLocaleDateString()}
          </p>

          <p>
            <strong>Time:</strong> {selTime}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        *{
          box-sizing:border-box;
        }

        body{
          margin:0;
          font-family:Inter,sans-serif;
          background:#f6f8ff;
        }

        input,
        button,
        textarea,
        select{
          -webkit-appearance:none;
          appearance:none;
        }

        .container{
          max-width:700px;
          margin:auto;
          padding:20px;
        }

        .hero{
          background:#2563EB;
          color:white;
          padding:40px 20px;
          text-align:center;
          border-bottom-left-radius:30px;
          border-bottom-right-radius:30px;
        }

        .logo{
          width:90px;
          height:90px;
          border-radius:20px;
          object-fit:cover;
          margin:auto;
          margin-bottom:15px;
        }

        .service-card,
        .staff-card{
          border:2px solid #E5E7EB;
          border-radius:16px;
          padding:16px;
          margin-bottom:12px;
          cursor:pointer;
          background:white;
          transition:0.2s;
        }

        .service-card.selected,
        .staff-card.selected{
          border-color:#2563EB;
          background:#EFF6FF;
        }

        .btn{
          width:100%;
          background:#2563EB;
          color:white;
          border:none;
          padding:14px;
          border-radius:12px;
          font-weight:700;
          cursor:pointer;
          margin-top:20px;
        }

        .btn:disabled{
          opacity:0.5;
          cursor:not-allowed;
        }

        .time-grid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:10px;
        }

        .time-btn{
          padding:10px;
          border-radius:10px;
          border:1px solid #ddd;
          background:white;
          cursor:pointer;
        }

        .time-btn.selected{
          background:#2563EB;
          color:white;
          border-color:#2563EB;
        }

        .input{
          width:100%;
          padding:12px;
          border-radius:10px;
          border:1px solid #ddd;
          margin-top:6px;
          margin-bottom:16px;
        }
      `}</style>

      <div className="hero">
        {salon?.logo_url ? (
          <img
            src={salon.logo_url}
            className="logo"
            alt={salon.name}
          />
        ) : (
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 20,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "auto",
              marginBottom: 15,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            {getInitials(salon?.name || "S")}
          </div>
        )}

        <h1>{salon?.name}</h1>

        {salon?.description && (
          <p>{salon.description}</p>
        )}
      </div>

      <div className="container">
        {step === 0 && (
          <>
            <h2>Select Service</h2>

            {services.map((s) => (
              <div
                key={s.id}
                className={`service-card ${
                  selectedService?.id === s.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => setSelectedService(s)}
              >
                <h3>
                  {getServiceIcon(s.name)} {s.name}
                </h3>

                <p>£{s.price}</p>

                {s.duration_minutes && (
                  <small>
                    {s.duration_minutes} mins
                  </small>
                )}
              </div>
            ))}

            <button
              className="btn"
              disabled={!canNext0}
              onClick={() => setStep(1)}
            >
              Continue
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <button
              onClick={() => setStep(0)}
              style={{ marginBottom: 20 }}
            >
              ← Back
            </button>

            <h2>Select Staff</h2>

            <div
              className={`staff-card ${
                staffConfirmed &&
                selectedStaff === null
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                setSelectedStaff(null);
                setStaffConfirmed(true);
              }}
            >
              Any Available Staff
            </div>

            {staffList.map((s) => (
              <div
                key={s.id}
                className={`staff-card ${
                  selectedStaff?.id === s.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setSelectedStaff(s);
                  setStaffConfirmed(true);
                }}
              >
                <h3>{s.name}</h3>

                {s.role && <p>{s.role}</p>}
              </div>
            ))}

            <button
              className="btn"
              disabled={!canNext1}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button
              onClick={() => setStep(1)}
              style={{ marginBottom: 20 }}
            >
              ← Back
            </button>

            <h2>Select Date & Time</h2>

            <input
              type="date"
              className="input"
              onChange={(e) =>
                setSelDate(new Date(e.target.value))
              }
            />

            {selDate && (
              <>
                <div className="time-grid">
                  {TIME_SLOTS.map((t) => {
                    const now = new Date();

                    const selectedDateTime =
                      selDate
                        ? new Date(
                            `${selDate.getFullYear()}-${String(
                              selDate.getMonth() + 1
                            ).padStart(2, "0")}-${String(
                              selDate.getDate()
                            ).padStart(2, "0")}T${t}`
                          )
                        : null;

                    const disabled =
                      selectedDateTime &&
                      selectedDateTime < now &&
                      selDate?.toDateString() ===
                        now.toDateString();

                    return (
                      <button
                        key={t}
                        disabled={disabled}
                        className={`time-btn ${
                          selTime === t
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          !disabled && setSelTime(t)
                        }
                        style={{
                          opacity: disabled ? 0.4 : 1,
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="btn"
                  disabled={!canNext2}
                  onClick={() => setStep(3)}
                >
                  Continue
                </button>
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <button
              onClick={() => setStep(2)}
              style={{ marginBottom: 20 }}
            >
              ← Back
            </button>

            <h2>Your Details</h2>

            <input
              className="input"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <input
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />

            <input
              className="input"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />

            <div
              style={{
                padding: 20,
                border: "1px solid #ddd",
                borderRadius: 12,
                marginTop: 20,
                background: "white",
              }}
            >
              <p>
                <strong>Service:</strong>{" "}
                {selectedService?.name}
              </p>

              <p>
                <strong>Staff:</strong>{" "}
                {selectedStaff?.name ||
                  "Any available"}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {selDate?.toLocaleDateString()}
              </p>

              <p>
                <strong>Time:</strong> {selTime}
              </p>

              <p>
                <strong>Price:</strong> £
                {selectedService?.price}
              </p>
            </div>

            <button
              className="btn"
              disabled={!canSubmit || submitting}
              onClick={handleBook}
            >
              {submitting
                ? "Booking..."
                : "Confirm Booking"}
            </button>
          </>
        )}
      </div>
    </>
  );
}