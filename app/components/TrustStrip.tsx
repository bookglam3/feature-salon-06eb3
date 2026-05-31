/**
 * Technology partner strip — shows ONLY real integrations Feature uses.
 * Logos are rendered from official brand SVG paths (Stripe, WhatsApp, Twilio).
 * Do NOT add logos for services Feature does not actually integrate with.
 */

const C = {
  bg: "#0E1320",
  border: "#2a3350",
  chip: "rgba(255,255,255,0.95)",
  text: "#1a1a2e",
  muted: "#6B7280",
  gold: "#C9A24B",
};

/* ── Official brand icon SVGs ─────────────────────────────────────────────── */

/** Stripe "S" mark — official brand path, viewBox 0 0 24 24 */
function StripeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
      <path
        fill="#635BFF"
        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
      />
    </svg>
  );
}

/** WhatsApp phone-in-bubble icon — official brand path, viewBox 0 0 24 24 */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="WhatsApp">
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

/** Twilio wordmark — brand color #F22F46, text-based (their identity is text-first) */
function TwilioWordmark() {
  return (
    <span
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontWeight: 900,
        fontSize: 15,
        letterSpacing: "-0.5px",
        color: "#F22F46",
        lineHeight: 1,
        userSelect: "none",
      }}
      aria-label="Twilio"
    >
      twilio
    </span>
  );
}

/* ── Single chip ──────────────────────────────────────────────────────────── */
interface ChipProps {
  icon: React.ReactNode;
  name: string;
  label: string;
  ariaLabel?: string;
}

function Chip({ icon, name, label, ariaLabel }: ChipProps) {
  return (
    <div
      role="img"
      aria-label={ariaLabel ?? name}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: C.chip,
        borderRadius: 10,
        padding: "9px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      }}
    >
      {icon}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{name}</div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.2, marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── "Built in the UK" dark badge ─────────────────────────────────────────── */
function UKBadge() {
  return (
    <div
      role="img"
      aria-label="Built in the UK"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "9px 16px",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>🇬🇧</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#F7F5EF", lineHeight: 1.2 }}>Built in the UK</div>
        <div style={{ fontSize: 11, color: "#aab1c4", lineHeight: 1.2, marginTop: 1 }}>for UK businesses</div>
      </div>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────────────────── */
export default function TrustStrip() {
  return (
    <section
      aria-label="Technology partners"
      style={{
        background: C.bg,
        borderTop: `0.5px solid ${C.border}`,
        borderBottom: `0.5px solid ${C.border}`,
        padding: "28px 40px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: C.gold,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 18px",
        }}
      >
        Powered by the tools you already trust
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Chip
          icon={<StripeIcon />}
          name="Stripe"
          label="Card payments"
          ariaLabel="Payments powered by Stripe"
        />
        <Chip
          icon={<WhatsAppIcon />}
          name="WhatsApp"
          label="Appointment reminders"
          ariaLabel="WhatsApp reminders"
        />
        <Chip
          icon={<TwilioWordmark />}
          name="Twilio"
          label="SMS reminders"
          ariaLabel="SMS powered by Twilio"
        />
        <UKBadge />
      </div>
    </section>
  );
}
