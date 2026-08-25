import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { resolveOrderItems, calculateOrderTotal, PricingError } from "@/lib/pricing";

// Razorpay caps notes at 15 key-value pairs, 256 characters each. Truncating
// defensively here means a long address never breaks order creation — worst
// case the webhook safety net (see app/api/webhooks/razorpay) recovers a
// slightly truncated address instead of failing to recover anything at all.
function truncate(value: string, max = 256): string {
  return value.length > max ? value.slice(0, max) : value;
}

interface CheckoutCustomer {
  name: string;
  email?: string;
  phone: string;
  address: string;
  city?: string;
  pincode?: string;
  state?: string;
}

// Stashes everything needed to reconstruct this order — customer details
// and items — into the Razorpay order's notes. If the browser never
// successfully calls POST /api/orders after a successful payment (closed
// tab, network drop, Supabase auto-paused at that moment — the exact
// failure mode behind a real missed order), the webhook safety net reads
// these notes back out from the payment.captured event and self-heals.
function buildOrderNotes(
  customer: CheckoutCustomer,
  items: { productId: string; weight?: string; quantity: number }[]
): Record<string, string> {
  return {
    customerName: truncate(customer.name || ""),
    customerEmail: truncate(customer.email || ""),
    customerPhone: truncate(customer.phone || ""),
    customerAddress: truncate(customer.address || ""),
    customerCity: truncate(customer.city || ""),
    customerPincode: truncate(customer.pincode || ""),
    customerState: truncate(customer.state || ""),
    // Short keys (p/w/q instead of productId/weight/quantity) buy real
    // headroom under Razorpay's 256-char-per-value limit — roughly doubles
    // how many cart line items fit before truncation becomes a risk.
    items: truncate(
      JSON.stringify(items.map((i) => ({ p: i.productId, w: i.weight, q: i.quantity })))
    ),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { items: clientItems, customer } = await req.json();

    // The amount is never taken from the client — it's recomputed here
    // from the actual product catalog so a tampered request can't create
    // a real Razorpay order for less than the cart is actually worth.
    const { items, subtotal } = resolveOrderItems(clientItems);

    // This route is only ever used for the ONLINE/Razorpay flow, so the
    // prepaid discount always applies here — the Razorpay order (and
    // therefore the amount actually charged) is created for the
    // discounted total, not the raw subtotal.
    const { discount, total } = calculateOrderTotal(items, subtotal, "ONLINE");

    // Customer details are optional here — if the checkout page is ever
    // updated to call this route before the delivery form is filled in,
    // order creation should still work, it just loses the self-heal
    // safety net for that particular order (falls back to needing manual
    // recovery from the Razorpay Dashboard, same as before this existed).
    const notes = customer ? buildOrderNotes(customer, clientItems) : undefined;

    const order = await createRazorpayOrder(total, `receipt_${Date.now()}`, notes);
    return NextResponse.json({ order, subtotal, discount, total });
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Could not create Razorpay order. Check that RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set in .env.local." },
      { status: 500 }
    );
  }
}
