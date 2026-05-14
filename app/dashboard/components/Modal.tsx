"use client";
import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({ open, onClose, title, children, maxWidth = 480 }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @media (min-width: 600px) {
          .modal-inner { border-radius: 20px !important; max-height: 90vh !important; margin: 16px !important; animation: slideUp 0.24s cubic-bezier(0.4,0,0.2,1) both !important; }
          .modal-wrap { align-items: center !important; }
        }
        @media (max-width: 599px) {
          .modal-inner { animation: slideUpMobile 0.28s cubic-bezier(0.4,0,0.2,1) both !important; border-radius: 20px 20px 0 0 !important; }
        }
        .modal-inner input:-webkit-autofill,
        .modal-inner input:-webkit-autofill:hover,
        .modal-inner input:-webkit-autofill:focus {
          -webkit-text-fill-color: #F1F5F9 !important;
          -webkit-box-shadow: 0 0 0px 1000px #1A1830 inset !important;
        }
      `}</style>
      <div
        ref={ref}
        className="modal-inner"
        style={{
          background: "#14122A",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "24px 20px 32px",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 99, margin: "0 auto 20px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.4px" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.08)", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 14,
              color: "rgba(255,255,255,0.4)", transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >✕</button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ── Shared form primitives — dark theme ── */
export function FormGroup({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6, letterSpacing: "-0.1px" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "10px 13px",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, fontSize: 14,
        color: "#F1F5F9", background: "rgba(255,255,255,0.06)",
        outline: "none", transition: "border-color 0.12s, box-shadow 0.12s",
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.2)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "10px 13px",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, fontSize: 14,
        color: "#F1F5F9", background: "rgba(255,255,255,0.06)",
        outline: "none", transition: "border-color 0.12s, box-shadow 0.12s",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
        paddingRight: 36,
        ...props.style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "#8B5CF6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.2)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
      {children}
    </div>
  );
}

export function BtnPrimary({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        flex: 1, padding: "11px 20px",
        background: "linear-gradient(135deg,#7C3AED,#6D28D9)",
        color: "#fff",
        border: "none", borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: "pointer",
        boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
        transition: "all 0.14s",
        letterSpacing: "-0.15px", opacity: props.disabled ? 0.45 : 1,
        ...props.style,
      }}
      onMouseEnter={e => { if (!props.disabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.5)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.4)"; }}
    >{children}</button>
  );
}

export function BtnSecondary({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        flex: 1, padding: "11px 20px",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
        fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
        ...props.style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#F1F5F9"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
    >{children}</button>
  );
}
