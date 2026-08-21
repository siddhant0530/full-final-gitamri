import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { resolveOrderItems, calculateOrderTotal, PricingError } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { items: clientItems } = await req.json();

    // The amount is never taken from the client — it's recomputed here
    // from the actual product catalog so a tampered request can't create
    // a real Razorpay order for less than the cart is actually worth.
    const { items, subtotal } = resolveOrderItems(clientItems);

    // This route is only ever used for the ONLINE/Razorpay flow, so the
    // prepaid discount always applies here — the Razorpay order (and
    // therefore the amount actually charged) is created for the
    // discounted total, not the raw subtotal.
    const { discount, total } = calculateOrderTotal(items, subtotal, "ONLINE");

    const order = await createRazorpayOrder(total, `receipt_${Date.now()}`);
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
