import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { resolveOrderItems, PricingError } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    // The amount is never taken from the client — it's recomputed here
    // from the actual product catalog so a tampered request can't create
    // a real Razorpay order for less than the cart is actually worth.
    const { subtotal } = resolveOrderItems(items);

    const order = await createRazorpayOrder(subtotal, `receipt_${Date.now()}`);
    return NextResponse.json({ order, subtotal });
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
