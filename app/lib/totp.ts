/**
 * Pure Node.js TOTP (RFC 6238) + backup code utilities.
 * No external packages — uses only the built-in crypto module.
 */
import { createHmac, createHash, randomBytes } from "crypto";

// ── Base32 ────────────────────────────────────────────────────

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let out = "", bits = 0, val = 0;
  for (const byte of buf) {
    val = (val << 8) | byte;
    bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

function base32Decode(str: string): Buffer {
  let bits = 0, val = 0;
  const bytes: number[] = [];
  for (const ch of str.toUpperCase().replace(/[=\s]/g, "")) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(bytes);
}

// ── HOTP / TOTP core ─────────────────────────────────────────

function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) { buf[i] = c & 0xff; c >>>= 8; }
  const hmac = createHmac("sha1", key).update(buf).digest();
  const off  = hmac[hmac.length - 1] & 0x0f;
  return ((hmac.readUInt32BE(off) & 0x7fff_ffff) % 1_000_000)
    .toString().padStart(6, "0");
}

// ── Public API ────────────────────────────────────────────────

/** Generates a 20-byte base32-encoded TOTP secret. */
export function generateTOTPSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * Verifies a 6-digit TOTP code against a secret.
 * Accepts ±1 time window (30s each) to tolerate clock drift.
 */
export function verifyTOTP(secret: string, token: string): boolean {
  const key  = base32Decode(secret);
  const step = Math.floor(Date.now() / 30_000);
  const code = token.replace(/\s/g, "");
  for (let w = -1; w <= 1; w++) {
    if (hotp(key, step + w) === code) return true;
  }
  return false;
}

/** Builds the otpauth:// URI for QR code / manual entry. */
export function totpURI(secret: string, email: string, issuer = "Feature Salon"): string {
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
  );
}

// ── Backup codes ──────────────────────────────────────────────

/** Generates N one-time backup codes (format: XXXX-XXXX). Returns plain codes + SHA-256 hashes. */
export function generateBackupCodes(count = 8): { codes: string[]; hashes: string[] } {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const hex  = randomBytes(4).toString("hex").toUpperCase();
    const code = `${hex.slice(0, 4)}-${hex.slice(4)}`;
    codes.push(code);
    hashes.push(createHash("sha256").update(hex).digest("hex"));
  }
  return { codes, hashes };
}

/** Returns the index of a matching unused backup code hash, or -1 if not found. */
export function matchBackupCode(
  rawCode: string,
  hashes: string[],
): number {
  const normalized = rawCode.toUpperCase().replace(/[-\s]/g, "");
  const attempt    = createHash("sha256").update(normalized).digest("hex");
  return hashes.findIndex(h => h === attempt);
}
