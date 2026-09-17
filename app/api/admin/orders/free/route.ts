import { NextRequest, NextResponse } from "next/server";
import { resolveOrderItems, PricingError } from "@/lib/pricing";
import { saveOrder } from "@/lib/order-store";

// POST /api/admin/orders/free
// --------------------------------------------------------------
// Creates a complimentary order (paymentMethod: "FREE") — for jars sent
// to influencers/creators for reels in exchange for coverage, with no
// Razorpay payment involved. Protected by middleware.ts, same as the
// other /api/admin/* routes (requires a valid admin session cookie).
//
// Deliberately reuses resolveOrderItems() — the same server-side price
// lookup /api/orders uses for real checkouts — so item names/prices on
// the resulting invoice are real catalog values, not whatever an admin
// might fat-finger into a form. discount is then set to the full
// subtotal so the order (and its invoice) actually lands on total: 0,
// rather than trusting a client-supplied total.
//
// From here on, this order is indistinguishable from a real one to the
// rest of the app: /api/admin/invoice/[trackingId] generates a real GST
// invoice for it (see lib/invoice.ts's 100% discount case for "FREE"),
// and /api/delivery/create creates a real Delhivery shipment for it
// (paymentMode "Prepaid" since paymentMethod !== "COD", amount 0, so
// Delhivery never tries to collect anything on delivery).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customer, shippingAddress, items: clientItems } = body;

  if (!customer?.name || !customer?.phone || !customer?.address || !customer?.state || !clientItems?.length) {
    return NextResponse.json(
      { error: "Missing required order details." },
      { status: 400 }
    );
  }

  // Same shipping-address rule as /api/orders: either fully filled in,
  // or omitted entirely (ship-to = billing address).
  if (
    shippingAddress &&
    (!shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.pincode ||
      !shippingAddress.state)
  ) {
    return NextResponse.json(
      { error: "Please fill in all fields for the shipping address, or turn it off to ship to the billing address." },
      { status: 400 }
    );
  }

  try {
    const { items, subtotal } = resolveOrderItems(clientItems);

    const order = await saveOrder({
      customer,
      shippingAddress: shippingAddress || undefined,
      items,
      subtotal,
      // 100% discount -> total 0. Kept as a real subtotal + discount
      // pair (rather than just zeroing item prices) so the invoice can
      // show what the jars were actually worth, discounted to free —
      // see lib/invoice.ts's per-line discountRate for paymentMethod "FREE".
      discount: subtotal,
      total: 0,
      paymentMethod: "FREE",
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not place free order." }, { status: 500 });
  }
}
