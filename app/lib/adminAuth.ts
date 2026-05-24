/**
 * Lightweight HS256 JWT utilities for admin sessions.
 * Works on both Node.js (API routes) and Edge runtime (middleware).
 * Requires ADMIN_SECRET env var — must be at least 32 characters.
 */

import type { NextRequest } from "next/server";
import type { AdminRole } from "@/app/types/admin";

// ─── Internal crypto helpers ──────────────────────────────────

const ALGO             = { name: "HMAC", hash: "SHA-256" } as const;
const TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 hours

function b64url(input: string): string {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(input: string): string {
  const padded    = input.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  return atob(remainder ? padded + "=".repeat(4 - remainder) : padded);
}

async function getKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    ALGO,
    false,
    usage,
  );
}

// ─── Cookie name and options ──────────────────────────────────

export const ADMIN_COOKIE = "admin_token";

export const adminCookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path:     "/",
  maxAge:   TOKEN_TTL_SECONDS,
};

// ─── Sign ─────────────────────────────────────────────────────

export async function signAdminToken(payload: {
  id:                  string;
  role:                string;
  mfa_verified:        boolean;
  mfa_setup_required:  boolean;
}): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SECRET must be set and at least 32 characters");
  }

  const now    = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS };

  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = b64url(JSON.stringify(claims));
  const message = new TextEncoder().encode(`${header}.${body}`);
  const key     = await getKey(secret, ["sign"]);
  const sigBuf  = await crypto.subtle.sign(ALGO, key, message);
  const sig     = b64url(String.fromCharCode(...new Uint8Array(sigBuf)));

  return `${header}.${body}.${sig}`;
}

// ─── Verify ───────────────────────────────────────────────────

export async function verifyAdminToken(token: string): Promise<{
  id:                  string;
  role:                string;
  mfa_verified:        boolean;
  mfa_setup_required:  boolean;
  iat:                 number;
  exp:                 number;
} | null> {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;

    const message  = new TextEncoder().encode(`${header}.${body}`);
    const key      = await getKey(secret, ["verify"]);
    const sigBytes = Uint8Array.from(b64urlDecode(sig), (c) => c.charCodeAt(0));
    const valid    = await crypto.subtle.verify(ALGO, key, sigBytes, message);
    if (!valid) return null;

    const claims = JSON.parse(b64urlDecode(body));
    if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;
    if (!claims.id || !claims.role) return null;

    // Tokens issued before 2FA migration have no mfa fields — treat as needing re-login
    if (claims.mfa_verified === undefined) return null;

    return claims;
  } catch {
    return null;
  }
}

// ─── API route auth helper ────────────────────────────────────

/**
 * Reads and verifies the admin_token cookie from an API route request.
 * Returns { id, role } on success, or null if missing / invalid / expired.
 * Call this at the top of every protected /api/admin/* route handler.
 */
export async function verifyAdminRequest(
  req: NextRequest,
): Promise<{ id: string; role: AdminRole; mfa_verified: boolean } | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyAdminToken(token);
  if (!payload) return null;
  return { id: payload.id, role: payload.role as AdminRole, mfa_verified: payload.mfa_verified };
}
