import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrder } from "@/lib/order-store";
import { resolveOrderItems, calculateOrderTotal, PricingError } from "@/lib/pricing";
import { verifyRazorpaySignature } from "@/lib/razorpay";

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

  const {
    customer,
    items: clientItems,
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = body;

  if (!customer?.name || !customer?.phone || !customer?.address || !clientItems?.length) {
    return NextResponse.json(
      { error: "Missing required order details." },
      { status: 400 }
    );
  }

  const isOnline = paymentMethod === "ONLINE";

  // For ONLINE orders, the signature is re-verified here rather than
  // trusting that the browser's earlier /verify call succeeded. Without
  // this, a request could claim paymentMethod: "ONLINE" with a made-up
  // razorpayPaymentId to get both the 12% prepaid discount and a
  // "Paid" order status without ever actually paying.
  if (isOnline) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing payment verification details for online order." },
        { status: 400 }
      );
    }
    const validSignature = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!validSignature) {
      return NextResponse.json(
        { error: "Payment verification failed. Order not placed." },
        { status: 400 }
      );
    }
  }

  try {
    // Price and name are never trusted from the client — recomputed here
    // from the product catalog so a tampered request can't place a real
    // order at a fake (or free) price. Only productId/weight/quantity are
    // read from what the browser sent.
    const { items, subtotal } = resolveOrderItems(clientItems);

    // 12–15% prepaid discount — only ever applied for a verified ONLINE
    // payment, computed server-side per line item (see lib/pricing.ts).
    const { discount, total } = calculateOrderTotal(items, subtotal, isOnline ? "ONLINE" : "COD");

    const order = await saveOrder({
      customer,
      items,
      subtotal,
      discount,
      total,
      paymentMethod: isOnline ? "ONLINE" : "COD",
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
