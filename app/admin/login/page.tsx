"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ── Inner form — uses useSearchParams, must be inside <Suspense> ──
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [notice,   setNotice]   = useState("");

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "session_expired") setNotice("Your session has expired. Please sign in again.");
    if (err === "forbidden")       setNotice("You don't have permission to access that page.");
    if (err === "demo_expired")    setNotice("Your demo session has expired. Contact the administrator for a new link.");
  }, [searchParams]);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Email and password are required."); return; }

    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Login failed. Please try again."); return; }
      if (json.role === "guest") { router.push("/admin/demo"); return; }
      router.push("/admin");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100%", maxWidth: 420,
      background: "#13131F", borderRadius: 24,
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#1E1B4B,#312E81,#4F46E5)",
        padding: "36px 36px 28px", textAlign: "center",
      }}>
        <div style={{
          width: 52, height: 52, background: "rgba(255,255,255,0.15)",
          borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 14, backdropFilter: "blur(8px)",
        }}>F</div>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 6px", fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase" }}>
          Feature Salon
        </p>
        <h1 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>Admin Portal</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", margin: "8px 0 0", fontSize: 13 }}>
          Sign in to your admin account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: "32px 36px 36px" }}>

        {/* Session notice */}
        {notice && (
          <div style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          }}>
            <p style={{ color: "#FCD34D", margin: 0, fontSize: 13 }}>ℹ️ {notice}</p>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email address</label>
          <input
            type="email" placeholder="you@featuresalon.co.uk"
            value={email} onChange={e => setEmail(e.target.value)}
            autoComplete="email" required style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"} placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" required
              style={{ ...inputStyle, paddingRight: 46 }}
            />
            <button type="button" onClick={() => setShowPw(p => !p)} style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              fontSize: 16, color: "rgba(255,255,255,0.35)", lineHeight: 1,
            }}>
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          }}>
            <p style={{ color: "#FCA5A5", margin: 0, fontSize: 13 }}>⚠️ {error}</p>
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "14px",
          background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#4F46E5,#7C3AED)",
          color: "#fff", border: "none", borderRadius: 14,
          fontSize: 15, fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 8px 28px rgba(79,70,229,0.4)",
          transition: "all 0.18s", fontFamily: "inherit",
        }}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
          Access restricted to authorised admin team members only.
        </p>
      </form>
    </div>
  );
}

// ── Page shell — wraps form in Suspense (required for useSearchParams) ──
export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A14",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Helvetica Neue', Arial, sans-serif",
    }}>
      <Suspense fallback={
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Loading…</div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700,
  color: "rgba(255,255,255,0.4)", marginBottom: 7, letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12, fontSize: 14, color: "#fff",
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.18s",
};
