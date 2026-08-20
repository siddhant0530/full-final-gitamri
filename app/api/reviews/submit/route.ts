import { NextRequest, NextResponse } from "next/server";
import { getInviteByToken, markInviteUsed, submitReview } from "@/lib/reviews-store";
import { getOrders } from "@/lib/order-store";

interface SubmitBody {
  token: string;
  customerName: string;
  photo?: string;
  reviews: { productId: string; rating: number; text: string }[];
}

// POST /api/reviews/submit -> one or more reviews for the products in a
// single order, gated by the invite token. Always saved as PENDING —
// nothing here goes public until an admin approves it.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as SubmitBody;
  const { token, customerName, photo, reviews } = body;

  if (!token || !customerName?.trim() || !reviews?.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (reviews.some((r) => !r.productId || !r.rating || r.rating < 1 || r.rating > 5 || !r.text?.trim())) {
    return NextResponse.json({ error: "Each review needs a rating (1-5) and some text." }, { status: 400 });
  }

  const invite = await getInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "This review link is invalid or has expired." }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "This order has already been reviewed. Thank you!" }, { status: 409 });
  }

  // Only allow reviewing products that were actually in this order —
  // the token proves the order, but the product list must match too.
  const orders = await getOrders();
  const order = orders.find((o) => o.id === invite.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const orderedProductIds = new Set(order.items.map((i) => i.productId));
  const validReviews = reviews.filter((r) => orderedProductIds.has(r.productId));
  if (validReviews.length === 0) {
    return NextResponse.json({ error: "None of these products match your order." }, { status: 400 });
  }

  try {
    await Promise.all(
      validReviews.map((r) =>
        submitReview({
          orderId: invite.orderId,
          productSlug: r.productId, // productId === slug across the catalog
          customerName: customerName.trim(),
          rating: r.rating,
          text: r.text.trim(),
          photo: photo || undefined,
        })
      )
    );
    await markInviteUsed(token);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not save your review. Please try again." }, { status: 500 });
  }
}