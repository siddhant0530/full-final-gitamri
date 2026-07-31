import { NextRequest, NextResponse } from "next/server";
import { getInviteByToken } from "@/lib/reviews-store";
import { getOrders } from "@/lib/order-store";

// GET /api/reviews/invite/:token -> the order's items, so the review
// page knows which products to show a rating/text box for. Public
// (unauthenticated) by design — the token itself is the credential,
// same pattern as the order tracking ID lookup.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  if (!invite) {
    return NextResponse.json({ error: "This review link is invalid or has expired." }, { status: 404 });
  }

  // getOrders() is the simplest way to reuse the existing Order+OrderItem
  // join logic; fine at this scale, and this route isn't hit often.
  const orders = await getOrders();
  const order = orders.find((o) => o.id === invite.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    alreadyUsed: !!invite.usedAt,
    order: {
      trackingId: order.trackingId,
      items: order.items.map((i) => ({ productId: i.productId, name: i.name })),
    },
  });
}
