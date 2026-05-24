/**
 * Lightweight HS256 JWT utilities for admin sessions.
 * Works on both Node.js (API routes) and Edge runtime (middleware).
 * Requires ADMIN_SECRET env var — must be at least 32 characters.
 */

const ALGO = { name: "HMAC", hash: "SHA-256" } as const;
const TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 hours

function b64url(input: string): string {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
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

// ─── Sign ─────────────────────────────────────────────────────

export async function signAdminToken(payload: {
  id:   string;
  role: string;
}): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SECRET env var must be set and at least 32 characters");
  }

  const now = Math.floor(Date.now() / 1000);
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
  id:   string;
  role: string;
  iat:  number;
  exp:  number;
} | null> {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;

    // Verify signature
    const message  = new TextEncoder().encode(`${header}.${body}`);
    const key      = await getKey(secret, ["verify"]);
    const sigBytes = Uint8Array.from(b64urlDecode(sig), (c) => c.charCodeAt(0));
    const valid    = await crypto.subtle.verify(ALGO, key, sigBytes, message);
    if (!valid) return null;

    // Decode and check expiry
    const claims = JSON.parse(b64urlDecode(body));
    if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;
    if (!claims.id || !claims.role) return null;

    return claims;
  } catch {
    return null;
  }
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
