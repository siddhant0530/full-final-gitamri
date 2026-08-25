import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { getOrderByRazorpayPaymentId, saveOrder } from "@/lib/order-store";
import { resolveOrderItems, calculateOrderTotal, PricingError } from "@/lib/pricing";

/**
 * RAZORPAY WEBHOOK — ORDER SAFETY NET
 * --------------------------------------------------------------
 * Why this exists: the normal flow is browser-driven — pay via
 * Razorpay, then the browser calls POST /api/orders to save the order.
 * If that second call never happens (tab closed right after payment,
 * network drop, or Supabase being auto-paused at that exact moment),
 * the customer has been charged with no order on record. This is the
 * exact failure that hit a real customer (paid ₹608, no order written,
 * traced back to Supabase auto-pause dropping the write while the
 * payment succeeded independently).
 *
 * Razorpay's payment.captured webhook fires server-to-server, entirely
 * independent of the customer's browser, so it's a reliable place to
 * catch and self-heal this. The order's line items and delivery details
 * are recovered from the notes stashed at order-creation time — see
 * buildOrderNotes() in app/api/payments/razorpay/create-order/route.ts.
 *
 * SETUP REQUIRED (one-time, in the Razorpay Dashboard):
 * Settings → Webhooks → Add New Webhook
 *   URL: https://gitamrimaaji.com/api/webhooks/razorpay
 *   Active events: payment.captured
 *   Secret: generate a random string, then set it as RAZORPAY_WEBHOOK_SECRET
 *   in .env.local / Vercel env vars. This is a DIFFERENT secret from
 *   RAZORPAY_KEY_SECRET — Razorpay signs webhook deliveries with this one
 *   specifically, on the Dashboard's Webhooks page, not the API keys page.
 */
export async function POST(req: NextRequest) {
  // Signature must be verified over the exact raw body — parsing to JSON
  // and re-stringifying first can reorder keys or change whitespace and
  // silently break the signature match.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.error("Razorpay webhook: signature verification failed — rejecting.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: Record<string, unknown> } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // payment.captured is the canonical "money has actually changed hands"
  // signal — order.paid fires around the same time but isn't needed here.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment || typeof payment.id !== "string" || typeof payment.order_id !== "string") {
    return NextResponse.json({ received: true });
  }

  const razorpayPaymentId = payment.id;
  const razorpayOrderId = payment.order_id;
  const notes = (payment.notes as Record<string, string> | undefined) || {};

  try {
    // Idempotency: if the normal browser flow already saved this order
    // (the common case — this webhook firing is mostly a no-op safety
    // check), do nothing. Prevents ever double-booking a payment.
    const existing = await getOrderByRazorpayPaymentId(razorpayPaymentId);
    if (existing) {
      return NextResponse.json({ received: true, alreadyRecorded: true });
    }

    if (!notes.customerName || !notes.customerPhone || !notes.customerAddress || !notes.items) {
      // Retrying won't produce notes that were never there — this needs a
      // human to reconcile from the Razorpay Dashboard payment record, so
      // it's logged loudly rather than left to Razorpay's retry schedule.
      console.error(
        `Razorpay webhook: payment ${razorpayPaymentId} (order ${razorpayOrderId}) was captured but has no/incomplete order notes to self-heal from. MANUAL RECOVERY NEEDED — check the Razorpay Dashboard for this payment's amount and contact details.`
      );
      return NextResponse.json({ received: true, manualRecoveryNeeded: true });
    }

    let clientItems: unknown;
    try {
      const shortForm = JSON.parse(notes.items) as { p: string; w?: string; q: number }[];
      // Expand the short keys (p/w/q) used in the stashed notes — see
      // buildOrderNotes() in the create-order route — back to what
      // resolveOrderItems() expects.
      clientItems = shortForm.map((i) => ({ productId: i.p, weight: i.w, quantity: i.q }));
    } catch {
      // A cart with enough items can still push the JSON past Razorpay's
      // 256-char note-value limit, truncating it mid-string — invalid JSON
      // that will never parse no matter how many times Razorpay retries.
      // Needs a human to reconcile from the Dashboard, not more retries.
      console.error(
        `Razorpay webhook: payment ${razorpayPaymentId} has truncated/corrupted items notes (likely a large cart exceeding the notes size limit). MANUAL RECOVERY NEEDED. Raw notes.items: ${notes.items}`
      );
      return NextResponse.json({ received: true, manualRecoveryNeeded: true });
    }

    const { items, subtotal } = resolveOrderItems(clientItems as never);
    const { discount, total } = calculateOrderTotal(items, subtotal, "ONLINE");

    const order = await saveOrder({
      customer: {
        name: notes.customerName,
        email: notes.customerEmail || "",
        phone: notes.customerPhone,
        address: notes.customerAddress,
        city: notes.customerCity || "",
        pincode: notes.customerPincode || "",
        state: notes.customerState || undefined,
      },
      items,
      subtotal,
      discount,
      total,
      paymentMethod: "ONLINE",
      razorpayOrderId,
      razorpayPaymentId,
    });

    console.log(
      `Razorpay webhook: self-healed a missing order (${order.trackingId}) for payment ${razorpayPaymentId} — the browser never completed POST /api/orders for this payment.`
    );
    return NextResponse.json({ received: true, selfHealed: true, trackingId: order.trackingId });
  } catch (err) {
    if (err instanceof PricingError) {
      // A genuine data problem (e.g. a product referenced in notes no
      // longer exists) — retrying won't fix it either, so don't ask
      // Razorpay to keep trying.
      console.error(
        `Razorpay webhook: pricing error while self-healing payment ${razorpayPaymentId}: ${err.message}. MANUAL RECOVERY NEEDED.`
      );
      return NextResponse.json({ received: true, manualRecoveryNeeded: true });
    }

    // Anything else (most likely: Supabase unreachable/auto-paused at this
    // exact moment) is probably transient. Returning a non-2xx here makes
    // Razorpay retry this delivery on its own backoff schedule — and by
    // the time it retries, the earlier connection attempt has likely
    // already woken a paused Supabase project, so the retry succeeds.
    console.error(`Razorpay webhook: error self-healing payment ${razorpayPaymentId}, will rely on Razorpay's retry:`, err);
    return NextResponse.json({ error: "Temporary failure, please retry." }, { status: 500 });
  }
}
