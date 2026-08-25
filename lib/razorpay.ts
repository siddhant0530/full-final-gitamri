import { createHmac, timingSafeEqual } from "crypto";

/**
 * RAZORPAY INTEGRATION
 * --------------------------------------------------------------
 * Uses Razorpay's plain REST API (no SDK needed) so there's no
 * extra npm dependency to install. Reads credentials from env vars
 * — see .env.local.example. Never hardcode keys in this file.
 */

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function authHeader() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local"
    );
  }
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString(
    "base64"
  );
  return `Basic ${credentials}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

// Creates a Razorpay order. Amount must be passed in rupees; this
// converts to paise (Razorpay's smallest unit) internally.
//
// `notes` (optional) lets the webhook safety net (see
// app/api/webhooks/razorpay/route.ts) reconstruct and save an order even
// if the browser never successfully calls POST /api/orders after payment
// — e.g. the tab closes right after payment, a network hiccup, or
// Supabase being auto-paused at that exact moment (the real incident that
// motivated this: a customer paid successfully but no order was ever
// written). Razorpay caps notes at 15 key-value pairs, 256 characters
// each — see buildOrderNotes() in the create-order route for the
// truncation that enforces this.
export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string,
  notes?: Record<string, string>
) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt,
      ...(notes ? { notes } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Razorpay order creation failed: ${errText}`);
  }

  return (await res.json()) as RazorpayOrder;
}

// Verifies the signature Razorpay sends back after a successful
// checkout, to confirm the payment wasn't tampered with client-side.
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }
  const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

/**
 * Verifies a Razorpay webhook delivery (see app/api/webhooks/razorpay).
 * This is a DIFFERENT secret from RAZORPAY_KEY_SECRET above — it's the
 * one you set when creating the webhook in the Razorpay Dashboard
 * (Settings → Webhooks), configured here as RAZORPAY_WEBHOOK_SECRET.
 * Must be computed over the exact raw request body (not a re-serialized
 * copy), since re-serializing JSON can reorder keys or change whitespace
 * and silently break the signature match.
 */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  // Timing-safe comparison — a plain === leaks how many leading
  // characters matched via response-time differences, which matters for
  // a signature check like this.
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}
