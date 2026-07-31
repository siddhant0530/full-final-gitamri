import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrder } from "@/lib/order-store";
import { resolveOrderItems, PricingError } from "@/lib/pricing";

// GET /api/orders -> list all orders (used by the admin panel).
// Already gated by middleware.ts (requires a valid admin session cookie) —
// no additional check needed here.
export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}

// POST /api/orders -> place a new order, returns a tracking ID
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { customer, items: clientItems, paymentMethod, razorpayOrderId, razorpayPaymentId } = body;

  if (!customer?.name || !customer?.phone || !customer?.address || !clientItems?.length) {
    return NextResponse.json(
      { error: "Missing required order details." },
      { status: 400 }
    );
  }

  try {
    // Price and name are never trusted from the client — recomputed here
    // from the product catalog so a tampered request can't place a real
    // order at a fake (or free) price. Only productId/weight/quantity are
    // read from what the browser sent.
    const { items, subtotal } = resolveOrderItems(clientItems);

    const order = await saveOrder({
      customer,
      items,
      subtotal,
      paymentMethod: paymentMethod === "ONLINE" ? "ONLINE" : "COD",
      // For COD, payment is collected on delivery. For ONLINE, this route
      // should only be called *after* /api/payments/razorpay/verify has
      // confirmed the signature — see app/checkout/page.tsx.
      razorpayOrderId,
      razorpayPaymentId,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof PricingError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not place order." }, { status: 500 });
  }
}
