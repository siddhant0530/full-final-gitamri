import { createHmac } from "crypto";

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
export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
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
