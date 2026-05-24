"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "loading" | "scan" | "confirm" | "done" | "error";

export default function Setup2FAPage() {
  const router = useRouter();

  const [step,        setStep]        = useState<Step>("loading");
  const [qr,          setQr]          = useState("");
  const [secret,      setSecret]      = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code,        setCode]        = useState("");
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/2fa/enroll")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setStep("error"); return; }
        setQr(d.qr);
        setSecret(d.secret);
        setBackupCodes(d.backupCodes);
        setStep("scan");
      })
      .catch(() => { setError("Failed to start 2FA setup."); setStep("error"); });
  }, []);

  const handleConfirm = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (code.replace(/\s/g, "").length !== 6) { setError("Enter the 6-digit code from your app."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res  = await fetch("/api/admin/auth/2fa/confirm", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: code.replace(/\s/g, "") }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Verification failed."); return; }
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#07070F",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'Helvetica Neue', Arial, sans-serif",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{
        width: "100%", maxWidth: 480,
        background: "#0D0D1A", borderRadius: 24,
        border: "1px solid rgba(99,102,241,0.2)",
        overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#1E1B4B,#312E81,#4F46E5)",
          padding: "32px 36px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>
            {step === "done" ? "✅" : step === "error" ? "⚠️" : "🔐"}
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 4px", fontSize: 10, letterSpacing: "2.5px", textTransform: "uppercase" }}>
            Feature Salon Admin
          </p>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 800 }}>
            {step === "done"    ? "2FA Enabled!" :
             step === "error"   ? "Setup Failed" :
             step === "loading" ? "Setting up…"  :
             step === "confirm" ? "Verify Code"  :
             "Set Up Two-Factor Auth"}
          </h1>
        </div>

        <div style={{ padding: "28px 32px 32px" }}>

          {/* LOADING */}
          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 36, height: 36, border: "3px solid rgba(99,102,241,0.2)",
                borderTopColor: "#6366F1", borderRadius: "50%",
                animation: "spin 0.8s linear infinite", margin: "0 auto 14px",
              }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Generating your 2FA secret…</p>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 12, padding: "16px 20px", marginBottom: 20,
              }}>
                <p style={{ color: "#FCA5A5", margin: 0, fontSize: 13 }}>{error}</p>
              </div>
              <button onClick={() => window.location.reload()} style={btnStyle(false)}>Try Again</button>
            </div>
          )}

          {/* SCAN */}
          {step === "scan" && (
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Scan this QR code with <strong style={{ color: "#A5B4FC" }}>Google Authenticator</strong>, <strong style={{ color: "#A5B4FC" }}>Authy</strong>, or any TOTP app.
              </p>

              {/* QR Code */}
              {qr && (
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{
                    display: "inline-block", padding: 12,
                    background: "#fff", borderRadius: 16,
                    boxShadow: "0 0 40px rgba(99,102,241,0.3)",
                  }}>
                    <img src={qr} alt="2FA QR Code" width={200} height={200} style={{ display: "block" }} />
                  </div>
                </div>
              )}

              {/* Manual entry */}
              <div style={{
                background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 12, padding: "12px 16px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>
                  Can&apos;t scan? Enter manually
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <code style={{ fontSize: 13, color: "#A5B4FC", letterSpacing: "2px", flex: 1, wordBreak: "break-all" }}>{secret}</code>
                  <button onClick={copySecret} style={{
                    padding: "4px 10px", background: "rgba(99,102,241,0.2)",
                    border: "1px solid rgba(99,102,241,0.3)", borderRadius: 7,
                    color: "#818CF8", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                  }}>{copied ? "✓ Copied" : "Copy"}</button>
                </div>
              </div>

              {/* Backup codes */}
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 12, padding: "14px 16px", marginBottom: 24,
              }}>
                <div style={{ fontSize: 10, color: "#FCD34D", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
                  ⚠ Save Your Backup Codes — shown only once
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {backupCodes.map(c => (
                    <code key={c} style={{ fontSize: 12, color: "#FDE68A", background: "rgba(0,0,0,0.3)", padding: "5px 10px", borderRadius: 6 }}>{c}</code>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "10px 0 0" }}>
                  Store these somewhere safe. Each code can be used once if you lose your phone.
                </p>
              </div>

              <button onClick={() => setStep("confirm")} style={btnStyle(false)}>
                I&apos;ve saved my backup codes → Continue
              </button>
            </div>
          )}

          {/* CONFIRM */}
          {step === "confirm" && (
            <form onSubmit={handleConfirm}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Enter the <strong style={{ color: "#A5B4FC" }}>6-digit code</strong> currently shown in your authenticator app to confirm setup.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={lblStyle}>Authenticator Code</label>
                <input
                  type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  placeholder="000000" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  style={{
                    width: "100%", padding: "14px 16px", fontSize: 28, letterSpacing: "10px",
                    textAlign: "center", fontWeight: 800, color: "#A5B4FC",
                    background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: 14, outline: "none", boxSizing: "border-box", fontFamily: "monospace",
                  }}
                />
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "11px 14px", marginBottom: 18 }}>
                  <p style={{ color: "#FCA5A5", margin: 0, fontSize: 13 }}>⚠️ {error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting} style={btnStyle(submitting)}>
                {submitting ? "Verifying…" : "Activate 2FA →"}
              </button>
              <button type="button" onClick={() => setStep("scan")} style={{
                width: "100%", marginTop: 10, padding: "10px",
                background: "transparent", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.3)", fontSize: 13,
              }}>← Back</button>
            </form>
          )}

          {/* DONE */}
          {step === "done" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 14, padding: "18px 22px", marginBottom: 24,
              }}>
                <p style={{ color: "#34D399", margin: 0, fontSize: 14, lineHeight: 1.7 }}>
                  Two-factor authentication is now active on your account. You&apos;ll be prompted for a code on every login.
                </p>
              </div>
              <button onClick={() => router.push("/admin")} style={btnStyle(false)}>
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%", padding: "13px",
  background: disabled ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#4F46E5,#7C3AED)",
  color: "#fff", border: "none", borderRadius: 13,
  fontSize: 14, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : "0 6px 20px rgba(79,70,229,0.4)",
  fontFamily: "inherit", transition: "all 0.18s",
});

const lblStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(255,255,255,0.35)", letterSpacing: "0.8px",
  textTransform: "uppercase", marginBottom: 8,
};
