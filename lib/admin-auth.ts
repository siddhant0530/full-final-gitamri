/**
 * ADMIN SESSION TOKENS
 * --------------------------------------------------------------
 * Uses the Web Crypto API (crypto.subtle) rather than Node's
 * `crypto` module on purpose — this file is imported from both a
 * normal Route Handler (Node runtime) AND middleware.ts (Edge
 * runtime by default), and crypto.subtle is the one HMAC
 * implementation available in both.
 *
 * A session "token" is `admin.<expiresAtMillis>.<hmacSignatureHex>`.
 * It's a signed, tamper-evident, self-expiring value — not a random
 * ID needing server-side storage, so no database/session store is
 * needed for this admin-only, single-role login.
 */

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours
const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminSessionToken(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expiresAt}`;
  const signature = await hmacHex(secret, payload);
  return `${payload}.${signature}`;
}

export async function isValidAdminSessionToken(
  token: string | undefined | null,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [prefix, expiresAtStr, signature] = parts;
  if (prefix !== "admin") return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = await hmacHex(secret, `${prefix}.${expiresAtStr}`);
  return constantTimeEqual(expected, signature);
}

export const ADMIN_SESSION_COOKIE = "gitamri_admin_session";
