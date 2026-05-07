"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function FailedContent() {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("slug") || "";
  const reason = params.get("reason") || "Your payment could not be processed. Please try again.";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#EF4444 0%,#DC2626 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background: "#fff", borderRadius: 28, padding: "48px 32px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", animation: "slideUp 0.5s ease-out" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#EF4444 0%,#DC2626 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px", boxShadow: "0 8px 24px rgba(239,68,68,0.4)" }}>✕</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 12, color: "#0F172A" }}>Payment Failed</h1>
        <p style={{ fontSize: 14.5, color: "#64748B", marginBottom: 32, lineHeight: 1.6 }}>{reason}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slug && (
            <button onClick={() => router.push(`/book/${slug}`)} style={{ background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", color: "#fff", border: "none", padding: "14px", borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(102,126,234,0.4)" }}>
              Try Again
            </button>
          )}
          <button onClick={() => window.close()} style={{ background: "#F1F5F9", color: "#334155", border: "none", padding: "14px", borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>Loading...</div>}><FailedContent/></Suspense>;
}